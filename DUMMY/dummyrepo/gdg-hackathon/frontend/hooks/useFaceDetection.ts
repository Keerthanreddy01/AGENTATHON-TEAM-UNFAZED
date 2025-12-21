'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

interface FaceDetectionBox {
  originX: number
  originY: number
  width: number
  height: number
}

export function useFaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectorRef = useRef<FaceDetector | null>(null)
  const animationRef = useRef<number | null>(null)
  const detectionActiveRef = useRef(false)

  const [isDetecting, setIsDetecting] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [boxes, setBoxes] = useState<FaceDetectionBox[]>([])

  const drawBoundingBox = (ctx: CanvasRenderingContext2D, box: FaceDetectionBox) => {
    // Premium Cyan Glow
    const primaryColor = '#00f3ff'
    const secondaryColor = 'rgba(0, 243, 255, 0.2)'

    // Draw subtle full box background
    ctx.strokeStyle = secondaryColor
    ctx.lineWidth = 1
    ctx.shadowBlur = 0
    ctx.strokeRect(box.originX, box.originY, box.width, box.height)

    // Draw corners with glow
    ctx.strokeStyle = primaryColor
    ctx.lineWidth = 4
    ctx.shadowBlur = 15
    ctx.shadowColor = primaryColor

    const cornerLen = Math.min(box.width, box.height) * 0.2

    // Top-left
    ctx.beginPath()
    ctx.moveTo(box.originX, box.originY + cornerLen)
    ctx.lineTo(box.originX, box.originY)
    ctx.lineTo(box.originX + cornerLen, box.originY)
    ctx.stroke()

    // Top-right
    ctx.beginPath()
    ctx.moveTo(box.originX + box.width - cornerLen, box.originY)
    ctx.lineTo(box.originX + box.width, box.originY)
    ctx.lineTo(box.originX + box.width, box.originY + cornerLen)
    ctx.stroke()

    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(box.originX, box.originY + box.height - cornerLen)
    ctx.lineTo(box.originX, box.originY + box.height)
    ctx.lineTo(box.originX + cornerLen, box.originY + box.height)
    ctx.stroke()

    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(box.originX + box.width - cornerLen, box.originY + box.height)
    ctx.lineTo(box.originX + box.width, box.originY + box.height)
    ctx.lineTo(box.originX + box.width, box.originY + box.height - cornerLen)
    ctx.stroke()

    // Reset shadow
    ctx.shadowBlur = 0
  }

  const detectFaces = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const detector = detectorRef.current

    if (!video || !canvas || !detector || !detectionActiveRef.current) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      if (!detectionActiveRef.current || !video || !canvas || !detector) {
        return
      }

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        animationRef.current = requestAnimationFrame(render)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      try {
        const detections = detector.detectForVideo(video, performance.now())

        if (detections.detections && detections.detections.length > 0) {
          setFaceDetected(true)
          const nextBoxes: FaceDetectionBox[] = []
          detections.detections.forEach((detection) => {
            const box = detection.boundingBox
            if (box) {
              nextBoxes.push(box)
              drawBoundingBox(ctx, box)
            }
          })
          setBoxes(nextBoxes)
        } else {
          setFaceDetected(false)
          setBoxes([])
        }
      } catch (error) {
        console.error('[FaceDetection] Failed to process frame', error)
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()
  }, [])

  const stopDetection = useCallback(() => {
    detectionActiveRef.current = false
    setIsDetecting(false)
    setFaceDetected(false)
    setBoxes([])

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  const startDetection = useCallback(async () => {
    if (isDetecting) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: 'user' },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      if (!detectorRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        })
      }

      detectionActiveRef.current = true
      setIsDetecting(true)
      detectFaces()
    } catch (error) {
      console.error('[FaceDetection] Failed to start detection', error)
      stopDetection()
      throw error
    }
  }, [detectFaces, isDetecting, stopDetection])

  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return {
    videoRef,
    canvasRef,
    isDetecting,
    faceDetected,
    boxes,
    startDetection,
    stopDetection,
  }
}
