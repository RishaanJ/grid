from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NodeData(BaseModel):
    temperature: float         # °C, normalized 0-1
    humidity: float            # %, normalized 0-1
    rainfall: float            # mm/day, normalized 0-1
    heat_absorption: float     # normalized 0-1
    impervious_surface: float  # fraction 0-1
    flood_history: float       # normalized 0-1
    heatwave_history: float    # normalized 0-1
    hazard_prob: float         # 0-1
    trees_missing: float       # 0-1
    shade_missing: float       # 0-1
    drainage_missing: float    # 0-1

@app.post("/compute_cvs")
async def compute_cvs(node: NodeData):
    # ---------- 1. Sensor score ----------
    sensor_score = (
        node.temperature * 0.5 +
        (1 - node.humidity) * 0.3 +
        (1 - node.rainfall) * 0.2
    )

    # ---------- 2. Historical score ----------
    historical_score = (
        node.flood_history * 0.5 +
        node.heatwave_history * 0.5
    )


    infra_score = (
        node.trees_missing * 0.4 +
        node.shade_missing * 0.3 +
        node.drainage_missing * 0.3
    )


    cvs = (
        sensor_score * 0.2 +
        node.heat_absorption * 0.2 +
        node.impervious_surface * 0.15 +
        historical_score * 0.15 +
        node.hazard_prob * 0.2 +
        infra_score * 0.1
    )

    cvs = max(0, min(1, cvs))
    status = "green" if cvs <= 0.45 else "yellow" if cvs <= 0.7 else "red"

    return {
        "cvs": round(cvs, 3),
        "status": status
    }
