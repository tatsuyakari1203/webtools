'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Camera, Settings, Palette, Download, RotateCcw, User, Calendar } from 'lucide-react';
import type { SettingsPanelProps, FrameConfig } from '../../types';
import { formatCameraName } from '../../services/exifService';

const FRAME_STYLES = [
  { id: 'classic', name: 'Classic', description: 'Traditional white border' },
  { id: 'modern', name: 'Modern', description: 'Clean minimal design' },
  { id: 'vintage', name: 'Vintage', description: 'Aged paper texture' },
  { id: 'professional', name: 'Professional', description: 'Gallery-style presentation' }
];

const FRAME_COLORS = [
  { id: 'white', name: 'White', value: '#FFFFFF' },
  { id: 'black', name: 'Black', value: '#000000' },
  { id: 'gray', name: 'Gray', value: '#6B7280' },
  { id: 'cream', name: 'Cream', value: '#FEF7ED' }
];

const BAR_POSITIONS = [
  { id: 'bottom', name: 'Footer (Bottom)', description: 'Metadata bar at bottom' },
  { id: 'top', name: 'Header (Top)', description: 'Metadata bar at top' },
  { id: 'both', name: 'Both', description: 'Header and footer bars' }
];

export default function SettingsPanel({
  config,
  exifData,
  onConfigChange,
  onExport,
  onReset,
  isProcessing
}: SettingsPanelProps) {
  
  const updateConfig = (updates: Partial<FrameConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Camera Information */}
      {exifData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4" />
              Detected Camera Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Camera:</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {formatCameraName(exifData)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Aperture:</span>
                <div className="font-mono">{exifData.settings.aperture}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Shutter:</span>
                <div className="font-mono">{exifData.settings.shutterSpeed}</div>
              </div>
              <div>
                <span className="text-muted-foreground">ISO:</span>
                <div className="font-mono">{exifData.settings.iso}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Focal:</span>
                <div className="font-mono">{exifData.settings.focalLength}</div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Taken: {new Date(exifData.datetime).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Bar Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Metadata Bar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bar Position */}
          <div className="space-y-2">
            <Label className="text-xs">Bar Position</Label>
            <Select
              value={config.barPosition || 'bottom'}
              onValueChange={(value) => updateConfig({ barPosition: value as any })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BAR_POSITIONS.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    <div>
                      <div className="font-medium text-xs">{position.name}</div>
                      <div className="text-xs text-muted-foreground">{position.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Show Camera Info */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Camera Info</Label>
            <Switch
              checked={config.showMetadata}
              onCheckedChange={(checked) => updateConfig({ showMetadata: checked })}
            />
          </div>

          {/* Custom Camera Brand */}
          <div className="space-y-2">
            <Label className="text-xs">Camera Brand (Custom)</Label>
            <Input
              value={config.customCameraBrand || ''}
              onChange={(e) => updateConfig({ customCameraBrand: e.target.value })}
              placeholder={exifData ? formatCameraName(exifData) : 'Enter camera brand...'}
              className="h-8 text-xs"
            />
          </div>

          {/* Custom Photo Settings */}
          <div className="space-y-2">
            <Label className="text-xs">Photo Settings (Custom)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={config.customAperture || ''}
                onChange={(e) => updateConfig({ customAperture: e.target.value })}
                placeholder={exifData?.settings.aperture || 'f/2.8'}
                className="h-8 text-xs"
              />
              <Input
                value={config.customShutter || ''}
                onChange={(e) => updateConfig({ customShutter: e.target.value })}
                placeholder={exifData?.settings.shutterSpeed || '1/60s'}
                className="h-8 text-xs"
              />
              <Input
                value={config.customISO || ''}
                onChange={(e) => updateConfig({ customISO: e.target.value })}
                placeholder={exifData?.settings.iso?.toString() || 'ISO 400'}
                className="h-8 text-xs"
              />
              <Input
                value={config.customFocal || ''}
                onChange={(e) => updateConfig({ customFocal: e.target.value })}
                placeholder={exifData?.settings.focalLength || '50mm'}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Photographer Name */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" />
              Photographer Name
            </Label>
            <Input
              value={config.photographerName || ''}
              onChange={(e) => updateConfig({ photographerName: e.target.value })}
              placeholder="Enter photographer name..."
              className="h-8 text-xs"
            />
          </div>

          {/* Custom Date */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date (Custom)
            </Label>
            <Input
              value={config.customDate || ''}
              onChange={(e) => updateConfig({ customDate: e.target.value })}
              placeholder={exifData ? new Date(exifData.datetime).toLocaleDateString() : 'Enter date...'}
              className="h-8 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Frame Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="h-4 w-4" />
            Frame Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Style</Label>
            <Select
              value={config.style}
              onValueChange={(value) => updateConfig({ style: value as FrameConfig['style'] })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAME_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    <div>
                      <div className="font-medium text-xs">{style.name}</div>
                      <div className="text-xs text-muted-foreground">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <Select
              value={config.color}
              onValueChange={(value) => updateConfig({ color: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAME_COLORS.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs">{color.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Border Width: {config.borderWidth}px</Label>
            <Slider
              min={10}
              max={100}
              step={5}
              value={[config.borderWidth]}
              onValueChange={([value]) => updateConfig({ borderWidth: value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Font Size: {config.fontSize}px</Label>
            <Slider
              min={8}
              max={24}
              step={1}
              value={[config.fontSize]}
              onValueChange={([value]) => updateConfig({ fontSize: value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4" />
            Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Format</Label>
            <Select
              value={config.exportFormat}
              onValueChange={(value) => updateConfig({ exportFormat: value as FrameConfig['exportFormat'] })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Quality: {Math.round(config.exportQuality * 100)}%</Label>
            <Slider
              min={0.5}
              max={1}
              step={0.05}
              value={[config.exportQuality]}
              onValueChange={([value]) => updateConfig({ exportQuality: value })}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="space-y-2 pb-4">
        <Button
          onClick={onExport}
          disabled={isProcessing}
          className="w-full h-8"
          size="sm"
        >
          <Download className="h-3 w-3 mr-2" />
          {isProcessing ? 'Exporting...' : 'Export Frame'}
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="w-full h-8"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset Settings
        </Button>
      </div>
    </div>
  );
}