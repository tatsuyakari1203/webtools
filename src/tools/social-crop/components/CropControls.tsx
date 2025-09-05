'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  FlipHorizontal, 
  FlipVertical, 
  RotateCcw as Reset,
  Crop,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CropControlsProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onReset: () => void;
  onCrop: () => void;
  onDownload: () => void;
  downloadFormat: string;
  onDownloadFormatChange: (format: string) => void;
  disabled?: boolean;
  canDownload?: boolean;
  isProcessing?: boolean;
  className?: string;
}

const DOWNLOAD_FORMATS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' }
];

export function CropControls({
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
  onFlipHorizontal,
  onFlipVertical,
  onReset,
  onCrop,
  onDownload,
  downloadFormat,
  onDownloadFormatChange,
  disabled = false,
  canDownload = false,
  isProcessing = false,
  className
}: CropControlsProps) {
  const controlButtons = [
    {
      icon: RotateCcw,
      label: 'Rotate Left',
      onClick: onRotateLeft,
      disabled: disabled
    },
    {
      icon: RotateCw,
      label: 'Rotate Right', 
      onClick: onRotateRight,
      disabled: disabled
    },
    {
      icon: ZoomIn,
      label: 'Zoom In',
      onClick: onZoomIn,
      disabled: disabled
    },
    {
      icon: ZoomOut,
      label: 'Zoom Out',
      onClick: onZoomOut,
      disabled: disabled
    },
    {
      icon: FlipHorizontal,
      label: 'Flip Horizontal',
      onClick: onFlipHorizontal,
      disabled: disabled
    },
    {
      icon: FlipVertical,
      label: 'Flip Vertical',
      onClick: onFlipVertical,
      disabled: disabled
    },
    {
      icon: Reset,
      label: 'Reset',
      onClick: onReset,
      disabled: disabled
    }
  ];

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Transform Controls */}
        <div>
          <h4 className="text-sm font-medium mb-3">Transform Controls</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            {controlButtons.map((button, index) => {
              const Icon = button.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={button.onClick}
                  disabled={button.disabled}
                  title={button.label}
                  className="h-10 w-10 p-0"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Actions</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onCrop}
              disabled={disabled || isProcessing}
              className="flex-1"
              variant="default"
            >
              <Crop className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Crop Image'}
            </Button>
            
            <div className="flex gap-2 flex-1">
              <Select 
                value={downloadFormat} 
                onValueChange={onDownloadFormatChange}
                disabled={!canDownload}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOWNLOAD_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={onDownload}
                disabled={!canDownload || isProcessing}
                variant="secondary"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default CropControls;