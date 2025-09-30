'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowUp, Info } from 'lucide-react'
import { MultiImageInput } from './MultiImageInput'
import { useNanoBanana } from '../context/NanoBananaContext'
import { toast } from 'sonner'

interface UpscaleTabProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  setGeneratedImage: (image: string | null) => void
}

export const UpscaleTab: React.FC<UpscaleTabProps> = ({
  loading,
  setLoading,
  setGeneratedImage
}) => {
  const { setLastGeneratedImages } = useNanoBanana()
  
  // Local state for upscale functionality
  const [upscaleImages, setUpscaleImages] = useState<File[]>([])
  const [upscaleImagePreviews, setUpscaleImagePreviews] = useState<string[]>([])
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2.0)
  const [autoOptimal, setAutoOptimal] = useState<boolean>(true)
  const handleUpscale = async () => {
    if (upscaleImages.length === 0) {
      toast.error('Please upload at least one image to upscale')
      return
    }

    setLoading(true)
    try {
      // Process each image
      const upscaledImages: string[] = []
      
      for (let i = 0; i < upscaleImages.length; i++) {
        const image = upscaleImages[i]
        
        // Convert image to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove data:image/...;base64, prefix
            const base64Data = result.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(image)
        })

        // Generate random seed for each upscale
        const randomSeed = Math.floor(Date.now() * Math.random()) % 1000000

        // Call SeedVR2 upscale API
        const requestData = {
          image: base64,
          upscale_factor: autoOptimal ? undefined : upscaleFactor,
          seed: randomSeed
        }

        const response = await fetch('/api/seedvr2/upscale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.image && data.image.url) {
          // Convert URL to base64 for display
          const imageResponse = await fetch(data.image.url)
          const imageBlob = await imageResponse.blob()
          const imageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(imageBlob)
          })
          upscaledImages.push(imageBase64)
        } else {
          throw new Error('Invalid response format from upscale API')
        }
      }

      // Set the results
      setLastGeneratedImages(upscaledImages)
      if (upscaledImages.length > 0) {
        setGeneratedImage(upscaledImages[0])
      }
      
      toast.success(`Successfully upscaled ${upscaledImages.length} image(s)!`)
      
    } catch (error) {
      console.error('Error upscaling images:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upscale images')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5" />
            Upscale Images
          </CardTitle>
          <CardDescription>
            Enhance image resolution using AI upscaling technology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Images */}
          <div className="space-y-2">
            <MultiImageInput
              label="Images to Upscale"
              values={upscaleImages}
              onChange={setUpscaleImages}
              previews={upscaleImagePreviews}
              onPreviewsChange={setUpscaleImagePreviews}
              maxFiles={4}
              accept="image/*"
            />
            <p className="text-xs text-muted-foreground">
              Upload up to 4 images. Supported formats: PNG, JPG, JPEG, WebP
            </p>
          </div>

          {/* Auto Optimal Factor */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-optimal"
                checked={autoOptimal}
                onCheckedChange={(checked) => setAutoOptimal(checked as boolean)}
              />
              <Label htmlFor="auto-optimal" className="text-sm font-normal">
                Auto-calculate optimal upscale factor
              </Label>
            </div>
            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                When enabled, the system automatically calculates the maximum upscale factor 
                that keeps the output within 3840×2160 resolution limits.
              </p>
            </div>
          </div>

          {/* Manual Upscale Factor */}
          {!autoOptimal && (
            <div className="space-y-2">
              <Label htmlFor="upscale-factor">Upscale Factor</Label>
              <Input
                id="upscale-factor"
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={upscaleFactor}
                onChange={(e) => setUpscaleFactor(parseFloat(e.target.value) || 2.0)}
                placeholder="2.0"
              />
              <p className="text-xs text-muted-foreground">
                Factor between 1.0 and 10.0. Higher values create larger images but may exceed size limits.
              </p>
            </div>
          )}



          {/* Upscale Button */}
          <Button
            onClick={handleUpscale}
            disabled={loading || upscaleImages.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Upscaling images...
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4 mr-2" />
                Upscale Images ({upscaleImages.length})
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}