"use client"
import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { Node } from "../page"


mapboxgl.accessToken =
  "x"

interface MapProps {
  nodes: Node[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
}

export default function Map({ nodes, setNodes }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  function getColor(node?: Node) {
    if (!node) return "#999";

    if (node.id === "water") return "#3b82f6"; // blue for water sensor

    switch (node.status) {
      case "green": return "#22c55e";
      case "yellow": return "#facc15";
      case "red": return "#ff3b30";
      default: return "#999";
    }
  }
  
  function deselectNode() {
    setSelectedNode(null)

    if (popupRef.current) popupRef.current.remove()
    if (map.current) {
      map.current.flyTo({ center: [-121.9886, 37.5483], zoom: 12, speed: 0.8 })
      map.current.setPaintProperty("node-circles", "circle-radius", 10)
    }
  }



  function getGeoJSON(nodes: Node[]) {
    return {
      type: "FeatureCollection",
      features: nodes.map((n) => ({
        type: "Feature",
        properties: { id: n.id, color: getColor(n), cvs: n.cvs },
        geometry: { type: "Point", coordinates: n.coords },
      })),
    }
  }

  // fetch CVS/status once
  useEffect(() => {
    async function fetchCVS(node: Node) {
      const res = await fetch("http://localhost:8000/compute_cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(node),
      })
      const data = await res.json()
      return { ...node, cvs: data.cvs, status: data.status }
    }

    async function initNodes() {
      const updated = await Promise.all(nodes.map(fetchCVS))
      setNodes(updated) // updates parent -> analytics sees it
    }

    initNodes()
  }, [])

  // init map
  useEffect(() => {
    if (!mapContainer.current) return
    if (!nodes.every((n) => n.status)) return

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-121.9886, 37.5483],
        zoom: 12,
      })

      map.current.on("load", () => {
        popupRef.current = new mapboxgl.Popup({ closeButton: false })

        map.current!.addSource("nodes", {
          type: "geojson",
          data: getGeoJSON(nodes),
        })

        map.current!.addLayer({
          id: "node-circles",
          type: "circle",
          source: "nodes",
          paint: {
            "circle-radius": ["case", ["==", ["get", "id"], selectedNode], 16, 10],
            "circle-color": ["get", "color"],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        })

        map.current!.on("click", "node-circles", (e) => {
          const id = e.features![0].properties!.id
          openPopupForNode(id)
        })
        

        map.current!.on("movestart", () => popupRef.current!.remove())
      })
    } else {
      // ✅ check if source exists before updating
      const source = map.current.getSource("nodes") as mapboxgl.GeoJSONSource | undefined
      if (source) source.setData(getGeoJSON(nodes))
    }
  }, [nodes, selectedNode])


  function openPopupForNode(id: string) {
    const node = nodes.find((n) => n.id === id)
    if (!node || !map.current || !popupRef.current) return

    setSelectedNode(id)

    popupRef.current
      .setLngLat(node.coords)
      .setHTML(`
        <div style="font-size:14px; padding:4px;">
          <b>${node.name}</b><br/>
          CVS: ${node.cvs != null ? (node.cvs * 100).toFixed(2) : "-"}%<br/>
          Temp: ${node.temperature}<br/>
          Humidity: ${node.humidity}<br/>
        </div>
      `)
      .addTo(map.current)

    map.current.flyTo({ center: node.coords, zoom: 14, speed: 0.8 })

    map.current.setPaintProperty("node-circles", "circle-radius", [
      "case",
      ["==", ["get", "id"], id],
      16,
      10,
    ])

    // ✅ listen for a single click outside node to deselect
    const handleMapClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      const features = map.current!.queryRenderedFeatures(e.point, { layers: ["node-circles"] })
      if (!features.length) {
        deselectNode()
        map.current!.off("click", handleMapClick) // remove listener
      }
    }

    map.current.on("click", handleMapClick)
  }


  return (
    <div className="w-full h-full">
      <div ref={mapContainer} style={{ width: "100vw", height: "100vh" }} />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-4 w-64 z-50">
        {nodes.map((n) => {
          const color = getColor(n.status)
          return (
            <button
              key={n.id}
              onClick={() => openPopupForNode(n.id)}
              style={{
                backgroundColor: selectedNode === n.id ? color : "#fff",
                border: selectedNode === n.id ? `2px solid ${color}` : "1px solid #ddd",
              }}
              className="w-full p-4 rounded-xl shadow-md text-left transition"
            >
              <div className="font-semibold text-lg">{n.name}</div>
              <div className="text-sm opacity-80">
                CVS: {n.cvs != null ? (n.cvs * 100).toFixed(2) : "-"}%
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
