'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Combine } from 'lucide-react'
import { toast } from 'sonner'
import { MultiImageInput } from './MultiImageInput'


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
  const [composeImages, setComposeImages] = useState<File[]>([])
  const [composeImagePreviews, setComposeImagePreviews] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [compositionType, setCompositionType] = useState('combine')
  const [style, setStyle] = useState('photorealistic')



  const handleCompose = async () => {
    if (composeImages.length < 2 || !prompt.trim()) {
      toast.error('Please upload at least 2 images and enter description')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      composeImages.forEach(image => {
        formData.append('images', image)
      })
      formData.append('prompt', prompt)
      formData.append('composition_type', compositionType)
      formData.append('style', style)
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
             onChange={setComposeImages}
             previews={composeImagePreviews}
             onPreviewsChange={setComposeImagePreviews}
             maxFiles={3}
           />
        </div>
      </div>

      <div>
        <Label htmlFor="compose-prompt">Composition Description</Label>
        <Textarea
          id="compose-prompt"
          placeholder="Describe how you want the images to be combined..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="composition-type">Composition Type</Label>
        <Select value={compositionType} onValueChange={setCompositionType}>
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
        <Select value={style} onValueChange={setStyle}>
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
        disabled={loading || composeImages.length < 2 || !prompt.trim()}
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