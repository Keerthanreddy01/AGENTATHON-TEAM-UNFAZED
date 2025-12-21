export interface Person {
  id: string
  name: string
  relationship: string
  confidence: number
  meetings: number
  lastInteraction: string
  timestamp?: string
}

export interface FaceDetection {
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
}

export interface SSEMessage {
  type: "person_detected" | "person_changed" | "connection" | "error"
  data: Person | Record<string, unknown>
}
