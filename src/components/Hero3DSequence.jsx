import { useRef, useEffect, useState } from 'react'

export default function Hero3DSequence() {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const el = document.querySelector('.mesob-hero-scroll')
        if (!el || !video.duration) return
        const rect = el.getBoundingClientRect()
        const winH = window.innerHeight
        const totalScroll = rect.height
        const scrolled = winH - rect.top
        const progress = Math.max(0, Math.min(1, scrolled / totalScroll))
        video.currentTime = progress * video.duration
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src="/files/hero-video.mp4"
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover"
        style={{ opacity: 0.5 }}
      />
    </div>
  )
}
