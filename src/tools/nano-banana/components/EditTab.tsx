'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Wand2, Sparkles, Camera, Palette, Package, Minus, Image as ImageIcon, Type, Undo2, RotateCcw } from 'lucide-react'
import { MultiImageInput } from './MultiImageInput'
import { useNanoBanana } from '../context/NanoBananaContext'
import { toast } from 'sonner'
import { createDefaultPostfixProcessor, getImageDimensions } from '../postfix'
import type { PostfixContext } from '../postfix'

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
  // Use context state instead of local state for persistence
  const { 
    state, 
    setLastGeneratedImages, 
    updateEditState, 
    updateComposeState,
    saveOriginalEditPrompt,
    undoEditPrompt,
    saveEditImproveSettings,
    canUndoEdit,
    canRetryEdit,
    setMainImageIndex,
    setMainImageSize,
    updatePostfixState,
    setUpscaleEnabled
  } = useNanoBanana()
  const { editPrompt, editImageDescription, composePrompt, composeImages, composeImagePreviews, originalEditPrompt, lastEditImproveSettings } = state
  
  // Local state for UI-only concerns
  const [imageCount, setImageCount] = useState(1)
  const [operationType, setOperationType] = useState<OperationType>('edit')
  const [improvingPrompt, setImprovingPrompt] = useState<string | null>(null)
  const [includeImageForImprove, setIncludeImageForImprove] = useState(true)
  const [generatingDescription, setGeneratingDescription] = useState(false)
  
  // Postfix processor instance
  const [postfixProcessor] = useState(() => createDefaultPostfixProcessor())
  
  // Derived values based on operation type
  const images = composeImages
  const imagePreviews = composeImagePreviews
  const prompt = operationType === 'edit' ? editPrompt : composePrompt
  
  // Helper functions to update state
  const setPrompt = (value: string) => {
    if (operationType === 'edit') {
      updateEditState({ editPrompt: value })
      // Original prompt will be saved when user clicks improve
    } else {
      updateComposeState({ composePrompt: value })
    }
  }
  
  const setImages = (files: File[]) => {
    updateComposeState({ composeImages: files })
  }
  
  const setImagePreviews = (previews: string[]) => {
    updateComposeState({ composeImagePreviews: previews })
  }

  // Smart operation detection based on number of images
  useEffect(() => {
    if (images.length >= 2 && operationType === 'edit') {
      setOperationType('compose')
      toast.info('Automatically switched to Compose mode due to multiple images')
    } else if (images.length === 1 && operationType === 'compose') {
      setOperationType('edit')
    }
  }, [images.length, operationType])

  // Update AutoScalePostfix configuration when autoScaleEnabled changes
  useEffect(() => {
    postfixProcessor.setOperationEnabled('auto-scale', state.autoScaleEnabled)
    console.log(`AutoScalePostfix ${state.autoScaleEnabled ? 'enabled' : 'disabled'}`)
  }, [state.autoScaleEnabled, postfixProcessor])

  // Update UpscalePostfix configuration when upscale settings change
  useEffect(() => {
    postfixProcessor.setOperationEnabled('upscale', state.upscaleEnabled)
    
    if (state.upscaleEnabled) {
      // Auto-calculate optimal scale factor based on current image size
      let optimalFactor = 2.0 // Default factor
      const randomSeed = Math.floor(Math.random() * 1000000) // Random seed
      
      if (state.mainImageSize) {
        const { width, height } = state.mainImageSize
        const maxWidth = 3840
        const maxHeight = 2160
        
        // Calculate maximum possible scale factor that stays within limits
        const maxFactorByWidth = maxWidth / width
        const maxFactorByHeight = maxHeight / height
        const maxFactor = Math.min(maxFactorByWidth, maxFactorByHeight)
        
        // Use a reasonable scale factor (aim for 2x but respect limits)
        optimalFactor = Math.min(2.0, Math.floor(maxFactor * 10) / 10) // Round down to 1 decimal
        optimalFactor = Math.max(1.1, optimalFactor) // Minimum 1.1x scale
      }
      
      postfixProcessor.updateOperationConfig('upscale', {
        upscaleFactor: optimalFactor,
        seed: randomSeed
      })
      
      console.log(`UpscalePostfix enabled with auto-calculated factor ${optimalFactor} and seed ${randomSeed}`)
    } else {
      console.log('UpscalePostfix disabled')
    }
  }, [state.upscaleEnabled, state.mainImageSize, postfixProcessor])

  // Update main image size when images change
  useEffect(() => {
    const updateMainImageSize = async () => {
      if (images.length > 0 && state.mainImageIndex < images.length) {
        try {
          const mainImage = images[state.mainImageIndex]
          const dimensions = await getImageDimensions(mainImage)
          setMainImageSize(dimensions)
          console.log(`Main image size updated: ${dimensions.width}x${dimensions.height}`)
        } catch (error) {
          console.error('Failed to get main image dimensions:', error)
          setMainImageSize(null)
        }
      } else {
        setMainImageSize(null)
      }
    }

    updateMainImageSize()
  }, [images, state.mainImageIndex, setMainImageSize])

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

    // Save original prompt if not already saved (only for edit mode)
    if (operationType === 'edit' && !originalEditPrompt) {
      saveOriginalEditPrompt(prompt)
    }

    // Save improve settings (only for edit mode)
    if (operationType === 'edit') {
      saveEditImproveSettings(category, includeImageForImprove)
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

  const handleRetryImprove = async () => {
    if (!lastEditImproveSettings || !originalEditPrompt || operationType !== 'edit') {
      toast.error('No previous improve settings found')
      return
    }

    // Reset to original prompt first
    updateEditState({ editPrompt: originalEditPrompt })
    
    // Restore the include image setting
    setIncludeImageForImprove(lastEditImproveSettings.includeImage)
    
    // Wait a bit for state to update, then improve
    setTimeout(() => {
      handleImprovePrompt(lastEditImproveSettings.category)
    }, 100)
  }

  const handleGenerateDescription = async () => {
    if (images.length === 0) {
      toast.error('Please upload an image first')
      return
    }

    setGeneratingDescription(true)
    try {
      const formData = new FormData()
      formData.append('image', images[0])

      const response = await fetch('/api/nano-banana/describe-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      if (data.success) {
        updateEditState({ editImageDescription: data.description })
        toast.success('Image description generated successfully!')
      } else {
        throw new Error(data.error || 'Failed to generate description')
      }
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate description')
    } finally {
      setGeneratingDescription(false)
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
      
      // Add image description if available (dual-prompt support)
      if (editImageDescription && editImageDescription.trim()) {
        formData.append('imageDescription', editImageDescription.trim())
      }
      
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
        let outputImages = Array.isArray(data.imageData) ? data.imageData : [data.imageData]
        
        if (outputImages && outputImages.length > 0) {
          // Apply postfix processing if any feature is enabled
          if ((state.autoScaleEnabled && state.mainImageSize) || state.upscaleEnabled) {
            try {
              console.log('Applying postfix processing...')
              
              // Create postfix context
              const postfixContext: PostfixContext = {
                inputImages: images,
                inputImagePreviews: imagePreviews,
                mainImageIndex: state.mainImageIndex,
                mainImageSize: state.mainImageSize || undefined,
                operationType,
                prompt,
                outputImages
              }
              
              // Process images through postfix system
              const postfixResult = await postfixProcessor.processImages(postfixContext)
              
              if (postfixResult.errors && postfixResult.errors.length > 0) {
                console.warn('Postfix processing had errors:', postfixResult.errors)
                toast.warning(`Postfix processing completed with warnings: ${postfixResult.errors[0]}`)
              } else {
                console.log('Postfix processing completed successfully')
              }
              
              // Use processed images
              outputImages = postfixResult.processedImages
              
            } catch (error) {
              console.error('Postfix processing failed:', error)
              toast.error(`Postfix processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
              // Continue with original images if postfix fails
            }
          }
          
          // Convert base64 to blob URLs for display
          const imageUrls = outputImages.map((base64: string | { url?: string; data?: string } | unknown) => {
            try {
              // Handle different data types
              let base64String: string
              
              if (typeof base64 === 'string') {
                base64String = base64
              } else if (base64 && typeof base64 === 'object') {
                // Handle case where base64 might be an object (e.g., from API response)
                const base64Obj = base64 as { url?: string; data?: string }
                if (base64Obj.url) {
                  // If it's a URL object, we can't process it here
                  console.error('Received URL object instead of base64 string:', base64)
                  throw new Error('Invalid image format: URL object received')
                } else if (base64Obj.data) {
                  base64String = base64Obj.data
                } else {
                  base64String = String(base64)
                }
              } else {
                base64String = String(base64)
              }
              
              // Validate base64 string
              if (!base64String || base64String.trim() === '') {
                throw new Error('Empty base64 string')
              }
              
              // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
              const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String
              
              // Validate base64 format
              if (!base64Data || base64Data.trim() === '') {
                throw new Error('Invalid base64 format')
              }
              
              const byteCharacters = atob(base64Data)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const blob = new Blob([byteArray], { type: 'image/png' })
              return URL.createObjectURL(blob)
            } catch (error) {
              console.error('Failed to process image data:', error, 'Data:', base64)
              toast.error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`)
              // Return a placeholder or skip this image
              return null
            }
          }).filter(Boolean) as string[]
          
          // Set multiple images for the gallery
          setLastGeneratedImages(imageUrls)
          
          // Set the first image for backward compatibility
          setGeneratedImage(imageUrls[0])
          
          const enabledFeatures = []
          if (state.autoScaleEnabled) enabledFeatures.push('auto-scale')
          if (state.upscaleEnabled) enabledFeatures.push('AI upscale')
          
          const successMessage = enabledFeatures.length > 0
            ? `${getOperationLabel(operationType)} completed with ${enabledFeatures.join(' + ')} for ${imageUrls.length} images!`
            : `${getOperationLabel(operationType)} completed successfully for ${imageUrls.length} images!`
          
          toast.success(successMessage)
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

          {/* Image Description Input (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="imageDescription">Image Description (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription || images.length === 0}
                className="text-xs"
              >
                {generatingDescription ? (
                  <>
                    <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Generate
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="imageDescription"
              placeholder="Describe what's in the image (helps AI understand context better)..."
              value={editImageDescription}
              onChange={(e) => updateEditState({ editImageDescription: e.target.value })}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Providing an image description helps the AI better understand the context and generate more accurate results.
            </p>
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
            
            {/* Undo/Retry Buttons - Only show for edit mode */}
            {operationType === 'edit' && (canUndoEdit() || canRetryEdit()) && (
              <div className="flex gap-2 mt-2">
                {canUndoEdit() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => undoEditPrompt()}
                    disabled={loading || improvingPrompt !== null}
                    className="text-xs"
                  >
                    <Undo2 className="h-3 w-3 mr-1" />
                    Undo
                  </Button>
                )}
                {canRetryEdit() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryImprove}
                    disabled={loading || improvingPrompt !== null}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Post-Processing Features */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Post-Processing</Label>
            
            {/* Auto Scale Feature */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-scale"
                  checked={state.autoScaleEnabled}
                  onCheckedChange={(checked) => updatePostfixState({ autoScaleEnabled: checked as boolean })}
                />
                <Label htmlFor="auto-scale" className="text-sm font-normal">
                  Auto-scale output to match input size
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Automatically resize generated images to match the dimensions of the main input image.
                {state.upscaleEnabled && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    ⚠️ When used with AI Upscale: Auto-scale will run after upscaling to resize back to original dimensions.
                  </span>
                )}
              </p>

              {/* Main Image Selection - Only show when multiple images and auto-scale is enabled */}
              {images.length > 1 && state.autoScaleEnabled && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="main-image" className="text-sm">Main Image for Scaling</Label>
                  <select
                    id="main-image"
                    value={state.mainImageIndex}
                    onChange={(e) => setMainImageIndex(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
                  >
                    {images.map((_, index) => (
                      <option key={index} value={index}>
                        Image {index + 1}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Generated images will be scaled to match this image&apos;s dimensions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upscale Feature */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="upscale-enabled"
                checked={state.upscaleEnabled}
                onCheckedChange={(checked) => setUpscaleEnabled(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="upscale-enabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  AI Upscale (SeedVR2)
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Automatically enhance image quality and resolution using AI. Scale factor and settings are optimized automatically.
            </p>
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