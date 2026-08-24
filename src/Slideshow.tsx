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

  // Reuse a single video element across slides instead of remounting a new
  // one per slide (via a key): repeatedly creating/destroying <video>
  // elements leaks decoder/GPU buffers over long runs with many videos.
  // Releasing the source explicitly before the next one loads keeps that
  // from accumulating.
  useEffect(() => {
    const video = videoRef.current
    const item = items[index]
    if (!video || item?.type !== 'video') return

    video.src = item.url
    video.play().catch(() => {})

    return () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [index, items])

  const current = items[index]
  if (!current) return null

  return (
    <div className="slideshow" ref={containerRef}>
      {current.type === 'image' && <img src={current.url} alt="" className="slide" />}
      <video
        ref={videoRef}
        className="slide"
        style={{ display: current.type === 'video' ? undefined : 'none' }}
        playsInline
        muted={muted}
        onEnded={advance}
      />
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
