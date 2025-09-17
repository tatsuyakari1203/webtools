'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Loader2, Wand2, Camera, Palette, Package, Minus, ImageIcon, Type } from 'lucide-react'
import { toast } from 'sonner'
import { useNanoBanana } from '../context/NanoBananaContext'


interface GenerateTabProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  setGeneratedImage: (image: string | null) => void
}

export const GenerateTab: React.FC<GenerateTabProps> = ({
  loading,
  setLoading,
  setGeneratedImage
}) => {
  const { state, updateGenerateState, startNewSession, setLastGeneratedImages } = useNanoBanana()
  const { generatePrompt, generateImageSize, generateImageCount } = state
  const [improvingPrompt, setImprovingPrompt] = React.useState(false)

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      toast.error('Please enter image description')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        prompt: generatePrompt,
        width: generateImageSize[0],
        height: generateImageSize[0],
        quality: 'ultra',
        num_images: generateImageCount[0]
      }

      const response = await fetch('/api/nano-banana/generate', {
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
      
      if (data.success && data.image_data) {
        console.log('GenerateTab Debug - data.image_data:', data.image_data)
        console.log('GenerateTab Debug - data.image_data is array:', Array.isArray(data.image_data))
        console.log('GenerateTab Debug - data.num_images:', data.num_images)
        
        // Handle multiple images
        const images = Array.isArray(data.image_data) ? data.image_data : [data.image_data]
        const imageUrls = images.map((imageData: string) => `data:image/png;base64,${imageData}`)
        
        console.log('GenerateTab Debug - images.length:', images.length)
        console.log('GenerateTab Debug - imageUrls.length:', imageUrls.length)
        
        // Start new session for each generation
        startNewSession()
        setLastGeneratedImages(imageUrls)
        setGeneratedImage(imageUrls[0]) // Set first image for backward compatibility
        
        console.log('GenerateTab Debug - setLastGeneratedImages called with:', imageUrls.length, 'images')
        
        toast.success(`${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} generated successfully!`)
      } else {
        throw new Error(data.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleImprovePrompt = async (category: string) => {
    if (!generatePrompt.trim()) {
      toast.error('Please enter a prompt first')
      return
    }

    setImprovingPrompt(true)
    
    // Import streaming utility dynamically
    const { handleStreamingImprovePrompt } = await import('../utils/streamingApi')
    
    try {
      let accumulatedText = ''
      
      await handleStreamingImprovePrompt(
        generatePrompt,
        category,
        // onChunk callback - update prompt in real-time
        (chunk: string, accumulated: string) => {
          accumulatedText = accumulated
          updateGenerateState({ generatePrompt: accumulatedText })
        },
        // onComplete callback
        (finalPrompt: string) => {
          updateGenerateState({ generatePrompt: finalPrompt })
          toast.success(`Prompt improved for ${category} style!`)
        },
        // onError callback
        (error: string) => {
          console.error('Streaming error:', error)
          toast.error('Unable to improve prompt')
        },
        // No image for generate tab improve prompt
        undefined
      )
      
    } catch (error) {
      console.error('Error improving prompt:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to improve prompt')
    } finally {
      setImprovingPrompt(false)
    }
  }



  return (
    <div className="space-y-6">
      {/* Prompt Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Describe Your Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a detailed description of the image you want to generate
            </p>
          </div>
          <div>
            <Label htmlFor="prompt" className="text-sm font-medium">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={generatePrompt}
              onChange={(e) => updateGenerateState({ generatePrompt: e.target.value })}
              className="min-h-[120px] mt-2 resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Enhance Prompt Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Enhance Your Prompt</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a style to automatically improve your prompt
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('photorealistic')}
              disabled={loading || improvingPrompt || !generatePrompt.trim()}
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs hover:bg-accent"
            >
              <Camera className="w-4 h-4" />
              <span>Photo</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('artistic')}
              disabled={loading || improvingPrompt || !generatePrompt.trim()}
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs hover:bg-accent"
            >
              <Palette className="w-4 h-4" />
              <span>Artistic</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('product')}
              disabled={loading || improvingPrompt || !generatePrompt.trim()}
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs hover:bg-accent"
            >
              <Package className="w-4 h-4" />
              <span>Product</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('minimalist')}
              disabled={loading || improvingPrompt || !generatePrompt.trim()}
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs hover:bg-accent"
            >
              <Minus className="w-4 h-4" />
              <span>Minimal</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('illustration')}
              disabled={loading || improvingPrompt || !generatePrompt.trim()}
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs hover:bg-accent"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Illustration</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('logo')}
              disabled={loading || improvingPrompt || !generatePrompt.trim()}
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-xs hover:bg-accent"
            >
              <Type className="w-4 h-4" />
              <span>Logo</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Settings Section */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Generation Settings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Customize the size and quantity of generated images
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Image Size</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {generateImageSize[0]}×{generateImageSize[0]}px
                </span>
              </div>
              <Slider
                value={generateImageSize}
                onValueChange={(value) => updateGenerateState({ generateImageSize: value })}
                min={512}
                max={2048}
                step={256}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>512px</span>
                <span>2048px</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Number of Images</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {generateImageCount[0]} {generateImageCount[0] === 1 ? 'image' : 'images'}
                </span>
              </div>
              <Slider
                value={generateImageCount}
                onValueChange={(value) => updateGenerateState({ generateImageCount: value })}
                min={1}
                max={4}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Generate Action */}
      <div className="pt-2">
        <Button
          onClick={handleGenerate}
          disabled={loading || !generatePrompt.trim()}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating {generateImageCount[0]} {generateImageCount[0] === 1 ? 'image' : 'images'}...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate {generateImageCount[0]} {generateImageCount[0] === 1 ? 'Image' : 'Images'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}