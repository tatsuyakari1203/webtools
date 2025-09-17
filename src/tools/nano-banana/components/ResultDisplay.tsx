'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Image as ImageIcon, Loader2, Maximize2, Grid3X3, Eye, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { Lightbox } from './Lightbox'
import { useNanoBanana } from '../context/NanoBananaContext'

interface ResultDisplayProps {
  image: string | null
  loading: boolean
  setGeneratedImage: (image: string | null) => void
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  image, 
  loading, 
  setGeneratedImage
}) => {
  const { state } = useNanoBanana()
  const { lastGeneratedImages } = state
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')

  // Auto-switch to grid mode when multiple images are available
  useEffect(() => {
    if (lastGeneratedImages && lastGeneratedImages.length > 1) {
      setViewMode('grid')
    } else if (lastGeneratedImages && lastGeneratedImages.length === 1) {
      setViewMode('single')
      setGeneratedImage(lastGeneratedImages[0])
    }
  }, [lastGeneratedImages, setGeneratedImage])

  // Handle image selection
  const handleImageSelect = useCallback((imageUrl: string, index: number) => {
    setSelectedImageIndex(index)
    setGeneratedImage(imageUrl)
    setViewMode('single')
  }, [setGeneratedImage])

  // Download single image
  const handleDownload = async (imageUrl?: string) => {
    const targetImage = imageUrl || image
    if (!targetImage) return

    try {
      const response = await fetch(targetImage)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nano-banana-${Date.now()}.png`
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

  // Download all images
  const handleDownloadAll = async () => {
    if (!lastGeneratedImages || lastGeneratedImages.length === 0) return

    try {
      for (let i = 0; i < lastGeneratedImages.length; i++) {
        const response = await fetch(lastGeneratedImages[i])
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `nano-banana-${i + 1}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        // Small delay between downloads
        if (i < lastGeneratedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      toast.success(`Downloaded ${lastGeneratedImages.length} images successfully!`)
    } catch (error) {
      console.error('Error downloading images:', error)
      toast.error('Failed to download images')
    }
  }

  // Render loading state
  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Generating image...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render no results state
  if (!lastGeneratedImages || lastGeneratedImages.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No images generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">Generate an image to see results here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Result
              <Badge variant="secondary">
                {lastGeneratedImages.length} image{lastGeneratedImages.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            {/* View Mode Toggle */}
            {lastGeneratedImages.length > 1 && (
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('single')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lastGeneratedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-200"
                    onClick={() => handleImageSelect(imageUrl, index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="secondary" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    
                    {/* Image Number */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    
                    {/* Download Button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(imageUrl)
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Grid Actions */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={handleDownloadAll}
                  disabled={lastGeneratedImages.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All ({lastGeneratedImages.length})
                </Button>
              </div>
            </div>
          )}

          {/* Single View */}
          {viewMode === 'single' && image && (
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative group">
                <img
                  src={image}
                  alt="Generated result"
                  className="w-full rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                  onClick={() => setIsLightboxOpen(true)}
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/90 hover:bg-white text-black shadow-lg"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <Maximize2 className="mr-2 h-5 w-5" />
                    View Full Size
                  </Button>
                </div>
                
                {/* Image Info */}
                {lastGeneratedImages.length > 1 && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary">
                      {selectedImageIndex + 1} of {lastGeneratedImages.length}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {lastGeneratedImages.length > 1 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Other Generated Images</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {lastGeneratedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImageIndex === index 
                            ? 'border-primary shadow-lg' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleImageSelect(imageUrl, index)}
                      >
                        <img
                          src={imageUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-16 h-16 object-cover"
                        />
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary rounded-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single View Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleDownload()}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {lastGeneratedImages.length > 1 && (
                  <Button
                    onClick={() => setViewMode('grid')}
                    variant="outline"
                    size="sm"
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
       {isLightboxOpen && image && (
         <Lightbox
           isOpen={isLightboxOpen}
           imageSrc={image}
           onClose={() => setIsLightboxOpen(false)}
           onDownload={() => handleDownload()}
         />
       )}
    </>
  )
}