'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Wand2, Sparkles, Camera, Palette, Package, Minus, Image as ImageIcon, Type } from 'lucide-react'
import { MultiImageInput } from './MultiImageInput'
import { useNanoBanana } from '../context/NanoBananaContext'
import { toast } from 'sonner'

// Helper function to get operation labels in English
function getOperationLabel(operationType: string): string {
  switch (operationType) {
    case 'edit':
      return 'edit'
    case 'compose':
      return 'compose'
    case 'style_transfer':
      return 'style transfer'
    default:
      return operationType
  }
}

type OperationType = 'edit' | 'compose' | 'style_transfer'

interface EditTabProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  setGeneratedImage: (image: string | null) => void
}

export const EditTab: React.FC<EditTabProps> = ({
  loading,
  setLoading,
  setGeneratedImage
}) => {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [imageCount, setImageCount] = useState(1)
  const [operationType, setOperationType] = useState<OperationType>('edit')
  const [improvingPrompt, setImprovingPrompt] = useState<string | null>(null)
  const [includeImageForImprove, setIncludeImageForImprove] = useState(true)
  
  const { setLastGeneratedImages, updateEditState } = useNanoBanana()

  // Smart operation detection based on number of images
  useEffect(() => {
    if (images.length >= 2 && operationType === 'edit') {
      setOperationType('compose')
      toast.info('Automatically switched to Compose mode due to multiple images')
    } else if (images.length === 1 && operationType === 'compose') {
      setOperationType('edit')
    }
  }, [images.length, operationType])

  // Update editImagePreview in context when imagePreviews change
  useEffect(() => {
    const newPreview = imagePreviews.length > 0 ? imagePreviews[0] : ''
    updateEditState({ editImagePreview: newPreview })
  }, [imagePreviews, updateEditState])



  const handleImprovePrompt = async (category: string) => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt before improving')
      return
    }

    setImprovingPrompt(category)
    
    try {
      // Use FormData to send both prompt and image
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('category', category)
      
      // Include the first uploaded image if available and checkbox is checked
      if (images.length > 0 && includeImageForImprove) {
        formData.append('image', images[0])
      }
      
      const response = await fetch('/api/nano-banana/improve-prompt', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }
      
      let accumulatedText = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setPrompt(accumulatedText)
                toast.success('Prompt improved successfully!')
                return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedText += parsed.content
                setPrompt(accumulatedText)
              }
            } catch {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Improve prompt error:', error)
      toast.error('An error occurred while improving the prompt')
    } finally {
      setImprovingPrompt(null)
    }
  }

  const handleGenerate = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }
    
    if (!prompt.trim()) {
      toast.error('Please enter a description for the image')
      return
    }

    // Validate operation requirements
    if (operationType === 'compose' && images.length < 2) {
      toast.error('Compose mode requires at least 2 images')
      return
    }

    if (operationType === 'style_transfer' && images.length < 2) {
      toast.error('Style Transfer mode requires at least 2 images')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('instruction', prompt.trim())
      formData.append('operationType', operationType)
      formData.append('numImages', imageCount.toString())
      
      // Add all images to formData
      images.forEach((image, index) => {
        formData.append(`image${index === 0 ? '' : index}`, image)
      })
      
      console.log('Sending request with:', {
        imageCount: images.length,
        prompt,
        operationType,
        generateCount: imageCount
      })
      
      const response = await fetch('/api/nano-banana/edit', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }
      
      const data = await response.json()
      console.log('Edit response:', data)
      
      if (data.success) {
        // Handle both single image and multiple images response
        const images = Array.isArray(data.imageData) ? data.imageData : [data.imageData]
        
        if (images && images.length > 0) {
          // Convert base64 to blob URLs for display
          const imageUrls = images.map((base64: string) => {
            const byteCharacters = atob(base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/png' })
            return URL.createObjectURL(blob)
          })
          
          // Set multiple images for the gallery
          setLastGeneratedImages(imageUrls)
          
          // Set the first image for backward compatibility
          setGeneratedImage(imageUrls[0])
          
          toast.success(`${getOperationLabel(operationType)} completed successfully for ${imageUrls.length} images!`)
        } else {
          throw new Error('No images received from server')
        }
      } else {
        throw new Error(data.error || 'Unable to process image')
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred while processing the image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Edit Images with AI
          </CardTitle>
          <CardDescription>
            Upload images and describe the changes you want to make
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Images */}
          <div className="space-y-2">
            <MultiImageInput
              label="Input Images"
              values={images}
              onChange={setImages}
              previews={imagePreviews}
              onPreviewsChange={setImagePreviews}
              maxFiles={4}
              accept="image/*"
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe Changes</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the changes you want to make to the image..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Include Image for Improve Checkbox */}
          {images.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-image-improve"
                checked={includeImageForImprove}
                onCheckedChange={(checked) => setIncludeImageForImprove(checked as boolean)}
              />
              <Label htmlFor="include-image-improve" className="text-sm font-normal">
                Include image to improve prompt
              </Label>
            </div>
          )}

          {/* Enhance Prompt Buttons */}
          <div className="space-y-2">
            <Label>Improve Prompt</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('photorealistic')}
                disabled={loading || improvingPrompt === 'photorealistic' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'photorealistic' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Camera className="h-3 w-3 mr-1" />
                )}
                Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('artistic')}
                disabled={loading || improvingPrompt === 'artistic' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'artistic' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Palette className="h-3 w-3 mr-1" />
                )}
                Artistic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('product')}
                disabled={loading || improvingPrompt === 'product' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'product' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Package className="h-3 w-3 mr-1" />
                )}
                Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('minimalist')}
                disabled={loading || improvingPrompt === 'minimalist' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'minimalist' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Minus className="h-3 w-3 mr-1" />
                )}
                Minimal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('illustration')}
                disabled={loading || improvingPrompt === 'illustration' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'illustration' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <ImageIcon className="h-3 w-3 mr-1" />
                )}
                Illustration
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('logo')}
                disabled={loading || improvingPrompt === 'logo' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'logo' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Type className="h-3 w-3 mr-1" />
                )}
                Logo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('edit')}
                disabled={loading || improvingPrompt === 'edit' || !prompt.trim()}
                className="text-xs col-span-2"
              >
                {improvingPrompt === 'edit' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Edit
              </Button>
            </div>
          </div>

          {/* Image Count Setting */}
          <div className="space-y-2">
            <Label htmlFor="image-count">Number of Images to Generate</Label>
            <Input
              id="image-count"
              type="number"
              min="1"
              max="4"
              value={imageCount}
              onChange={(e) => setImageCount(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Generate 1-4 images at once. More images will take longer to process.
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || images.length === 0 || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating images...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Images ({imageCount})
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}