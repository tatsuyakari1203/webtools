'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';

// Preset sizes for common use cases
export const PRESET_SIZES = {
  'auto': { width: 0, height: 0, label: 'Auto (Keep Original Ratio)' },
  'square': { width: 1280, height: 1280, label: 'Square (1:1)' },
  'portrait': { width: 1024, height: 1536, label: 'Portrait (2:3)' },
  'landscape': { width: 1536, height: 1024, label: 'Landscape (3:2)' },
  'wide': { width: 1792, height: 1024, label: 'Wide (16:9)' },
  'ultrawide': { width: 2048, height: 1152, label: 'Ultra Wide (16:8)' }
};

// Calculate optimal size while maintaining aspect ratio and staying within limits
export const calculateOptimalSize = (originalWidth: number, originalHeight: number) => {
  const maxSize = 4096;
  const minSize = 1024;
  
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  let width, height;
  
  if (aspectRatio >= 1) {
    // Landscape or square
    width = Math.min(maxSize, Math.max(minSize, originalWidth));
    height = Math.round(width / aspectRatio);
    
    // Ensure height is within bounds
    if (height > maxSize) {
      height = maxSize;
      width = Math.round(height * aspectRatio);
    } else if (height < minSize) {
      height = minSize;
      width = Math.round(height * aspectRatio);
    }
  } else {
    // Portrait
    height = Math.min(maxSize, Math.max(minSize, originalHeight));
    width = Math.round(height * aspectRatio);
    
    // Ensure width is within bounds
    if (width > maxSize) {
      width = maxSize;
      height = Math.round(width / aspectRatio);
    } else if (width < minSize) {
      width = minSize;
      height = Math.round(width / aspectRatio);
    }
  }
  
  // Round to nearest multiple of 64 for better compatibility
  width = Math.round(width / 64) * 64;
  height = Math.round(height / 64) * 64;
  
  return { width, height };
};

interface SettingsProps {
  imageSize: { width: number; height: number };
  onImageSizeChange: (newSize: { width: number; height: number }) => void;
  sizeMode: keyof typeof PRESET_SIZES | 'custom';
  onSizeModeChange: (newMode: keyof typeof PRESET_SIZES | 'custom') => void;
  numImages: number;
  onNumImagesChange: (numImages: number) => void;
  seed?: number;
  originalImageSize: { width: number; height: number } | null;
  disabled?: boolean;
}

export default function Settings({
  imageSize,
  onImageSizeChange,
  sizeMode,
  onSizeModeChange,
  numImages,
  onNumImagesChange,
  seed,
  originalImageSize,
  disabled = false
}: SettingsProps) {
  // Handle size mode change
  const handleSizeModeChange = (newMode: keyof typeof PRESET_SIZES | 'custom') => {
    onSizeModeChange(newMode);
    
    if (newMode === 'auto' && originalImageSize) {
      // Recalculate optimal size based on original image
      const optimalSize = calculateOptimalSize(originalImageSize.width, originalImageSize.height);
      onImageSizeChange(optimalSize);
    } else if (newMode !== 'auto' && newMode !== 'custom') {
      // Set to preset size
      const preset = PRESET_SIZES[newMode];
      if (preset) {
        onImageSizeChange({ width: preset.width, height: preset.height });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Size Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground/90">
            Image Size
          </Label>
          <div className="space-y-3">
            <Select 
              value={sizeMode} 
              onValueChange={(value: string) => handleSizeModeChange(value as keyof typeof PRESET_SIZES | 'custom')} 
              disabled={disabled}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select size preset" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESET_SIZES).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Size</SelectItem>
              </SelectContent>
            </Select>
            
            {(sizeMode === 'custom' || sizeMode === 'auto') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="width" className="text-xs text-muted-foreground font-medium">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    min="1024"
                    max="4096"
                    step="64"
                    value={imageSize.width}
                    onChange={(e) => {
                      const width = parseInt(e.target.value) || 1280;
                      onSizeModeChange('custom');
                      onImageSizeChange({ ...imageSize, width });
                    }}
                    disabled={sizeMode === 'auto' || disabled}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height" className="text-xs text-muted-foreground font-medium">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    min="1024"
                    max="4096"
                    step="64"
                    value={imageSize.height}
                    onChange={(e) => {
                      const height = parseInt(e.target.value) || 1280;
                      onSizeModeChange('custom');
                      onImageSizeChange({ ...imageSize, height });
                    }}
                    disabled={sizeMode === 'auto' || disabled}
                    className="h-9"
                  />
                </div>
              </div>
            )}
            
            {sizeMode === 'auto' && originalImageSize && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                <span className="font-medium">Auto-optimized:</span> {originalImageSize.width}×{originalImageSize.height} → {imageSize.width}×{imageSize.height}
              </div>
            )}
          </div>
        </div>
        
        {/* Number of Results Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground/90">
            Number of Results
          </Label>
          <div className="w-32">
            <Input
              id="numImages"
              type="number"
              min="1"
              max="4"
              value={numImages}
              onChange={(e) => onNumImagesChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="h-9"
            />
          </div>
        </div>
        {seed !== undefined && (
          <div className="space-y-2">
            <Label>Seed (for reproducibility)</Label>
            <Badge variant="secondary">{seed}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}