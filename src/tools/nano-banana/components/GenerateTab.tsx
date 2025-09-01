'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { addToGlobalHistory } from '../utils/globalHistory'

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
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('photorealistic')
  const [imageSize, setImageSize] = useState([1024])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter image description')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        prompt,
        width: imageSize[0],
        height: imageSize[0],
        style,
        quality: 'ultra'
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
        const imageUrl = `data:image/png;base64,${data.image_data}`
        setGeneratedImage(imageUrl)
        
        // Add to global history
        addToGlobalHistory({
          image: imageUrl,
          prompt: prompt.trim(),
          type: 'generate'
        })
        
        toast.success('Image generated successfully!')
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt">Image Description</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="style">Style</Label>
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

      <div>
        <Label htmlFor="size">Image Size: {imageSize[0]}x{imageSize[0]}</Label>
        <Slider
          id="size"
          min={512}
          max={2048}
          step={256}
          value={imageSize}
          onValueChange={setImageSize}
          className="mt-2"
        />
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={loading || !prompt.trim()}
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