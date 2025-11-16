from io import BytesIO
import os
import numpy as np
from PIL import Image
import requests
import cv2
import matplotlib.pyplot as plt


def fetch_google_satellite(api_key: str, center: str, zoom: int=18, size=(640,640), scale=2, maptype="satellite"):
    """
    center: "lat,lng" or address
    size: (width, height) max 640x640 for free scale=1 (scale=2 allows 1280 but check limits)
    Returns: PIL.Image
    """
    base = "https://maps.googleapis.com/maps/api/staticmap"
    params = {
        "center": center,
        "zoom": str(zoom),
        "size": f"{size[0]}x{size[1]}",
        "scale": str(scale),
        "maptype": maptype,
        "key": api_key
    }
    resp = requests.get(base, params=params, timeout=30)
    resp.raise_for_status()
    return Image.open(BytesIO(resp.content)).convert("RGB")

# -------------------------
# 2) Baseline rule-based classifier (RGB heuristics)
#    - vegetation estimate via Excess-G / ExG
#    - impervious estimate via grayness + low-green
# -------------------------
def baseline_classify_rgb(img_pil, veg_thresh=0.05, imperv_thresh=0.12, morphological=True):
    """
    Input: PIL Image (RGB)
    Returns: dict with masks and percent cover
    """
    img = np.array(img_pil).astype(np.float32) / 255.0  # H x W x 3, channels R,G,B
    R = img[..., 0]
    G = img[..., 1]
    B = img[..., 2]

    # diddy bop 76
    # hello judge
    exg = 2*G - R - B
    exg_norm = (exg - exg.min()) / (exg.max() - exg.min() + 1e-9)

    # vegetation mask
    veg_mask = exg_norm > veg_thresh

    # impervious heuristic:
    brightness = (R + G + B) / 3.0
    # saturation approximation
    maxc = np.max(img, axis=2)
    minc = np.min(img, axis=2)
    sat = (maxc - minc) / (maxc + 1e-9)
    imperv_score = (1 - G) * brightness * (1 - sat)  # heuristic
    imperv_score_norm = (imperv_score - imperv_score.min()) / (imperv_score.max() - imperv_score.min() + 1e-9)
    imperv_mask = imperv_score_norm > imperv_thresh

    # optional morphological clean-up
    if morphological:
        veg_mask = morphology_clean(veg_mask.astype(np.uint8), kernel_size=5)
        imperv_mask = morphology_clean(imperv_mask.astype(np.uint8), kernel_size=7)

    h, w = veg_mask.shape
    veg_pct = veg_mask.sum() / (h*w) * 100
    imperv_pct = imperv_mask.sum() / (h*w) * 100

    return {
        "veg_mask": veg_mask.astype(np.uint8),
        "imperv_mask": imperv_mask.astype(np.uint8),
        "veg_pct": veg_pct,
        "imperv_pct": imperv_pct,
        "exg": exg_norm,
        "imperv_score": imperv_score_norm
    }

def morphology_clean(binary_img, kernel_size=5):
    """
    binary_img: uint8 0/1
    returns cleaned binary mask (0/1)
    """
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    opened = cv2.morphologyEx(binary_img, cv2.MORPH_OPEN, k)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, k)
    return (closed > 0).astype(np.uint8)

def overlay_masks(img_pil, veg_mask, imperv_mask, alpha=0.5):
    img = np.array(img_pil).astype(np.uint8).copy()
    overlay = img.copy()
    # veg -> green overlay
    overlay[veg_mask==1] = (0, 200, 0)
    # impervious -> red overlay (but keep precedence)
    overlay[imperv_mask==1] = (200, 0, 0)
    out = cv2.addWeighted(img, 1-alpha, overlay, alpha, 0)
    return Image.fromarray(out)

def show_results(img_pil, results):
    fig, ax = plt.subplots(1,3, figsize=(15,6))
    ax[0].imshow(img_pil); ax[0].set_title("satellite RGB"); ax[0].axis('off')
    overlay = overlay_masks(img_pil, results['veg_mask'], results['imperv_mask'])
    ax[1].imshow(overlay); ax[1].set_title(f"overlay (veg {results['veg_pct']:.1f}%, imperv {results['imperv_pct']:.1f}%)"); ax[1].axis('off')
    ax[2].imshow(results['exg'], cmap='RdYlGn'); ax[2].set_title("exg index (vegetation)"); ax[2].axis('off')
    plt.tight_layout()
    plt.show()


# This is scaffold code: you must train or load a model checkpoint compatible with your classes.
def build_predictor_smp(checkpoint_path=None, device='cpu', model_name='unet++', encoder_name='resnet34', n_classes=3):
    """
    returns a function predict(img_pil) -> mask (H x W with class ids)
    requires: segmentation_models_pytorch
    """
    import torch
    import segmentation_models_pytorch as smp

    model = smp.Unet(encoder_name=encoder_name, encoder_weights='imagenet', classes=n_classes, activation=None)
    if checkpoint_path is not None:
        state = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state)
    model.to(device)
    model.eval()

    def predict(img_pil):
        x = np.array(img_pil).astype(np.float32) / 255.0
        # H, W, 3 -> CHW batch
        x_t = torch.from_numpy(x.transpose(2,0,1)).unsqueeze(0).to(device).float()
        with torch.no_grad():
            logits = model(x_t)
            # logits shape: (1, n_classes, H, W)
            probs = torch.softmax(logits, dim=1)
            label = probs.argmax(dim=1).squeeze(0).cpu().numpy().astype(np.uint8)
        return label

    return predict

# -------------------------
# 5) Training outline (high-level)
# -------------------------
TRAINING_NOTES = """
Training pipeline (outline):

1) Datasets: collect high-res RGB aerial imagery + pixel masks for classes:
   - vegetation / tree canopy
   - impervious surface (roads, roofs, concrete)
   - water / other (optional)

   public datasets to consider: SpaceNet, DeepGlobe Land Cover, ISPRS Potsdam/Vaihingen (check licensing),
   or create your own labelled tiles.

2) Preprocessing:
   - tile large scenes into 256/512 patches
   - data augmentation: flips, rotations, color jitter, random crops
   - normalization: imagenet stats if using pretrained encoder

3) Model:
   - segmentation_models_pytorch (smp): Unet, Unet++, or DeepLabV3+ with a ResNet or EfficientNet encoder
   - loss: combination of CrossEntropy + DiceLoss for class imbalance

4) Training example (PyTorch + SMP):
   - optimizer: AdamW, lr ~ 1e-4
   - scheduler: CosineLR or ReduceLROnPlateau
   - metrics: IoU per class, mIoU, F1

5) Export:
   - export best model checkpoint and use the predictor (build_predictor_smp) to run on tiles

"""

if __name__ == "__main__":

    try:
        img
    except NameError:
        img = Image.new("RGB", (640,640), (200,200,200))

    results = baseline_classify_rgb(img, veg_thresh=0.15, imperv_thresh=0.12, morphological=True)
    print(f"vegetation cover: {results['veg_pct']:.2f}%")
    print(f"impervious cover: {results['imperv_pct']:.2f}%")
    show_results(img, results)


