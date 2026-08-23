import { useCallback, useEffect, useRef, useState } from 'react'
import Slideshow from './Slideshow.tsx'
import type { MediaItem } from './types.ts'
import './App.css'

const DEFAULT_IMAGE_SECONDS = 5

function mediaTypeFor(file: File): MediaItem['type'] | null {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('image/')) return 'image'
  return null
}

function App() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [imageSeconds, setImageSeconds] = useState(DEFAULT_IMAGE_SECONDS)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Revoke any remaining object URLs on unmount to avoid leaking memory.
  // (Removal/clearing already revoke their own URLs immediately; this only
  // runs once, so reordering items via shuffle won't revoke live URLs.)
  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) URL.revokeObjectURL(item.url)
    }
  }, [])

  const handleFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList)
      .map((file): MediaItem | null => {
        const type = mediaTypeFor(file)
        return type ? { url: URL.createObjectURL(file), type, name: file.name } : null
      })
      .filter((item): item is MediaItem => item !== null)

    setItems((prev) => [...prev, ...files])
  }, [])

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.url)
      return next
    })
  }

  const clearAll = () => {
    setItems((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.url)
      return []
    })
  }

  const shuffle = () => {
    setItems((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    })
  }

  if (isPlaying) {
    return (
      <Slideshow
        items={items}
        imageSeconds={imageSeconds}
        onExit={() => setIsPlaying(false)}
      />
    )
  }

  return (
    <div className="picker">
      <h1>Slideshow</h1>
      <p className="hint">Pick photos and videos, then play them fullscreen on a loop.</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />

      <div className="actions">
        <button type="button" onClick={() => inputRef.current?.click()}>
          Add files
        </button>
        <label className="seconds-input">
          Seconds per photo
          <input
            type="number"
            min={1}
            step={1}
            value={imageSeconds}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (Number.isFinite(value) && value > 0) setImageSeconds(value)
            }}
          />
        </label>
        <button type="button" disabled={items.length < 2} onClick={shuffle}>
          Shuffle
        </button>
        <button type="button" disabled={items.length === 0} onClick={clearAll}>
          Clear all
        </button>
        <button
          type="button"
          className="primary"
          disabled={items.length === 0}
          onClick={() => setIsPlaying(true)}
        >
          Start slideshow
        </button>
      </div>

      {items.length > 0 && (
        <div className="grid">
          {items.map((item, index) => (
            <div className="thumb" key={item.url}>
              {item.type === 'image' ? (
                <img src={item.url} alt={item.name} />
              ) : (
                <video src={item.url} muted />
              )}
              <button
                type="button"
                className="remove"
                aria-label={`Remove ${item.name}`}
                onClick={() => removeItem(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
