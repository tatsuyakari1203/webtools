'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { ImageInput } from './ImageInput'
import { addToGlobalHistory } from '../utils/globalHistory'

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
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [editInstruction, setEditInstruction] = useState('')
  const [style, setStyle] = useState('photorealistic')

  const handleEdit = async () => {
    if (!image || !editInstruction.trim()) {
      toast.error('Please upload image and enter edit instructions')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('prompt', prompt)
      formData.append('edit_instruction', editInstruction)
      formData.append('style', style)
      formData.append('quality', 'ultra')

      const response = await fetch('/api/nano-banana/edit', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle JSON response with base64 image data
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Edit failed')
      }
      
      // Convert base64 to blob URL
      const imageUrl = `data:image/png;base64,${result.image_data}`
      
      setGeneratedImage(imageUrl)
      
      // Auto cleanup before adding new item
      const { autoCleanupHistory } = await import('../utils/globalHistory')
      autoCleanupHistory()
      
      // Add to global history
      addToGlobalHistory({
        image: imageUrl,
        prompt: editInstruction.trim(),
        type: 'edit'
      })
      
      toast.success('Image edited successfully!')
    } catch (error) {
      console.error('Error editing image:', error)
      toast.error('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-image">Upload Image</Label>
        <div className="mt-1">
          <ImageInput
             label="Upload Image to Edit"
             value={image}
             onChange={setImage}
             preview={imagePreview}
             onPreviewChange={setImagePreview}
           />
        </div>
      </div>

      <div>
        <Label htmlFor="edit-prompt">Image Description (Optional)</Label>
        <Textarea
          id="edit-prompt"
          placeholder="Describe the current image..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="edit-instruction">Edit Instructions</Label>
        <Textarea
          id="edit-instruction"
          placeholder="Describe what changes you want to make..."
          value={editInstruction}
          onChange={(e) => setEditInstruction(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="edit-style">Style</Label>
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
        onClick={handleEdit} 
        disabled={loading || !image || !editInstruction.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Editing...
          </>
        ) : (
          <>
            <Edit className="mr-2 h-4 w-4" />
            Edit Image
          </>
        )}
      </Button>
    </div>
  )
}