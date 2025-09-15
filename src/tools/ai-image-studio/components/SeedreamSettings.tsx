'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';
import { PRESET_SIZES, calculateOptimalSize } from './Settings';

interface SeedreamSettingsProps {
  imageSize: { width: number; height: number };
  onImageSizeChange: (newSize: { width: number; height: number }) => void;
  sizeMode: keyof typeof PRESET_SIZES | 'custom';
  onSizeModeChange: (newMode: keyof typeof PRESET_SIZES | 'custom') => void;
  numImages: number;
  onNumImagesChange: (numImages: number) => void;
  outputImages: number; // Output images setting (default=4, max=6)
  onOutputImagesChange: (outputImages: number) => void;
  enableSafetyChecker: boolean;
  onEnableSafetyCheckerChange: (enable: boolean) => void;
  enableAutoResize?: boolean;
  onEnableAutoResizeChange?: (checked: boolean) => void;
  seed?: number;
  originalImageSize: { width: number; height: number } | null;
  disabled?: boolean;
  selectedModel?: 'seedream' | 'flux-kontext';
}

export default function SeedreamSettings({
  imageSize,
  onImageSizeChange,
  sizeMode,
  onSizeModeChange,
  numImages,
  onNumImagesChange,
  outputImages,
  onOutputImagesChange,
  enableSafetyChecker,
  onEnableSafetyCheckerChange,
  enableAutoResize,
  onEnableAutoResizeChange,
  seed,
  originalImageSize,
  disabled = false
}: SeedreamSettingsProps) {
  // Handle size mode change
  const handleSizeModeChange = (newMode: keyof typeof PRESET_SIZES | 'custom') => {
    onSizeModeChange(newMode);
    
    if (newMode === 'auto' && originalImageSize) {
      // Calculate optimal size
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
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm flex items-center gap-1">
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Image Size Section */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground/90">
            Image Size
          </Label>
          <div className="space-y-2">
            <Select 
              value={sizeMode} 
              onValueChange={(value: string) => handleSizeModeChange(value as keyof typeof PRESET_SIZES | 'custom')} 
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs">
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
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
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-0.5">
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
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            )}
            
            {sizeMode === 'auto' && originalImageSize && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
                <span className="font-medium">Auto:</span> {originalImageSize.width}×{originalImageSize.height} → {imageSize.width}×{imageSize.height}
              </div>
            )}
          </div>
        </div>
        
        {/* Number and Max Images Section - Combined in a grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label htmlFor="num-images" className="text-xs">Number of results</Label>
            <Input
              id="num-images"
              type="number"
              min={1}
              max={4}
              value={numImages}
              onChange={(e) => onNumImagesChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="output-images" className="text-xs">Output Images</Label>
            <Input
              id="output-images"
              type="number"
              min={1}
              max={6}
              value={outputImages}
              onChange={(e) => onOutputImagesChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Safety Checker Section */}
        <div className="flex items-center space-x-1.5">
          <Checkbox
            id="safety-checker"
            checked={enableSafetyChecker}
            onCheckedChange={(checked: boolean | 'indeterminate') => 
              onEnableSafetyCheckerChange(checked === true)}
            disabled={disabled}
            className="h-3.5 w-3.5"
          />
          <Label htmlFor="safety-checker" className="text-xs">Enable Safety Checker</Label>
        </div>
        
        {/* Auto Resize Section - Only show when sizeMode is 'auto' */}
        {onEnableAutoResizeChange && sizeMode === 'auto' && (
          <div className="flex items-center space-x-1.5">
            <Checkbox
              id="auto-resize"
              checked={enableAutoResize}
              onCheckedChange={(checked: boolean | 'indeterminate') => 
                onEnableAutoResizeChange(checked === true)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="auto-resize" className="text-xs">Auto-resize output to match original size</Label>
            <div className="ml-1 group relative">
              <span className="cursor-help text-muted-foreground">ⓘ</span>
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                When enabled, output images will be automatically resized to match the original image dimensions exactly, pixel by pixel.
              </div>
            </div>
          </div>
        )}
        
        {seed !== undefined && (
          <div className="space-y-1">
            <Label className="text-xs">Seed</Label>
            <Badge variant="secondary" className="text-xs py-0.5">{seed}</Badge>
            <div className="text-xs text-muted-foreground">(New seed for each request)</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}