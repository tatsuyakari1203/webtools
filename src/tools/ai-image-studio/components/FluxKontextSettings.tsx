'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FluxKontextSettingsProps {
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  numImages: number;
  onNumImagesChange: (numImages: number) => void;
  guidanceScale: number;
  onGuidanceScaleChange: (scale: number) => void;
  safetyTolerance: string;
  onSafetyToleranceChange: (value: string) => void;
  outputFormat: 'jpeg' | 'png';
  onOutputFormatChange: (format: 'jpeg' | 'png') => void;
  enhancePrompt: boolean;
  onEnhancePromptChange: (checked: boolean) => void;
  seed?: number;
  disabled?: boolean;
}

export default function FluxKontextSettings({
  aspectRatio,
  onAspectRatioChange,
  numImages,
  onNumImagesChange,
  guidanceScale,
  onGuidanceScaleChange,
  safetyTolerance,
  onSafetyToleranceChange,
  outputFormat,
  onOutputFormatChange,
  enhancePrompt,
  onEnhancePromptChange,
  seed,
  disabled = false
}: FluxKontextSettingsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm flex items-center gap-1">
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Aspect Ratio Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground/90">Aspect Ratio</Label>
          <Select 
            value={aspectRatio} 
            onValueChange={onAspectRatioChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
              <SelectItem value="4:3">Standard (4:3)</SelectItem>
              <SelectItem value="3:2">Photo (3:2)</SelectItem>
              <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
              <SelectItem value="9:16">Portrait (9:16)</SelectItem>
              <SelectItem value="2:3">Portrait (2:3)</SelectItem>
              <SelectItem value="21:9">Ultrawide (21:9)</SelectItem>
              <SelectItem value="3:4">Portrait (3:4)</SelectItem>
              <SelectItem value="9:21">Ultrawide Portrait (9:21)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Number of Images */}
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
        
        {/* Guidance Scale */}
        <div className="space-y-0.5">
          <Label htmlFor="guidance-scale" className="text-xs">Guidance Scale</Label>
          <Input
            id="guidance-scale"
            type="number"
            min={1}
            max={20}
            step={0.1}
            value={guidanceScale}
            onChange={(e) => onGuidanceScaleChange(parseFloat(e.target.value) || 7.5)}
            disabled={disabled}
            className="h-7 text-xs"
          />
        </div>
        
        {/* Safety Tolerance */}
        <div className="space-y-0.5">
          <Label className="text-xs font-medium text-foreground/90">Safety Tolerance</Label>
          <Select 
            value={safetyTolerance} 
            onValueChange={onSafetyToleranceChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select safety tolerance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 (Strict)</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="6">6 (Permissive)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Output Format */}
        <div className="space-y-0.5">
          <Label className="text-xs font-medium text-foreground/90">Output Format</Label>
          <Select 
            value={outputFormat} 
            onValueChange={(value) => onOutputFormatChange(value as 'jpeg' | 'png')}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Enhance Prompt */}
        <div className="flex items-center space-x-2">
          <Switch
            checked={enhancePrompt}
            onCheckedChange={onEnhancePromptChange}
            disabled={disabled}
            className="scale-75"
          />
          <Label className="text-xs font-medium text-foreground/90">Enhance Prompt</Label>
        </div>
        
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