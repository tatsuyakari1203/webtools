'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, History, Trash2, Eye, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { Lightbox } from './Lightbox'
import { HistoryItem, getGlobalHistory, removeFromGlobalHistory, clearGlobalHistory, getStorageInfo, cleanupOldHistory } from '../utils/globalHistory'

interface HistoryTabProps {
  setGeneratedImage: (image: string | null) => void
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ setGeneratedImage }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [storageInfo, setStorageInfo] = useState({ itemCount: 0, sizeInMB: 0, estimatedQuotaUsage: 0 })

  // Load history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      setHistory(getGlobalHistory())
      setStorageInfo(getStorageInfo())
    }
    loadHistory()
  }, [])

  // Refresh history periodically to catch updates from other tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(getGlobalHistory())
      setStorageInfo(getStorageInfo())
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleDownload = async (item: HistoryItem) => {
    try {
      let blob: Blob
      
      if (item.image.startsWith('blob:')) {
        const response = await fetch(item.image)
        blob = await response.blob()
      } else if (item.image.startsWith('data:image')) {
        const response = await fetch(item.image)
        blob = await response.blob()
      } else {
        toast.error('Invalid image format')
        return
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nano-banana-${item.type}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Image downloaded successfully!')
    } catch (error) {
      console.error('Error downloading image:', error)
      toast.error('Failed to download image')
    }
  }

  const handleDelete = (id: string) => {
    if (removeFromGlobalHistory(id)) {
      setHistory(getGlobalHistory())
      setStorageInfo(getStorageInfo())
      toast.success('Image deleted from history')
    } else {
      toast.error('Failed to delete image')
    }
  }

  const handleClearAll = () => {
    if (clearGlobalHistory()) {
      setHistory([])
      setStorageInfo(getStorageInfo())
      toast.success('History cleared')
    } else {
      toast.error('Failed to clear history')
    }
  }

  const handleCleanupOld = () => {
    const result = cleanupOldHistory(25)
    if (result.cleaned) {
      setHistory(getGlobalHistory())
      setStorageInfo(getStorageInfo())
      toast.success(`Cleaned up ${result.removedCount} old images`)
    } else {
      toast.info('No cleanup needed')
    }
  }

  const handleUseImage = (image: string) => {
    setGeneratedImage(image)
    toast.success('Image loaded to workspace')
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'generate': return 'bg-blue-100 text-blue-800'
      case 'edit': return 'bg-green-100 text-green-800'
      case 'compose': return 'bg-purple-100 text-purple-800'
      case 'style': return 'bg-orange-100 text-orange-800'
      case 'refine': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              History ({history.length} images)
            </CardTitle>
            {history.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupOld}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Cleanup Old
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
          {storageInfo.itemCount > 0 && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
              <span>Storage: {storageInfo.sizeInMB.toFixed(1)} MB</span>
              {storageInfo.estimatedQuotaUsage > 70 && (
                <span className="text-orange-600 font-medium">
                  ⚠️ {storageInfo.estimatedQuotaUsage.toFixed(0)}% quota used
                </span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
              <History className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                No images in history yet.<br />
                Generated images will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={`${item.type} image`}
                      className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setSelectedImage(item.image)
                        setIsLightboxOpen(true)
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedImage(item.image)
                            setIsLightboxOpen(true)
                          }}
                          title="View full size"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUseImage(item.image)}
                          title="Use this image"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownload(item)}
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate" title={item.prompt}>
                      {item.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Lightbox */}
      {selectedImage && (
        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => {
            setIsLightboxOpen(false)
            setSelectedImage(null)
          }}
          imageSrc={selectedImage}
          onDownload={() => {
            const item = history.find(h => h.image === selectedImage)
            if (item) handleDownload(item)
          }}
        />
      )}
    </>
  )
}