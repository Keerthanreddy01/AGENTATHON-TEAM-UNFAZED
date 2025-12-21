 "use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, User } from "lucide-react"

interface PersonData {
  name: string
  description: string
  relationship: string
  person_id: string
  timestamp?: string
}

interface ConversationHistoryProps {
  visible: boolean
}

export function ConversationHistory({ visible }: ConversationHistoryProps) {
  const [history, setHistory] = useState<PersonData[]>([])

  useEffect(() => {
    const INFERENCE_BACKEND_URL = "http://localhost:8000"
    let eventSource: EventSource | null = null

    if (visible) {
      try {
        eventSource = new EventSource(`${INFERENCE_BACKEND_URL}/stream/inference`)

        eventSource.addEventListener('inference', (event) => {
          try {
            const payload = JSON.parse(event.data)
            const lastUtterance = Array.isArray(payload.conversation) && payload.conversation.length > 0
              ? payload.conversation[payload.conversation.length - 1].text
              : 'Conversation updated'
            const mapped = {
              name: payload.person_id ?? 'Unknown person',
              relationship: 'Detected person',
              description: lastUtterance,
              person_id: payload.person_id ?? 'unknown',
            }
            setHistory(prev => {
              const newEntry = {
                ...mapped,
                timestamp: new Date().toLocaleTimeString()
              }
              return [newEntry, ...prev].slice(0, 10)
            })
          } catch (err) {
            console.error('[ConversationHistory] Parse error:', err)
          }
        })

        eventSource.onerror = (error) => {
          console.error('[ConversationHistory] SSE error:', error)
        }
      } catch (err) {
        console.error('[ConversationHistory] Connection error:', err)
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [visible])

  if (!visible || history.length === 0) {
    return null
  }

  return (
    <Card className="absolute top-4 right-4 w-80 bg-black/80 backdrop-blur-md border-white/10 text-white z-50">
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Detections
        </h3>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {history.map((person, idx) => (
              <div
                key={`${person.person_id}-${idx}`}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{person.name}</h4>
                      <span className="text-xs text-white/50 flex-shrink-0">
                        {person.timestamp}
                      </span>
                    </div>
                    
                    <p className="text-xs text-white/60 mb-1">
                      {person.relationship}
                    </p>
                    
                    <p className="text-xs text-white/70 line-clamp-2">
                      {person.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
}
