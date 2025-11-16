"use client"
import { useState, useEffect } from "react"
import VerticalNavbar from "./components/VerticalNavbar"
import Map from "./components/map"
import Daashboard from "./components/dashboard"
import Analytics from "./components/analytics"

export interface Node {
  id: string
  name: string
  coords: [number, number]
  temperature: number
  humidity: number
  rainfall: number
  heat_absorption: number
  impervious_surface: number
  flood_history: number
  heatwave_history: number
  hazard_prob: number
  trees_missing: number
  shade_missing: number
  drainage_missing: number
  cvs?: number
  status?: string
}

export default function DashboardPage() {
  const [page, setPage] = useState("map")
  const [nodes, setNodes] = useState<Node[]>([
    { id: "1", name: "Node 1", coords: [-121.987, 37.55], temperature:0.7, humidity:0.4, rainfall:0.5, heat_absorption:0.8, impervious_surface:0.7, flood_history:0.2, heatwave_history:0.3, hazard_prob:0.6, trees_missing:0.8, shade_missing:0.7, drainage_missing:0.9 },
    { id: "2", name: "Node 2", coords: [-122.045, 37.566], temperature:0.6, humidity:0.6, rainfall:0.7, heat_absorption:0.5, impervious_surface:0.2, flood_history:0.1, heatwave_history:0.1, hazard_prob:0.2, trees_missing:0.1, shade_missing:0.3, drainage_missing:0.2 },
    { id: "3", name: "Node 3", coords: [-121.995, 37.562], temperature:0.8, humidity:0.5, rainfall:0.6, heat_absorption:0.7, impervious_surface:0.6, flood_history:0.3, heatwave_history:0.4, hazard_prob:0.5, trees_missing:0.6, shade_missing:0.5, drainage_missing:0.7 },
    { id: "4", name: "Node 4", coords: [-121.980, 37.558], temperature:0.5, humidity:0.7, rainfall:0.4, heat_absorption:0.6, impervious_surface:0.5, flood_history:0.2, heatwave_history:0.2, hazard_prob:0.3, trees_missing:0.4, shade_missing:0.6, drainage_missing:0.5 },
    { id: "5", name: "Node 5", coords: [-122.010, 37.570], temperature:0.6, humidity:0.4, rainfall:0.5, heat_absorption:0.8, impervious_surface:0.7, flood_history:0.3, heatwave_history:0.3, hazard_prob:0.4, trees_missing:0.7, shade_missing:0.6, drainage_missing:0.8 },
  ])


  return (
    <div>
      <VerticalNavbar onPageChange={setPage} />

      {page === "map" && <Map nodes={nodes} setNodes={setNodes} />}
      {page === "analytics" && <Analytics nodes={nodes} />}
      {page === "device" && <Daashboard nodes={nodes} setNodes={setNodes} />}
      {page === "ai" && <div>ai page here</div>}
      {page === "profile" && <div>profile page here</div>}
    </div>
  )
}
