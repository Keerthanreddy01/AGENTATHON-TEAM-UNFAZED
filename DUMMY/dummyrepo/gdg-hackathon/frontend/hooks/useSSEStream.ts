'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Person, SSEMessage } from '@/types'

const DEMO_PERSONS: Person[] = [
  {
    id: '0',
    name: 'Keerthan Reddy',
    relationship: 'You',
    confidence: 0.98,
    meetings: 1,
    lastInteraction: 'Running the Fillora AR system with Ray-Ban smart glasses.',
  },
  {
    id: '1',
    name: 'Sarah Johnson',
    relationship: 'Your Daughter',
    confidence: 0.94,
    meetings: 47,
    lastInteraction: "Don't forget to take your medicine at 3 PM today. I'll call you tonight after work.",
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    relationship: 'Family Doctor',
    confidence: 0.89,
    meetings: 8,
    lastInteraction:
      "Your blood pressure is looking much better. Keep taking the medication and I'll see you next month.",
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    relationship: 'Neighbor & Friend',
    confidence: 0.96,
    meetings: 62,
    lastInteraction:
      "Would you like to join us for dinner on Friday? We're having a small barbecue in the backyard.",
  },
  {
    id: '4',
    name: 'James Thompson',
    relationship: 'Old College Friend',
    confidence: 0.91,
    meetings: 15,
    lastInteraction: "Remember our trip to the mountains in '85? We should plan another reunion soon with the old gang.",
  },
  {
    id: '5',
    name: 'Linda Martinez',
    relationship: 'Physical Therapist',
    confidence: 0.88,
    meetings: 23,
    lastInteraction: 'Great progress with your exercises! Try to do the stretches twice daily and avoid lifting heavy objects.',
  },
]

const createTimeoutSignal = (timeoutMs: number) => {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    const abortWithTimeout = AbortSignal as typeof AbortSignal & {
      timeout?: (ms: number) => AbortSignal
    }

    if (abortWithTimeout.timeout) {
      return abortWithTimeout.timeout(timeoutMs)
    }
  }

  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

export function useSSEStream(isActive: boolean) {
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const personIndexRef = useRef(0)

  const clearDemoInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const startDemoMode = useCallback(() => {
    clearDemoInterval()
    closeEventSource()
    setIsConnected(false)
    setConnectionError(true)

    const rotatePerson = () => {
      const person = DEMO_PERSONS[personIndexRef.current]
      setCurrentPerson({ ...person })
      personIndexRef.current = (personIndexRef.current + 1) % DEMO_PERSONS.length
    }

    rotatePerson()
    intervalRef.current = setInterval(rotatePerson, 5000)
  }, [clearDemoInterval, closeEventSource])

  const connectSSE = useCallback(() => {
    clearDemoInterval()
    closeEventSource()

    const eventSource = new EventSource('http://localhost:8000/stream/inference')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setConnectionError(false)
    }

    eventSource.addEventListener('inference', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as any
        // Map backend ConversationEvent payload to Person display model
        const lastUtterance = Array.isArray(payload.conversation) && payload.conversation.length > 0
          ? payload.conversation[payload.conversation.length - 1].text
          : 'Conversation updated'
        const person: Person = {
          id: payload.person_id ?? 'unknown',
          name: payload.name ?? payload.person_id ?? 'Unknown',
          relationship: payload.relationship ?? 'Detected person',
          confidence: payload.confidence ?? 0.95,
          meetings: payload.meetings ?? 0,
          lastInteraction: payload.lastInteraction ?? lastUtterance,
        }
        setCurrentPerson(person)
      } catch (error) {
        console.error('[SSE] Failed to parse message', error)
      }
    })

    eventSource.onerror = () => {
      setIsConnected(false)
      setConnectionError(true)
      startDemoMode()
    }
  }, [clearDemoInterval, closeEventSource, startDemoMode])

  const tryConnectBackend = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: createTimeoutSignal(2000),
      })

      if (!response.ok) {
        throw new Error('Health check failed')
      }

      setConnectionError(false)
      connectSSE()
    } catch (error) {
      console.log('[SSE] Backend not reachable, switching to demo mode')
      startDemoMode()
    }
  }, [connectSSE, startDemoMode])

  useEffect(() => {
    if (!isActive) {
      setCurrentPerson(null)
      setIsConnected(false)
      setConnectionError(false)
      clearDemoInterval()
      closeEventSource()
      return
    }

    let cancelled = false

    tryConnectBackend()

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !eventSourceRef.current && !intervalRef.current) {
        startDemoMode()
      }
    }, 2000)

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      clearDemoInterval()
      closeEventSource()
    }
  }, [isActive, clearDemoInterval, closeEventSource, startDemoMode, tryConnectBackend])

  return {
    currentPerson,
    isConnected,
    connectionError,
  }
}
