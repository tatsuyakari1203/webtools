'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LightboxProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onDownload?: () => void
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onDownload
}) => {
  const [scale, setScale] = React.useState(1)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (!isOpen) return null

  const lightboxContent = (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center" style={{ width: '100vw', height: '100vh', top: 0, left: 0, position: 'fixed' }}>
      {/* Controls */}
      <div className="absolute top-6 right-6 flex gap-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={scale >= 3}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        {onDownload && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            className="bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
          >
            <Download className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center cursor-move overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100vw', height: '100vh' }}
      >
        <img
          src={imageSrc}
          alt="Lightbox view"
          className="select-none transition-transform duration-200 ease-out"
          style={{
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
        />
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-6 left-6 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm border border-white/20">
        {Math.round(scale * 100)}%
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-6 right-6 bg-black/70 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm border border-white/20">
        ESC to close • Click outside to close
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(lightboxContent, document.body) : null
}