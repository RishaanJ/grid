"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

export default function SafetyScoreCard() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setTimeout(() => setProgress(86.66), 200) // smooth start
  }, [])

  return (
    <Card className="p-6 border-2 border-black">
      <CardContent>
        <div className="text-sm font-medium uppercase text-gray-600">Safety Score</div>

        <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden mt-4">
          <div
            className="bg-black h-full rounded-full transition-all duration-[2000ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 text-lg font-semibold">{progress}%</div>
      </CardContent>
    </Card>
  )
}
