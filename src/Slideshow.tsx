import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaItem } from './types.ts'
import './Slideshow.css'

interface SlideshowProps {
  items: MediaItem[]
  imageSeconds: number
  onExit: () => void
}

function Slideshow({ items, imageSeconds, onExit }: SlideshowProps) {
  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const itemCount = items.length

  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1) % itemCount)
  }, [itemCount])

  // Request/exit fullscreen with the component's lifecycle.
  useEffect(() => {
    const el = containerRef.current
    el?.requestFullscreen?.().catch(() => {})

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) onExit()
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
  }, [onExit])

  // Advance timer for images; videos advance via their own 'ended' event.
  useEffect(() => {
    const current = items[index]
    if (!current || current.type !== 'image') return
    const timer = setTimeout(advance, imageSeconds * 1000)
    return () => clearTimeout(timer)
  }, [index, items, imageSeconds, advance])

  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [index])

  const current = items[index]
  if (!current) return null

  return (
    <div className="slideshow" ref={containerRef}>
      {current.type === 'image' ? (
        <img key={current.url} src={current.url} alt="" className="slide" />
      ) : (
        <video
          key={current.url}
          ref={videoRef}
          src={current.url}
          className="slide"
          autoPlay
          playsInline
          muted={muted}
          onEnded={advance}
        />
      )}
      <div className="controls">
        {current.type === 'video' && (
          <button type="button" className="mute" onClick={() => setMuted((m) => !m)}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
        <button type="button" className="exit" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  )
}

export default Slideshow
