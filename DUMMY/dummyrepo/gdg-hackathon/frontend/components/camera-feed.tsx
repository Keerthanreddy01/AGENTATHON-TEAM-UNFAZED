'use client'

import type { RefObject } from 'react'

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  isActive: boolean
  glassesMode?: boolean
}

export default function CameraFeed({ videoRef, canvasRef, isActive, glassesMode }: CameraFeedProps) {
  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${glassesMode ? 'blur-md' : ''}`}
        autoPlay
        playsInline
        muted
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95">
          <div className="text-center space-y-5">
            <div className="text-5xl">🤖</div>
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/40">Fillora</p>
              <h2 className="text-white text-3xl font-semibold">Spatial Assist</h2>
            </div>
            <p className="text-white/60 text-base">Press “Start AR System” to connect</p>
          </div>
        </div>
      )}
    </div>
  )
}
