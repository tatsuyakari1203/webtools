'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  onDownload?: (url: string, index: number) => void;
}

export default function Lightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  onDownload
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Reset current index when images change
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [images, initialIndex]);

  const navigateNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    // Reset zoom and position when changing images
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const navigatePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    // Reset zoom and position when changing images
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, navigateNext, navigatePrev, onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

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
            onClick={() => onDownload(images[currentIndex], currentIndex)}
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

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigatePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-white/20 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center cursor-move overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100vw', height: '100vh' }}
      >
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
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
      
      {/* Image counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm border border-white/20">
        {currentIndex + 1} / {images.length}
      </div>
      
      {/* Instructions */}
      <div className="absolute bottom-6 right-6 bg-black/70 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm border border-white/20">
        ESC để đóng • Click bên ngoài để đóng
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(lightboxContent, document.body) : null;
}