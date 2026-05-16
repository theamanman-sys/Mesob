import { useRef, useEffect, useState } from 'react'

const TOTAL_FRAMES = 300

export default function Hero3DSequence() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const framesRef = useRef([])
  const rafRef = useRef(null)
  const currentFrameRef = useRef(-1)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const images = []
    let loadedCount = 0
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      const idx = String(i).padStart(3, '0')
      img.src = `/files/hero-sequence/ezgif-frame-${idx}.jpg`
      const onDone = () => {
        loadedCount++
        if (loadedCount === TOTAL_FRAMES) setLoaded(true)
      }
      img.onload = onDone
      img.onerror = onDone
      images.push(img)
    }
    framesRef.current = images
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const parent = containerRef.current?.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const ro = new ResizeObserver(resize)
    if (containerRef.current?.parentElement) {
      ro.observe(containerRef.current.parentElement)
    }
    resize()

    const drawFrame = (index) => {
      const img = framesRef.current[index]
      if (!img || !img.complete || !img.naturalWidth) return
      const cw = canvas.width
      const ch = canvas.height
      ctx.clearRect(0, 0, cw, ch)
      const srcW = img.naturalWidth
      const srcH = img.naturalHeight
      const scale = Math.min(cw / srcW, ch / srcH)
      const dw = srcW * scale
      const dh = srcH * scale
      ctx.drawImage(img, 0, 0, srcW, srcH, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
    }

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const el = document.querySelector('.mesob-hero-scroll')
        if (!el) return
        const rect = el.getBoundingClientRect()
        const winH = window.innerHeight
        const totalScroll = rect.height
        const scrolled = winH - rect.top
        const progress = Math.max(0, Math.min(1, scrolled / totalScroll))
        const frameIndex = Math.floor(progress * TOTAL_FRAMES)
        const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex))
        if (clamped !== currentFrameRef.current) {
          currentFrameRef.current = clamped
          drawFrame(clamped)
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      ro.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loaded])

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2, overflow: 'hidden' }}>
      {!loaded && (
        <div className="w-10 h-10 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
      )}
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
