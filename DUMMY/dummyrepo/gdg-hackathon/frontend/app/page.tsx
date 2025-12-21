'use client'

import { useEffect, useMemo, useState } from 'react'
import CameraFeed from '@/components/camera-feed'
import { Play, Square, Glasses, MonitorPlay } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ARGlassesView from '@/components/ar-glasses-view'
import NotificationToast from '@/components/notification-toast'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import { useSSEStream } from '@/hooks/useSSEStream'
import { usePersonData } from '@/hooks/usePersonData'

export default function Home() {
  const [isActive, setIsActive] = useState(false)
  const [glassesMode, setGlassesMode] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const { videoRef, canvasRef, isDetecting, boxes, startDetection, stopDetection } = useFaceDetection()
  const { currentPerson, isConnected, connectionError } = useSSEStream(isActive)
  const { displayPerson } = usePersonData(currentPerson)

  useEffect(() => {
    if (displayPerson && displayPerson.name !== 'Unknown') {
      setShowNotification(true)
      const timer = window.setTimeout(() => setShowNotification(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [displayPerson?.id, displayPerson?.name])

  const handleStart = async () => {
    try {
      await startDetection()
      setIsActive(true)
    } catch (error) {
      console.error('Failed to start detection', error)
      alert('Camera access denied or not available')
    }
  }

  const handleStop = () => {
    stopDetection()
    setIsActive(false)
    setGlassesMode(false)
    setShowNotification(false)
  }

  const toggleGlasses = () => {
    setGlassesMode((prev) => !prev)
  }

  const faceLabels = useMemo(() => {
    if (!isActive || !displayPerson || boxes.length === 0) return []
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return []

    const scaleX = video.clientWidth / video.videoWidth
    const scaleY = video.clientHeight / video.videoHeight

    return boxes.map((box, index) => {
      const left = box.originX * scaleX
      const top = box.originY * scaleY
      const width = box.width * scaleX
      const labelWidth = 300
      const labelLeft = Math.min(Math.max(left + width / 2 - labelWidth / 2, 0), Math.max(video.clientWidth - labelWidth, 0))
      // Move label significantly higher to clear hair/head (was 90)
      const labelTop = Math.max(top - 240, 20)

      return {
        key: `face-${index}`, // Stable key based on index to prevent re-mounting
        left: labelLeft,
        top: labelTop,
      }
    })
  }, [boxes, displayPerson, isActive, videoRef])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <CameraFeed videoRef={videoRef} canvasRef={canvasRef} isActive={isActive} glassesMode={glassesMode} />

      {!glassesMode && faceLabels.map((pos) => (
        <div
          key={pos.key}
          className="pointer-events-none absolute z-40 transition-all duration-75 ease-out" // Removed animate-in, added smooth transition
          style={{ left: pos.left, top: pos.top }}
        >
          <div className="relative overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] min-w-[280px] max-w-[340px] group">
            {/* Subtle gradient glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-50" />
            {/* Animated border line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-50" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xl tracking-tight drop-shadow-md">{displayPerson?.name ?? 'Unknown'}</span>
                  {displayPerson?.relationship && (
                    <span className="text-xs text-cyan-300/80 font-medium tracking-wide uppercase">{displayPerson.relationship}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/80 font-semibold">LIVE</span>
                </div>
              </div>

              {/* Stats Row */}
              {(displayPerson?.confidence || displayPerson?.meetings) && (
                <div className="flex items-center gap-4 mb-3 text-[10px] text-white/50 font-mono border-b border-white/5 pb-2">
                  {displayPerson.confidence && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400">CONF:</span>
                      <span>{Math.round(displayPerson.confidence * 100)}%</span>
                    </div>
                  )}
                  {displayPerson.meetings && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400">MEETINGS:</span>
                      <span>{displayPerson.meetings}</span>
                    </div>
                  )}
                </div>
              )}

              {displayPerson?.lastInteraction && (
                <div className="relative pl-3 border-l-2 border-cyan-500/30">
                  <div className="text-[10px] uppercase tracking-wider text-cyan-400/60 mb-1 font-medium">Last Interaction</div>
                  <div className="text-sm text-white/90 leading-relaxed font-light italic">“{displayPerson.lastInteraction}”</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {glassesMode && (
        <ARGlassesView person={displayPerson} isActive={isActive} videoRef={videoRef} canvasRef={canvasRef} boxes={boxes} />
      )}

      {/* Start Screen Overlay */}
      {!isActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-center space-y-8 p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_100px_rgba(0,255,255,0.1)]">
            <div className="space-y-2">
              <div className="text-xs font-medium tracking-[0.5em] text-cyan-400 uppercase">System Ready</div>
              <h1 className="text-5xl font-bold text-white tracking-tight">Spatial Assist</h1>
              <p className="text-white/40 font-light tracking-wide">Next-Generation Face Recognition</p>
            </div>

            <button
              onClick={handleStart}
              className="group relative px-8 py-4 bg-white text-black font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 fill-current" />
                <span>INITIALIZE SYSTEM</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Minimal Bottom Controls */}
      {isActive && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-black/60 hover:scale-105">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleGlasses}
            className={`rounded-full w-12 h-12 transition-all ${glassesMode ? 'bg-white text-black hover:bg-white/90' : 'text-white hover:bg-white/10'}`}
            title="Toggle Glasses Mode"
          >
            <Glasses className="w-5 h-5" />
          </Button>

          <div className="w-px h-6 bg-white/10" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleStop}
            className="rounded-full w-12 h-12 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            title="Stop System"
          >
            <Square className="w-5 h-5 fill-current" />
          </Button>
        </div>
      )}

      {/* PersonInfoPanel removed */}

      {/* NotificationToast removed */}

    </div>
  )
}
