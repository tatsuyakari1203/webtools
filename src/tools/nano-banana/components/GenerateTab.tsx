'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { Slider } from '@/components/ui/slider'
import { Loader2, Wand2, Sparkles } from 'lucide-react'
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
    try {
      const response = await fetch('/api/nano-banana/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generatePrompt,
          category
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.improved_prompt) {
        updateGenerateState({ generatePrompt: data.improved_prompt })
        toast.success(`Prompt improved for ${category} style!`)
      } else {
        throw new Error(data.error || 'Failed to improve prompt')
      }
    } catch (error) {
      console.error('Error improving prompt:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to improve prompt')
    } finally {
      setImprovingPrompt(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt">Image Description</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the image you want to generate..."
          value={generatePrompt}
          onChange={(e) => updateGenerateState({ generatePrompt: e.target.value })}
          rows={4}
          className="mt-1"
        />
        
        {/* Improve Prompt Buttons */}
        <div className="mt-3">
          <Label className="text-sm text-muted-foreground mb-2 block">Improve prompt for specific styles:</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('photorealistic')}
              disabled={improvingPrompt || !generatePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('artistic')}
              disabled={improvingPrompt || !generatePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Artistic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('product')}
              disabled={improvingPrompt || !generatePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('minimalist')}
              disabled={improvingPrompt || !generatePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Minimal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('illustration')}
              disabled={improvingPrompt || !generatePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Illustration
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('logo')}
              disabled={improvingPrompt || !generatePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Logo
            </Button>
          </div>
        </div>
      </div>



      <div>
        <Label htmlFor="size">Image Size: {generateImageSize[0]}x{generateImageSize[0]}</Label>
        <Slider
          id="size"
          min={512}
          max={2048}
          step={256}
          value={generateImageSize}
          onValueChange={(value) => updateGenerateState({ generateImageSize: value })}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="count">Number of Images: {generateImageCount[0]}</Label>
        <Slider
          id="count"
          min={1}
          max={4}
          step={1}
          value={generateImageCount}
          onValueChange={(value) => updateGenerateState({ generateImageCount: value })}
          className="mt-2"
        />
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={loading || !generatePrompt.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>
    </div>
  )
}