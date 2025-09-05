'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ASPECT_RATIOS, type AspectRatioOption } from '../lib/ImageCropper';

interface AspectRatioSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

export function AspectRatioSelector({ 
  value, 
  onValueChange, 
  disabled = false,
  showPreview = true 
}: AspectRatioSelectorProps) {
  const selectedOption = ASPECT_RATIOS.find(option => option.value === value);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Aspect Ratio</label>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {showPreview && selectedOption && (
        <Card className="p-4">
          <div className="text-center">
            <h4 className="text-sm font-medium mb-3">Preview Layout</h4>
            <div className="flex justify-center">
              <PreviewLayout option={selectedOption} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {getLayoutDescription(selectedOption.value)}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function PreviewLayout({ option }: { option: AspectRatioOption }) {
  const { value } = option;
  
  if (value === '2') {
    return (
      <div className="flex space-x-1">
        <div className="w-8 h-8 bg-primary/20 border border-primary/40 rounded" />
        <div className="w-8 h-8 bg-primary/20 border border-primary/40 rounded" />
      </div>
    );
  }
  
  if (value === '3') {
    return (
      <div className="flex space-x-1">
        <div className="w-6 h-6 bg-primary/20 border border-primary/40 rounded" />
        <div className="w-6 h-6 bg-primary/20 border border-primary/40 rounded" />
        <div className="w-6 h-6 bg-primary/20 border border-primary/40 rounded" />
      </div>
    );
  }
  
  if (value === 'special2') {
    return (
      <div className="space-y-1">
        <div className="w-16 h-8 bg-primary/20 border border-primary/40 rounded" />
        <div className="flex space-x-1">
          <div className="w-8 h-8 bg-primary/20 border border-primary/40 rounded" />
          <div className="w-7 h-8 bg-primary/20 border border-primary/40 rounded" />
        </div>
      </div>
    );
  }
  
  if (value === 'special') {
    return (
      <div className="space-y-1">
        <div className="flex space-x-1">
          <div className="w-8 h-6 bg-primary/20 border border-primary/40 rounded" />
          <div className="w-8 h-6 bg-primary/20 border border-primary/40 rounded" />
        </div>
        <div className="flex space-x-1">
          <div className="w-5 h-4 bg-primary/20 border border-primary/40 rounded" />
          <div className="w-5 h-4 bg-primary/20 border border-primary/40 rounded" />
          <div className="w-5 h-4 bg-primary/20 border border-primary/40 rounded" />
        </div>
      </div>
    );
  }
  
  return null;
}

function getLayoutDescription(value: string): string {
  switch (value) {
    case '2':
      return 'Creates 2 square images from a 2:1 rectangle';
    case '3':
      return 'Creates 3 square images from a 3:1 rectangle';
    case 'special2':
      return 'Creates 3 images: 1 rectangle (2:1) + 2 squares';
    case 'special':
      return 'Creates 5 images: 2 from top section + 3 from bottom';
    default:
      return '';
  }
}

export default AspectRatioSelector;