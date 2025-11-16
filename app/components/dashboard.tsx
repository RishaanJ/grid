"use client";

import { useEffect, useState } from "react";
import { Droplets, Waves } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Node } from "../page";

interface DashboardProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

export default function Daashboard({ nodes, setNodes }: DashboardProps) {
  const [data, setData] = useState<any>(null);

  // helper: recompute CVS for a node
  async function computeCVS(node: Node) {
    try {
      const res = await fetch("http://localhost:8000/compute_cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(node),
      });
      const json = await res.json();
      return { ...node, cvs: json.cvs, status: json.status };
    } catch (err) {
      console.error("CVS compute failed:", err);
      return node;
    }
  }

  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("http://10.0.0.136/data");
      const json = await res.json();
      setData(json);

      let updatedNodes = [...nodes];

      // add/update Water Sensor node dynamically
      if (json.water.connected) {
        const waterNodeIndex = updatedNodes.findIndex(n => n.id === "water");
        const waterNode = {
          id: "water",
          name: "Water Sensor",
          coords: [-122.054076,37.572966], // 37.572966, -122.054076
          temperature: json.water.value, // or map to whatever field
          humidity: 0,
          rainfall: 0,
          heat_absorption: 0,
          impervious_surface: 0,
          flood_history: 0,
          heatwave_history: 0,
          hazard_prob: 0,
          trees_missing: 0,
          shade_missing: 0,
          drainage_missing: 0,
        };

        if (waterNodeIndex > -1) {
          updatedNodes[waterNodeIndex] = waterNode;
        } else {
          updatedNodes.push(waterNode);
        }
      }

      // recompute CVS for all nodes
      updatedNodes = await Promise.all(
        updatedNodes.map(async (n) => await computeCVS(n))
      );

      setNodes(updatedNodes);

    } catch (err) {
      console.error("Failed to fetch device data:", err);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [nodes, setNodes]);


  if (!data)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center ml-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading sensor data...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background ml-64">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <h1 className="text-3xl font-semibold tracking-tight">Devices</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {data.water.connected && (
            <Card className="p-6 border">
              <CardContent className="flex flex-col gap-4 p-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-blue-500 text-white">
                    <Droplets className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Water Sensor</p>
                    <p className="text-sm text-muted-foreground">
                      Active · Monitoring
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-blue-600">
                      {data.water.value}
                    </span>
                    <span className="text-muted-foreground text-sm">units</span>
                  </div>

                  <div className="mt-2 h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(data.water.value, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.humidity.connected && (
            <Card className="p-6 border">
              <CardContent className="flex flex-col gap-4 p-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-cyan-500 text-white">
                    <Waves className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">Humidity Sensor</p>
                    <p className="text-sm text-muted-foreground">
                      Active · Monitoring
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-cyan-600">
                      {data.humidity.value}
                    </span>
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>

                  <div className="mt-2 h-2 w-full bg-cyan-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(data.humidity.value, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
