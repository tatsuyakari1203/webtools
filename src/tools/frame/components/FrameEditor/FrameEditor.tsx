'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCw, Move, Download } from 'lucide-react';
import type { FrameEditorProps } from '../../types';
import { formatCameraName, getCameraBrand } from '../../services/exifService';
import { getCameraLogoDataUrl } from '../shared/CameraLogo';

interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

export default function FrameEditor({
  imageData,
  exifData,
  config,
  onExport,
  isProcessing
}: FrameEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });

  // Frame style configurations
  const getFrameStyle = (style: string) => {
    switch (style) {
      case 'classic':
        return { shadow: true, texture: false, gradient: false };
      case 'modern':
        return { shadow: false, texture: false, gradient: true };
      case 'vintage':
        return { shadow: true, texture: true, gradient: false };
      case 'professional':
        return { shadow: true, texture: false, gradient: false };
      case 'polaroid':
        return { shadow: true, texture: false, gradient: false, bottomPadding: 60 };
      case 'film':
        return { shadow: false, texture: false, gradient: false, sprockets: true };
      default:
        return { shadow: false, texture: false, gradient: false };
    }
  };

  // Get frame color value
  const getFrameColor = (color: string): string => {
    const colors: Record<string, string> = {
      white: '#FFFFFF',
      black: '#000000',
      gray: '#6B7280',
      cream: '#FEF7ED',
      sepia: '#92400E',
      navy: '#1E3A8A'
    };
    return colors[color] || '#FFFFFF';
  };

  // Get text color based on config and background
  const getTextColor = (textColor: string, backgroundColor: string): string => {
    if (textColor === 'auto') {
      // Simple contrast calculation
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#FFFFFF';
    }
    const colors: Record<string, string> = {
      black: '#000000',
      white: '#FFFFFF',
      gray: '#6B7280'
    };
    return colors[textColor] || '#000000';
  };

  // Draw metadata bar (header or footer)
  const drawMetadataBar = useCallback((
    ctx: CanvasRenderingContext2D, 
    position: 'top' | 'bottom', 
    canvasWidth: number, 
    barY: number, 
    borderWidth: number, 
    textColor: string
  ) => {
    const barHeight = 60;
    const padding = 12;
    const lineHeight = config.fontSize + 2;
    const logoSize = 20;
    
    // Get metadata values (custom or from EXIF)
    const cameraName = config.customCameraBrand || (exifData ? formatCameraName(exifData) : 'Unknown Camera');
    const aperture = config.customAperture || (exifData?.settings.aperture || 'f/0');
    const shutter = config.customShutter || (exifData?.settings.shutterSpeed || '1/0s');
    const iso = config.customISO || (exifData?.settings.iso ? `ISO ${exifData.settings.iso}` : 'ISO 0');
    const focal = config.customFocal || (exifData?.settings.focalLength || '0mm');
    const date = config.customDate || (exifData ? new Date(exifData.datetime).toLocaleDateString() : new Date().toLocaleDateString());
    const photographer = config.photographerName || '';
    
    // Get camera brand for logo
    const cameraBrand = exifData ? getCameraBrand(exifData) : 'Other';
    
    // Draw camera logo
    const logoImg = new Image();
    logoImg.onload = () => {
      ctx.drawImage(logoImg, borderWidth + padding, barY + padding + 2, logoSize, logoSize);
    };
    logoImg.src = getCameraLogoDataUrl(cameraBrand, logoSize, textColor);
    
    // Draw camera brand/name (left side, next to logo)
    const textX = borderWidth + padding + logoSize + 8;
    drawText(ctx, cameraName, textX, barY + padding + lineHeight, config.fontSize + 1, textColor, 'bold');
    
    // Draw photo settings (center-left)
    const settingsText = `${aperture} • ${shutter} • ${iso} • ${focal}`;
    const settingsX = textX;
    const settingsY = barY + padding + lineHeight * 2 + 4;
    drawText(ctx, settingsText, settingsX, settingsY, config.fontSize - 1, textColor);
    
    // Draw date (right side)
    const dateWidth = ctx.measureText(date).width;
    const dateX = canvasWidth - borderWidth - padding - dateWidth;
    drawText(ctx, date, dateX, barY + padding + lineHeight, config.fontSize, textColor);
    
    // Draw photographer name (right side, below date)
    if (photographer) {
      const photographerWidth = ctx.measureText(photographer).width;
      const photographerX = canvasWidth - borderWidth - padding - photographerWidth;
      drawText(ctx, photographer, photographerX, barY + padding + lineHeight * 2 + 4, config.fontSize - 1, textColor);
    }
    
    // Draw separator line
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (position === 'top') {
      ctx.moveTo(borderWidth + padding, barY + barHeight - 2);
      ctx.lineTo(canvasWidth - borderWidth - padding, barY + barHeight - 2);
    } else {
      ctx.moveTo(borderWidth + padding, barY + 2);
      ctx.lineTo(canvasWidth - borderWidth - padding, barY + 2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [config, exifData]);

  // Draw frame on canvas
  const drawFrame = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load image
    const img = new Image();
    img.onload = () => {
      const frameStyle = getFrameStyle(config.style);
      const frameColor = getFrameColor(config.color);
      const textColor = getTextColor(config.textColor, frameColor);
      
      // Calculate metadata bar height
      const metadataBarHeight = config.showMetadata ? 60 : 0;
      const hasTopBar = config.barPosition === 'top' || config.barPosition === 'both';
      const hasBottomBar = config.barPosition === 'bottom' || config.barPosition === 'both';
      
      // Calculate dimensions
      const borderWidth = config.borderWidth;
      const topPadding = hasTopBar ? metadataBarHeight : borderWidth;
      const bottomPadding = hasBottomBar ? metadataBarHeight : (frameStyle.bottomPadding || borderWidth);
      const canvasWidth = img.width + (borderWidth * 2);
      const canvasHeight = img.height + topPadding + bottomPadding;
      
      // Set canvas size
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Clear canvas
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Add texture for vintage style
      if (frameStyle.texture) {
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 1000; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#FFFFFF';
          ctx.fillRect(
            Math.random() * canvasWidth,
            Math.random() * canvasHeight,
            Math.random() * 3,
            Math.random() * 3
          );
        }
        ctx.globalAlpha = 1;
      }
      
      // Add gradient for modern style
      if (frameStyle.gradient) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, frameColor);
        gradient.addColorStop(1, adjustBrightness(frameColor, -20));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      
      // Add shadow
      if (frameStyle.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }
      
      // Draw image with corner radius
      if (config.cornerRadius > 0) {
        ctx.save();
        roundedRect(ctx, borderWidth, topPadding, img.width, img.height, config.cornerRadius);
        ctx.clip();
      }
      
      // Draw the main image
      ctx.drawImage(img, borderWidth, topPadding, img.width, img.height);
      
      if (config.cornerRadius > 0) {
        ctx.restore();
      }
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Add film sprockets
      if (frameStyle.sprockets) {
        drawFilmSprockets(ctx, canvasWidth, canvasHeight, borderWidth);
      }
      
      // Draw metadata bars
      if (config.showMetadata) {
        if (hasTopBar) {
          drawMetadataBar(ctx, 'top', canvasWidth, borderWidth, borderWidth, textColor);
        }
        if (hasBottomBar) {
          drawMetadataBar(ctx, 'bottom', canvasWidth, canvasHeight - bottomPadding, borderWidth, textColor);
        }
      }
      
      // Add title if enabled
      if (config.showTitle && config.titleText) {
        const titleY = hasBottomBar 
          ? canvasHeight - bottomPadding + 10 
          : canvasHeight - borderWidth + 10;
        drawText(ctx, config.titleText, borderWidth, titleY, config.fontSize + 2, textColor, 'bold');
      }
    };
    
    img.src = imageData.imageData;
  }, [imageData, config, drawMetadataBar]);



  // Helper function to draw rounded rectangle
  const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper function to draw text
  const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, color: string, weight: string = 'normal') => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillText(text, x, y);
  };

  // Helper function to draw film sprockets
  const drawFilmSprockets = (ctx: CanvasRenderingContext2D, width: number, height: number, borderWidth: number) => {
    const sprocketSize = 8;
    const sprocketSpacing = 20;
    
    ctx.fillStyle = '#000000';
    
    // Left side sprockets
    for (let y = borderWidth; y < height - borderWidth; y += sprocketSpacing) {
      ctx.fillRect(5, y, sprocketSize, sprocketSize);
    }
    
    // Right side sprockets
    for (let y = borderWidth; y < height - borderWidth; y += sprocketSpacing) {
      ctx.fillRect(width - 5 - sprocketSize, y, sprocketSize, sprocketSize);
    }
  };

  // Helper function to adjust color brightness
  const adjustBrightness = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3, prev.zoom + delta))
    }));
  };

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setCanvasState(prev => ({
      ...prev,
      isDragging: true,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasState.isDragging) return;
    
    const deltaX = e.clientX - canvasState.lastMouseX;
    const deltaY = e.clientY - canvasState.lastMouseY;
    
    setCanvasState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY
    }));
  };

  const handleMouseUp = () => {
    setCanvasState(prev => ({ ...prev, isDragging: false }));
  };

  // Reset view
  const resetView = () => {
    setCanvasState({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    });
  };

  // Export frame
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    onExport(canvas);
  };

  // Redraw when config changes
  useEffect(() => {
    if (imageData) {
      drawFrame();
    }
  }, [imageData, config, exifData, drawFrame]);

  if (!imageData) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center p-8">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Move className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Image Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload an image to start creating your professional frame
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {imageData.width} × {imageData.height}
          </Badge>
          <Badge variant="outline">
            {(imageData.fileSize / 1024 / 1024).toFixed(1)} MB
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-0.1)}
            disabled={canvasState.zoom <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-mono min-w-[60px] text-center">
            {Math.round(canvasState.zoom * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(0.1)}
            disabled={canvasState.zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isProcessing}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800 relative"
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.zoom})`,
            cursor: canvasState.isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full shadow-lg"
            style={{ 
              imageRendering: 'auto',
              filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))'
            }}
          />
        </div>
      </div>
    </div>
  );
}