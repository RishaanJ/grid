"use client"
import { Node } from "../page"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import SafetyScoreCard from "./SafetyScoreCard"

interface AnalyticsProps {
  nodes: Node[]
}

export default function Analytics({ nodes }: AnalyticsProps) {
  const avgCVS = nodes.length ? (nodes.reduce((a, n) => a + n.cvs, 0) / nodes.length).toFixed(1) : 0
  const offlineNodes = nodes.filter(n => !n.lastUpdate || new Date().getTime() - new Date(n.lastUpdate).getTime() > 24 * 60 * 1000).length

  return (
    <div className="min-h-screen bg-white p-8 ml-24">
      <div className="mx-auto max-w-7xl space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="p-6 border-2 border-black">
            <CardContent>
              <div className="text-sm font-medium uppercase text-gray-600">Avg. CVS</div>
              <div className="mt-2 text-4xl font-bold">{avgCVS}</div>
            </CardContent>
          </Card>
          <Card className="p-6 border-2 border-black bg-black text-white">
            <CardContent>
              <div className="text-sm font-medium uppercase text-gray-400">Offline Nodes</div>
              <div className="mt-2 text-4xl font-bold">{offlineNodes}</div>
            </CardContent>
          </Card>
          <Card className="p-6 border-2 border-black">
            <CardContent>
              <div className="text-sm font-medium uppercase text-gray-600">Total Nodes</div>
              <div className="mt-2 text-4xl font-bold">{nodes.length}</div>
            </CardContent>
          </Card>
        </div>
        <SafetyScoreCard />

        <Card className="p-6 border-2 border-black">
          <h2 className="mb-6 text-xl font-bold uppercase">Community Vulnerability (CVS)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nodes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="id" />
                <YAxis domain={[0,100]} />
                <Tooltip />
                <Bar dataKey="cvs" fill="#000" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
