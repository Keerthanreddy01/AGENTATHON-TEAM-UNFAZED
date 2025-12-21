'use client'

import { useEffect, useState, useRef, type RefObject } from 'react'
import type { Person } from '@/types'

interface FaceDetectionBox {
  originX: number
  originY: number
  width: number
  height: number
}

interface ARGlassesViewProps {
  person: Person | null
  isActive: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  boxes: FaceDetectionBox[]
}

export default function ARGlassesView({ person, isActive, videoRef, canvasRef, boxes }: ARGlassesViewProps) {
  const [battery, setBattery] = useState(87)
  const leftLensCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightLensCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive) {
      setBattery(87)
      return
    }

    const interval = window.setInterval(() => {
      setBattery((prev) => Math.max(20, prev - 1))
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [isActive])

  // Draw unblurred video into lens canvases with person name labels
  useEffect(() => {
    if (!isActive) return

    let animationFrameId: number

    const drawLenses = () => {
      const video = videoRef.current
      const leftCanvas = leftLensCanvasRef.current
      const rightCanvas = rightLensCanvasRef.current
      const detectionCanvas = canvasRef.current

      if (video && leftCanvas && rightCanvas && video.readyState >= 2) {
        const leftCtx = leftCanvas.getContext('2d')
        const rightCtx = rightCanvas.getContext('2d')

        if (leftCtx && rightCtx) {
          // Clear canvases
          leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height)
          rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height)

          // Draw video frame to both lenses
          leftCtx.drawImage(video, 0, 0, leftCanvas.width, leftCanvas.height)
          rightCtx.drawImage(video, 0, 0, rightCanvas.width, rightCanvas.height)

          // Copy face detection boxes onto the lens canvases
          if (detectionCanvas) {
            leftCtx.drawImage(detectionCanvas, 0, 0, leftCanvas.width, leftCanvas.height)
            rightCtx.drawImage(detectionCanvas, 0, 0, rightCanvas.width, rightCanvas.height)
          }

          // Draw person name label above detected face (scaled to lens canvas)
          if (person && person.name !== 'Unknown' && boxes.length > 0) {
            const drawNameLabel = (ctx: CanvasRenderingContext2D) => {
              // Use first detected face box as anchor
              const box = boxes[0]
              const sourceWidth = video.videoWidth || detectionCanvas?.width || ctx.canvas.width
              const sourceHeight = video.videoHeight || detectionCanvas?.height || ctx.canvas.height
              const scaleX = ctx.canvas.width / Math.max(sourceWidth, 1)
              const scaleY = ctx.canvas.height / Math.max(sourceHeight, 1)

              const scaledOriginX = box.originX * scaleX
              const scaledOriginY = box.originY * scaleY
              const scaledWidth = box.width * scaleX
              // const scaledHeight = box.height * scaleY

              const name = person.name
              const relationship = person.relationship ? person.relationship.toUpperCase() : ''
              const confidence = person.confidence ? `CONF: ${Math.round(person.confidence * 100)}%` : ''
              const meetings = person.meetings ? `MEETINGS: ${person.meetings}` : ''
              const tagline = person.lastInteraction ? `"${person.lastInteraction}"` : ''

              const nameFontSize = 24
              const metaFontSize = 12
              const taglineFontSize = 14
              const padding = 16
              const lineHeight = 1.4

              ctx.font = `bold ${nameFontSize}px sans-serif`
              const nameMetrics = ctx.measureText(name)

              ctx.font = `bold ${metaFontSize}px sans-serif`
              const relationshipMetrics = ctx.measureText(relationship)

              ctx.font = `${metaFontSize}px monospace`
              const statsText = [confidence, meetings].filter(Boolean).join(' | ')
              const statsMetrics = ctx.measureText(statsText)

              ctx.font = `italic ${taglineFontSize}px sans-serif`
              const taglineMetrics = ctx.measureText(tagline)

              const textWidth = Math.max(nameMetrics.width, relationshipMetrics.width, statsMetrics.width, taglineMetrics.width)
              const labelWidth = textWidth + padding * 2

              // Calculate total height
              let labelHeight = padding * 2 + nameFontSize
              if (relationship) labelHeight += metaFontSize + 4
              if (statsText) labelHeight += metaFontSize + 4
              if (tagline) labelHeight += taglineFontSize * lineHeight + 8

              // Position above the scaled face box
              let x = scaledOriginX + scaledWidth / 2 - labelWidth / 2
              let y = scaledOriginY - labelHeight - 20

              // Keep label within canvas bounds
              const margin = 12
              if (y < margin) y = margin
              if (x < margin) x = margin
              if (x + labelWidth > ctx.canvas.width - margin) {
                x = ctx.canvas.width - margin - labelWidth
              }

              // Draw background (Black Glassmorphism)
              ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
              ctx.shadowBlur = 20
              ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'

              // Rounded rectangle
              const radius = 12
              ctx.beginPath()
              ctx.roundRect(x, y, labelWidth, labelHeight, radius)
              ctx.fill()

              // Border
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
              ctx.lineWidth = 1
              ctx.stroke()

              // Reset shadow
              ctx.shadowBlur = 0

              let currentY = y + padding

              // Draw Name
              ctx.fillStyle = '#ffffff'
              ctx.textAlign = 'left'
              ctx.textBaseline = 'top'
              ctx.font = `bold ${nameFontSize}px sans-serif`
              ctx.fillText(name, x + padding, currentY)
              currentY += nameFontSize + 4

              // Draw Relationship
              if (relationship) {
                ctx.fillStyle = '#22d3ee' // Cyan-400
                ctx.font = `bold ${metaFontSize}px sans-serif`
                ctx.fillText(relationship, x + padding, currentY)
                currentY += metaFontSize + 4
              }

              // Draw Stats
              if (statsText) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.font = `${metaFontSize}px monospace`
                ctx.fillText(statsText, x + padding, currentY)
                currentY += metaFontSize + 8
              }

              // Draw Tagline
              if (tagline) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
                ctx.font = `italic ${taglineFontSize}px sans-serif`
                ctx.fillText(tagline, x + padding, currentY)
              }
            }

            drawNameLabel(leftCtx)
            drawNameLabel(rightCtx)
          }
        }
      }

      animationFrameId = requestAnimationFrame(drawLenses)
    }

    drawLenses()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isActive, videoRef, canvasRef, person, boxes])

  return (
    <div className="absolute inset-0 pointer-events-none z-50 animate-fadeIn">
      {/* Glasses frame structure */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[1400px] h-[70%] flex items-center justify-center gap-8">
        {/* Left Lens */}
        <div className="relative h-full w-[45%]">
          <div className="relative h-full w-full rounded-[50%] overflow-hidden border-[6px] border-[#1a1a2e] shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <canvas
              ref={leftLensCanvasRef}
              width={800}
              height={600}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />

            {/* HUD Overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 800 600">
              {/* Central Crosshair */}
              <g stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1">
                <line x1="380" y1="300" x2="420" y2="300" />
                <line x1="400" y1="280" x2="400" y2="320" />
                <circle cx="400" cy="300" r="30" fill="none" strokeDasharray="4 4" />
              </g>

              {/* Corner Brackets */}
              <g stroke="rgba(0, 255, 255, 0.3)" strokeWidth="2" fill="none">
                <path d="M100,150 L100,100 L150,100" />
                <path d="M700,150 L700,100 L650,100" />
                <path d="M100,450 L100,500 L150,500" />
                <path d="M700,450 L700,500 L650,500" />
              </g>

              {/* Data Lines */}
              <g fill="rgba(0, 255, 255, 0.2)">
                <rect x="100" y="280" width="2" height="40" />
                <rect x="700" y="280" width="2" height="40" />
              </g>
            </svg>
          </div>
        </div>

        {/* Bridge */}
        <div className="w-12 h-3 bg-[#1a1a2e] rounded-full" />

        {/* Right Lens */}
        <div className="relative h-full w-[45%]">
          <div className="relative h-full w-full rounded-[50%] overflow-hidden border-[6px] border-[#1a1a2e] shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <canvas
              ref={rightLensCanvasRef}
              width={800}
              height={600}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />

            {/* HUD Overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 800 600">
              {/* Central Crosshair */}
              <g stroke="rgba(0, 255, 255, 0.5)" strokeWidth="1">
                <line x1="380" y1="300" x2="420" y2="300" />
                <line x1="400" y1="280" x2="400" y2="320" />
                <circle cx="400" cy="300" r="30" fill="none" strokeDasharray="4 4" />
              </g>

              {/* Corner Brackets */}
              <g stroke="rgba(0, 255, 255, 0.3)" strokeWidth="2" fill="none">
                <path d="M100,150 L100,100 L150,100" />
                <path d="M700,150 L700,100 L650,100" />
                <path d="M100,450 L100,500 L150,500" />
                <path d="M700,450 L700,500 L650,500" />
              </g>

              {/* Data Lines */}
              <g fill="rgba(0, 255, 255, 0.2)">
                <rect x="100" y="280" width="2" height="40" />
                <rect x="700" y="280" width="2" height="40" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Status HUD - Top Right */}
      <div className="absolute top-5 right-5 font-mono text-xs text-cyan-400 bg-black/80 backdrop-blur-md px-4 py-3 rounded-lg border border-cyan-400/40 shadow-[0_0_20px_rgba(0,255,255,0.3)] pointer-events-auto">
        <div className="font-bold text-sm tracking-wider text-white mb-1">RAY-BAN | META</div>
        <div className="text-cyan-400/60">━━━━━━━━━━━━━━━━</div>
        <div className="mt-2 space-y-1">
          <div>AR MODE: <span className="text-green-400">● ACTIVE</span></div>
          <div>RECOGNITION: <span className="text-green-400">ON</span></div>
          <div>
            BATTERY:{' '}
            <span className={battery < 30 ? 'text-red-400' : 'text-green-400'}>{battery}%</span>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-blue-400 text-black px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_30px_rgba(0,255,255,0.5)] animate-slideDown">
        👓 Ray-Ban Meta Smart Glasses View
      </div>
    </div>
  )
}
