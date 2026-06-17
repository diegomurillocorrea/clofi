'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SignaturePadHandle {
  isEmpty: () => boolean
  clear: () => void
  toDataURL: (type?: string) => string
}

interface SignaturePadProps {
  label?: string
  className?: string
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ label = 'Firma aquí', className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDrawingRef = useRef(false)
    const lastPointRef = useRef<{ x: number; y: number } | null>(null)
    const hasStrokeRef = useRef(false)
    const [hasStroke, setHasStroke] = useState(false)

    const getContext = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return canvas.getContext('2d')
    }, [])

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const { width, height } = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'currentColor'
      ctx.lineWidth = 2
    }, [])

    useEffect(() => {
      resizeCanvas()
      const observer = new ResizeObserver(resizeCanvas)
      if (containerRef.current) {
        observer.observe(containerRef.current)
      }
      return () => observer.disconnect()
    }, [resizeCanvas])

    const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      canvasRef.current?.setPointerCapture(event.pointerId)
      isDrawingRef.current = true
      lastPointRef.current = getPoint(event)
    }

    const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return

      const ctx = getContext()
      const point = getPoint(event)
      const lastPoint = lastPointRef.current
      if (!ctx || !point || !lastPoint) return

      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()

      lastPointRef.current = point
      if (!hasStrokeRef.current) {
        hasStrokeRef.current = true
        setHasStroke(true)
      }
    }

    const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      lastPointRef.current = null
      canvasRef.current?.releasePointerCapture(event.pointerId)
    }

    const clear = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = getContext()
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      hasStrokeRef.current = false
      setHasStroke(false)
    }, [getContext])

    useImperativeHandle(
      ref,
      () => ({
        isEmpty: () => !hasStrokeRef.current,
        clear,
        toDataURL: (type = 'image/png') =>
          canvasRef.current?.toDataURL(type) ?? '',
      }),
      [clear],
    )

    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clear}
            className="h-8 gap-1.5 border-border text-muted-foreground"
          >
            <Eraser size={14} />
            Limpiar
          </Button>
        </div>
        <div
          ref={containerRef}
          className="relative h-36 w-full rounded-sm border-2 border-dashed border-border bg-background overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none cursor-crosshair text-foreground"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
          />
          {!hasStroke && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Dibuja tu firma con el mouse o el dedo
            </p>
          )}
        </div>
      </div>
    )
  },
)
