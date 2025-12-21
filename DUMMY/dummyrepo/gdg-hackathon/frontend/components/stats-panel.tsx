"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Activity, Users, Clock, Zap } from "lucide-react"

interface StatsData {
  totalDetections: number
  uniquePersons: number
  avgConfidence: number
  uptime: string
}

export function StatsPanel() {
  const [stats, setStats] = useState<StatsData>({
    totalDetections: 0,
    uniquePersons: 0,
    avgConfidence: 95,
    uptime: "00:00"
  })
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const updateUptime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      setStats(prev => ({
        ...prev,
        uptime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }))
    }

    const interval = setInterval(updateUptime, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    const INFERENCE_BACKEND_URL = "http://localhost:8000"
    let eventSource: EventSource | null = null
    const seenPersons = new Set<string>()

    try {
      eventSource = new EventSource(`${INFERENCE_BACKEND_URL}/stream/inference`)

      eventSource.addEventListener('inference', (event) => {
        try {
          const data = JSON.parse(event.data)
          seenPersons.add(data.person_id)
          
          setStats(prev => ({
            ...prev,
            totalDetections: prev.totalDetections + 1,
            uniquePersons: seenPersons.size
          }))
        } catch (err) {
          console.error('[StatsPanel] Parse error:', err)
        }
      })
    } catch (err) {
      console.error('[StatsPanel] Connection error:', err)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  const statItems = [
    {
      icon: Activity,
      label: "Total Detections",
      value: stats.totalDetections,
      color: "text-blue-500"
    },
    {
      icon: Users,
      label: "Unique Persons",
      value: stats.uniquePersons,
      color: "text-green-500"
    },
    {
      icon: Zap,
      label: "Confidence",
      value: `${stats.avgConfidence}%`,
      color: "text-yellow-500"
    },
    {
      icon: Clock,
      label: "Session Time",
      value: stats.uptime,
      color: "text-purple-500"
    }
  ]

  return (
    <Card className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border-white/10 text-white z-50">
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3">System Stats</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-white/5 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-white/60">{item.label}</span>
              </div>
              <div className="text-lg font-bold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
