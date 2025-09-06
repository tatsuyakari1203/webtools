'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Combine } from 'lucide-react'
import { toast } from 'sonner'
import { MultiImageInput } from './MultiImageInput'
import { useNanoBanana } from '../context/NanoBananaContext'


interface ComposeTabProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  setGeneratedImage: (image: string | null) => void
}

export const ComposeTab: React.FC<ComposeTabProps> = ({
  loading,
  setLoading,
  setGeneratedImage
}) => {
  const { state, updateComposeState, startNewSession, setLastGeneratedImage } = useNanoBanana()
  const {
    composeImages,
    composeImagePreviews,
    composePrompt,
    composeCompositionType,
    composeStyle
  } = state



  const handleCompose = async () => {
    if (composeImages.length < 2 || !composePrompt.trim()) {
      toast.error('Please upload at least 2 images and enter description')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      composeImages.forEach(image => {
        formData.append('images', image)
      })
      formData.append('prompt', composePrompt)
      formData.append('composition_type', composeCompositionType)
      formData.append('style', composeStyle)
      formData.append('quality', 'ultra')

      const response = await fetch('/api/nano-banana/compose', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle JSON response with base64 image data
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Composition failed')
      }
      
      // Convert base64 to blob URL
      const imageUrl = `data:image/png;base64,${result.image_data}`
      
      // Start new session for each compose
      startNewSession()
      setLastGeneratedImage(imageUrl)
      setGeneratedImage(imageUrl)
      
      toast.success('Images composed successfully!')
    } catch (error) {
      console.error('Error composing images:', error)
      toast.error('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Upload Images (2-3 images)</Label>
        <div className="mt-1">
          <MultiImageInput
             label="Upload Images (2-3 images)"
             values={composeImages}
             onChange={(files) => updateComposeState({ composeImages: files })}
             previews={composeImagePreviews}
             onPreviewsChange={(previews) => updateComposeState({ composeImagePreviews: previews })}
             maxFiles={3}
           />
        </div>
      </div>

      <div>
        <Label htmlFor="compose-prompt">Composition Description</Label>
        <Textarea
          id="compose-prompt"
          placeholder="Describe how you want the images to be combined..."
          value={composePrompt}
          onChange={(e) => updateComposeState({ composePrompt: e.target.value })}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="composition-type">Composition Type</Label>
        <Select value={composeCompositionType} onValueChange={(value) => updateComposeState({ composeCompositionType: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select composition type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="collage">Collage</SelectItem>
            <SelectItem value="blend">Blend</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
            <SelectItem value="combine">Combine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="compose-style">Style</Label>
        <Select value={composeStyle} onValueChange={(value) => updateComposeState({ composeStyle: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="photorealistic">Photorealistic</SelectItem>
            <SelectItem value="artistic">Artistic</SelectItem>
            <SelectItem value="cartoon">Cartoon</SelectItem>
            <SelectItem value="anime">Anime</SelectItem>
            <SelectItem value="abstract">Abstract</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handleCompose} 
        disabled={loading || composeImages.length < 2 || !composePrompt.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Composing...
          </>
        ) : (
          <>
            <Combine className="mr-2 h-4 w-4" />
            Compose Images
          </>
        )}
      </Button>
    </div>
  )
}