'use client';

import React, { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import FrameEditor from './components/FrameEditor';
import SettingsPanel from './components/SettingsPanel';
import type { FrameProps, ImageData, ExifData, FrameConfig } from './types';

const DEFAULT_CONFIG: FrameConfig = {
  style: 'classic',
  color: 'white',
  borderWidth: 40,
  cornerRadius: 0,
  showMetadata: true,
  showTitle: false,
  titleText: '',
  fontSize: 14,
  textColor: 'auto',
  exportFormat: 'jpeg',
  exportQuality: 0.95,
  exportWidth: 2000,
  
  // Metadata Bar Configuration
  barPosition: 'bottom',
  customCameraBrand: '',
  customAperture: '',
  customShutter: '',
  customISO: '',
  customFocal: '',
  photographerName: '',
  customDate: '',
};

export default function Frame({ tool }: FrameProps) {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [config, setConfig] = useState<FrameConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((image: ImageData) => {
    setImageData(image);
    setError(null);
  }, []);

  const handleExifData = useCallback((exif: ExifData) => {
    setExifData(exif);
  }, []);

  const handleConfigChange = useCallback((newConfig: FrameConfig) => {
    setConfig(newConfig);
  }, []);

  const handleExport = useCallback((canvas?: HTMLCanvasElement) => {
    if (!canvas || !imageData) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create a new canvas for export with desired dimensions
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('Failed to create export canvas');
      
      // Calculate export dimensions while maintaining aspect ratio
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      const aspectRatio = originalWidth / originalHeight;
      
      let exportWidth = config.exportWidth;
      let exportHeight = Math.round(exportWidth / aspectRatio);
      
      // Set export canvas size
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      
      // Draw the original canvas to export canvas with scaling
      exportCtx.drawImage(canvas, 0, 0, exportWidth, exportHeight);
      
      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create image blob');
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const extension = config.exportFormat === 'jpeg' ? 'jpg' : config.exportFormat;
        link.download = `frame-${timestamp}.${extension}`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Frame exported successfully');
      }, `image/${config.exportFormat}`, config.exportQuality);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, config.exportFormat, config.exportQuality, config.exportWidth]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Side - Preview/Upload Area (Large) */}
        <div className="flex-1 flex flex-col min-w-0">
          {!imageData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-2xl">
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  onExifData={handleExifData}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden">
              <FrameEditor
                imageData={imageData}
                exifData={exifData}
                config={config}
                onExport={handleExport}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </div>

        {/* Right Side - Settings Panel */}
        <div className="w-80 flex-shrink-0">
          <div className="h-full bg-card border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Frame Settings</h3>
              <p className="text-sm text-muted-foreground">
                Customize your photo frame and metadata
              </p>
            </div>
            <div className="p-4 h-[calc(100%-80px)] overflow-hidden">
              <SettingsPanel
                config={config}
                exifData={exifData}
                onConfigChange={handleConfigChange}
                onExport={() => handleExport()}
                onReset={handleReset}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
