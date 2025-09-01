'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Image as ImageIcon, Loader2, Maximize2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Lightbox } from './Lightbox'

interface ResultDisplayProps {
  image: string | null
  loading: boolean
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ image, loading }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const handleDownload = async () => {
    if (!image) return

    try {
      let blob: Blob
      
      if (image.startsWith('blob:')) {
        // Handle blob URL
        const response = await fetch(image)
        blob = await response.blob()
      } else if (image.startsWith('data:image')) {
        // Handle base64 data URL
        const response = await fetch(image)
        blob = await response.blob()
      } else {
        toast.error('Invalid image format')
        return
      }

      // Create download link
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

  const handleRefine = () => {
    // This will be handled by switching to the conversation tab
    // The parent component should handle this
    toast.info('Switch to the Refine tab to make adjustments')
  }

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Generating image...</p>
              </div>
            ) : image ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={image}
                    alt="Generated result"
                    className="w-full rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                    onClick={() => setIsLightboxOpen(true)}
                  />
                  
                  {/* Overlay with view button */}
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
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    onClick={handleDownload}
                    className="col-span-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={handleRefine}
                  className="w-full"
                >
                  Refine Image
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Generated or edited images will be displayed here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Lightbox - Rendered outside of Card for true full screen */}
      {image && (
        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageSrc={image}
          onDownload={handleDownload}
        />
      )}
    </>
  )
}