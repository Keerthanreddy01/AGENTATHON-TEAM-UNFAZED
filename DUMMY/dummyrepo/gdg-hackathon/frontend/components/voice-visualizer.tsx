"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"

interface VoiceVisualizerProps {
  stream: MediaStream | null
  isMuted: boolean
}

export function VoiceVisualizer({ stream, isMuted }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!stream || isMuted) {
      setIsActive(false)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    try {
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      source.connect(analyser)
      analyserRef.current = analyser

      setIsActive(true)
      visualize()
    } catch (err) {
      console.error("[VoiceVisualizer] Setup error:", err)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [stream, isMuted])

  const visualize = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current

    if (!canvas || !analyser) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      // Draw bars
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8

        // Color gradient based on amplitude
        const hue = (i / bufferLength) * 120 + 200 // Blue to cyan
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.8)`

        ctx.fillRect(
          x,
          canvas.height - barHeight,
          barWidth,
          barHeight
        )

        x += barWidth + 1
      }
    }

    draw()
  }

  return (
    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10">
      <div className="flex items-center gap-2">
        {isMuted ? (
          <MicOff className="w-4 h-4 text-red-500" />
        ) : (
          <Mic className={`w-4 h-4 ${isActive ? "text-green-500" : "text-gray-400"}`} />
        )}
        <span className="text-xs text-white/80">
          {isMuted ? "Muted" : isActive ? "Listening..." : "No audio"}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={120}
        height={40}
        className="rounded"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  )
}
