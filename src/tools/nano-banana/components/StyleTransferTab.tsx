'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { ImageInput } from './ImageInput'

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
  const [contentImage, setContentImage] = useState<File | null>(null)
  const [styleImage, setStyleImage] = useState<File | null>(null)
  const [contentImagePreview, setContentImagePreview] = useState<string>('')
  const [styleImagePreview, setStyleImagePreview] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [styleStrength, setStyleStrength] = useState([0.7])



  const handleStyleTransfer = async () => {
    if (!contentImage || !styleImage || !prompt.trim()) {
      toast.error('Please upload both images and enter description')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('content_image', contentImage)
      formData.append('style_image', styleImage)
      formData.append('prompt', prompt)
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
             value={contentImage}
             onChange={setContentImage}
             preview={contentImagePreview}
             onPreviewChange={(preview) => setContentImagePreview(preview || '')}
           />
        </div>

        {/* Style Image */}
        <div>
          <ImageInput
             label="Style Reference Image"
             value={styleImage}
             onChange={setStyleImage}
             preview={styleImagePreview}
             onPreviewChange={(preview) => setStyleImagePreview(preview || '')}
           />
        </div>
      </div>

      <div>
        <Label htmlFor="style-prompt">Style Transfer Description</Label>
        <Textarea
          id="style-prompt"
          placeholder="Describe how you want the style to be applied..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="intensity">Style Intensity: {Math.round(styleStrength[0] * 100)}%</Label>
        <Slider
          id="intensity"
          min={0.1}
          max={1.0}
          step={0.1}
          value={styleStrength}
          onValueChange={setStyleStrength}
          className="mt-2"
        />
      </div>

      <Button 
        onClick={handleStyleTransfer} 
        disabled={loading || !contentImage || !styleImage || !prompt.trim()}
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