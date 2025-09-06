'use client'

import React, { useState } from 'react'
import { useWallpaper } from '@/components/providers/WallpaperProvider'
import { WallpaperItem, RotationMode } from '@/types/wallpaper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, SkipForward, SkipBack, Edit2, Check, X, RotateCcw } from 'lucide-react'
import { LazyImage } from '@/components/ui/LazyImage'

interface WallpaperManagerProps {
  onClose?: () => void
}

export function WallpaperManager({ onClose }: WallpaperManagerProps) {
  const {
    wallpapers,
    currentWallpaper,
    addWallpaper,
    removeWallpaper,
    updateWallpaper,
    setCurrentWallpaper,
    rotationSettings,
    updateRotationSettings,
    nextWallpaper,
    previousWallpaper,
    enableBlur,
    setEnableBlur,
    enableZoom,
    setEnableZoom,
    zoomLevel,
    setZoomLevel,
    resetToDefault
  } = useWallpaper()

  const [newWallpaperUrl, setNewWallpaperUrl] = useState('')
  const [newWallpaperName, setNewWallpaperName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAddWallpaper = () => {
    if (newWallpaperUrl.trim()) {
      addWallpaper(newWallpaperUrl.trim(), newWallpaperName.trim() || undefined)
      setNewWallpaperUrl('')
      setNewWallpaperName('')
    }
  }

  const handleEditStart = (wallpaper: WallpaperItem) => {
    setEditingId(wallpaper.id)
    setEditingName(wallpaper.name || '')
  }

  const handleEditSave = () => {
    if (editingId) {
      updateWallpaper(editingId, { name: editingName.trim() })
      setEditingId(null)
      setEditingName('')
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingName('')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="w-full space-y-6">
          {/* Add New Wallpaper */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter wallpaper URL..."
              value={newWallpaperUrl}
              onChange={(e) => setNewWallpaperUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddWallpaper()}
              className="flex-1"
            />
            <Input
              placeholder="Name (optional)"
              value={newWallpaperName}
              onChange={(e) => setNewWallpaperName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddWallpaper()}
              className="w-40"
            />
            <Button
              onClick={handleAddWallpaper}
              disabled={!newWallpaperUrl.trim()}
              size="default"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Wallpaper Controls */}
          {wallpapers.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {currentWallpaper?.name || 'Untitled'}
                </span>
                <Badge variant="secondary" className="text-xs">
                   {rotationSettings.mode === 'manual' ? 'Manual' : 
                    rotationSettings.mode === 'timer' ? `${rotationSettings.timerInterval}m` :
                    'Refresh'}
                 </Badge>
                <span className="text-sm text-muted-foreground">
                  {wallpapers.findIndex(w => w.id === currentWallpaper?.id) + 1} / {wallpapers.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Blur Toggle */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Blur</label>
                  <Switch
                    checked={enableBlur}
                    onCheckedChange={setEnableBlur}
                  />
                </div>
                {/* Zoom Slider */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Zoom</label>
                  <Switch
                    checked={enableZoom}
                    onCheckedChange={setEnableZoom}
                  />
                </div>
                {/* Zoom Level Slider */}
                {enableZoom && (
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Level</label>
                    <Slider
                      value={[zoomLevel || 1.0]}
                      onValueChange={(value) => setZoomLevel(value[0])}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-6 text-center">{(zoomLevel || 1.0).toFixed(1)}x</span>
                  </div>
                )}
                {/* Navigation Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={previousWallpaper}
                    disabled={wallpapers.length <= 1}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={nextWallpaper}
                    disabled={wallpapers.length <= 1}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Wallpaper Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {wallpapers.map((wallpaper) => (
              <div 
                key={wallpaper.id} 
                className={`group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer transition-all hover:scale-105 ${
                  currentWallpaper?.id === wallpaper.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setCurrentWallpaper(wallpaper.id)}
                style={{ display: 'block' }}
              >
                {/* Wallpaper Preview */}
                <LazyImage
                  src={wallpaper.url}
                  alt={wallpaper.name || 'Wallpaper'}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    minWidth: '100%',
                    minHeight: '100%',
                    width: '100%',
                    height: '100%'
                  }}
                />
                
                {/* Full Overlay */}
                <div 
                  className="absolute inset-0 bg-transparent group-hover:bg-black/50 transition-all duration-300"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%'
                  }}
                >
                    {/* Content positioned at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    {editingId === wallpaper.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="text-xs h-6 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                        <Button size="sm" variant="ghost" onClick={handleEditSave} className="h-6 w-6 p-0 text-white hover:bg-white/20">
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleEditCancel} className="h-6 w-6 p-0 text-white hover:bg-white/20">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium truncate">
                          {wallpaper.name || 'Untitled'}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditStart(wallpaper)
                            }}
                            className="h-6 w-6 p-0 text-white hover:bg-white/20"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeWallpaper(wallpaper.id)
                            }}
                            className="h-6 w-6 p-0 text-white hover:bg-red-500/50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                     </div>
                     
                     {/* Current indicator */}
                     {currentWallpaper?.id === wallpaper.id && (
                       <div className="absolute top-2 right-2">
                         <Badge variant="default" className="text-xs">
                           Active
                         </Badge>
                       </div>
                     )}
                 </div>
               </div>
            ))}
          </div>

          {wallpapers.length === 0 && (
            <div className="text-center py-8 p-4 border rounded-lg">
              <p className="text-muted-foreground">No wallpapers added yet. Add your first wallpaper above!</p>
            </div>
          )}

          {/* Rotation Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Auto Rotation</h3>
                  {rotationSettings.mode !== 'manual' && (
                    <Badge variant="secondary" className="text-xs">
                      {rotationSettings.mode === 'timer' ? `${rotationSettings.mode} • ${rotationSettings.timerInterval}m` : rotationSettings.mode}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically change wallpapers
                </p>
              </div>
              <Switch
                checked={rotationSettings.mode !== 'manual'}
                onCheckedChange={(enabled) => updateRotationSettings({ mode: enabled ? 'timer' : 'manual' })}
              />
            </div>

            {rotationSettings.mode !== 'manual' && (
              <div className="space-y-3 pt-2 border-t">
                {/* Mode Selection */}
                <div className="flex gap-2">
                  <Button
                    variant={rotationSettings.mode === 'timer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateRotationSettings({ mode: 'timer' })}
                  >
                    Timer
                  </Button>
                  <Button
                    variant={rotationSettings.mode === 'refresh' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateRotationSettings({ mode: 'refresh' })}
                  >
                    On Refresh
                  </Button>
                </div>

                {/* Timer Interval */}
                {rotationSettings.mode === 'timer' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Interval:</label>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={rotationSettings.timerInterval}
                      onChange={(e) => updateRotationSettings({ timerInterval: parseInt(e.target.value) || 30 })}
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                )}

                {/* Random Order */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Random Order</label>
                  <Switch
                    checked={rotationSettings.randomOrder}
                    onCheckedChange={(randomOrder) => updateRotationSettings({ randomOrder })}
                  />
                </div>
              </div>
            )}

            {/* Manual Controls */}
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={previousWallpaper}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={nextWallpaper}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Reset All */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to reset all wallpaper settings? This cannot be undone.')) {
                  resetToDefault()
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
    </div>
  )
}