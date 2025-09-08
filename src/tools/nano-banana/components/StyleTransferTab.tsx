'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2, Palette, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { ImageInput } from './ImageInput'
import { useNanoBanana } from '../context/NanoBananaContext'


interface StyleTransferTabProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  setGeneratedImage: (image: string | null) => void
}

export const StyleTransferTab: React.FC<StyleTransferTabProps> = ({
  loading,
  setLoading,
  setGeneratedImage
}) => {
  const { state, updateStyleState, startNewSession, setLastGeneratedImage } = useNanoBanana()
  const {
    styleContentImage,
    styleStyleImage,
    styleContentImagePreview,
    styleStyleImagePreview,
    stylePrompt,
    styleStrength
  } = state
  
  const [improvingPrompt, setImprovingPrompt] = React.useState(false)

  const handleImprovePrompt = async (category: string) => {
    if (!stylePrompt.trim()) {
      toast.error('Please enter a style description first')
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
          prompt: stylePrompt,
          category: category
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to improve prompt')
      }
      
      updateStyleState({ stylePrompt: result.improved_prompt })
      toast.success(`Prompt improved for ${category} style!`)
    } catch (error) {
      console.error('Error improving prompt:', error)
      toast.error('Failed to improve prompt')
    } finally {
      setImprovingPrompt(false)
    }
  }

  const handleStyleTransfer = async () => {
    if (!styleContentImage || !styleStyleImage || !stylePrompt.trim()) {
      toast.error('Please upload both images and enter description')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('content_image', styleContentImage)
      formData.append('style_image', styleStyleImage)
      formData.append('prompt', stylePrompt)
      formData.append('intensity', styleStrength[0].toString())
      formData.append('quality', 'ultra')

      const response = await fetch('/api/nano-banana/style-transfer', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle JSON response with base64 image data
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Style transfer failed')
      }
      
      // Convert base64 to blob URL
      const imageUrl = `data:image/png;base64,${result.image_data}`
      
      // Start new session for each style transfer
      startNewSession()
      setLastGeneratedImage(imageUrl)
      setGeneratedImage(imageUrl)
      
      toast.success('Style transfer completed successfully!')
    } catch (error) {
      console.error('Error in style transfer:', error)
      toast.error('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Content Image */}
        <div>
          <ImageInput
             label="Content Image"
             value={styleContentImage}
             onChange={(file) => updateStyleState({ styleContentImage: file })}
             preview={styleContentImagePreview}
             onPreviewChange={(preview) => updateStyleState({ styleContentImagePreview: preview || '' })}
           />
        </div>

        {/* Style Image */}
        <div>
          <ImageInput
             label="Style Reference Image"
             value={styleStyleImage}
             onChange={(file) => updateStyleState({ styleStyleImage: file })}
             preview={styleStyleImagePreview}
             onPreviewChange={(preview) => updateStyleState({ styleStyleImagePreview: preview || '' })}
           />
        </div>
      </div>

      <div>
        <Label htmlFor="style-prompt">Style Transfer Description</Label>
        <Textarea
          id="style-prompt"
          placeholder="Describe how you want the style to be applied..."
          value={stylePrompt}
          onChange={(e) => updateStyleState({ stylePrompt: e.target.value })}
          rows={3}
          className="mt-1"
        />
        
        {/* Improve Style Prompt Buttons */}
        <div className="mt-3">
          <Label className="text-sm text-muted-foreground mb-2 block">Improve style description for specific styles:</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('photorealistic')}
              disabled={improvingPrompt || !stylePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('artistic')}
              disabled={improvingPrompt || !stylePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Artistic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('product')}
              disabled={improvingPrompt || !stylePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('minimalist')}
              disabled={improvingPrompt || !stylePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Minimal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('illustration')}
              disabled={improvingPrompt || !stylePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Illustration
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImprovePrompt('logo')}
              disabled={improvingPrompt || !stylePrompt.trim()}
              className="text-xs"
            >
              {improvingPrompt ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Logo
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="intensity">Style Intensity: {Math.round(styleStrength[0] * 100)}%</Label>
        <Slider
          id="intensity"
          min={0.1}
          max={1.0}
          step={0.1}
          value={styleStrength}
          onValueChange={(value) => updateStyleState({ styleStrength: value })}
          className="mt-2"
        />
      </div>

      <Button 
        onClick={handleStyleTransfer} 
        disabled={loading || !styleContentImage || !styleStyleImage || !stylePrompt.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Transferring Style...
          </>
        ) : (
          <>
            <Palette className="mr-2 h-4 w-4" />
            Transfer Style
          </>
        )}
      </Button>
    </div>
  )
}