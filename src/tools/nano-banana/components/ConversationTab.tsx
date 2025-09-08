'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { Loader2, MessageSquare, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useNanoBanana } from '../context/NanoBananaContext'

interface ConversationTabProps {
  loading: boolean
  setLoading: (loading: boolean) => void
  setGeneratedImage: (image: string | null) => void
  currentImage: string | null
}

interface ConversationEntry {
  instruction: string
  result_image: string
}

export const ConversationTab: React.FC<ConversationTabProps> = ({
  loading,
  setLoading,
  setGeneratedImage,
  currentImage
}) => {
  const { state, setConversationId } = useNanoBanana()
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([])
  const [newInstruction, setNewInstruction] = useState('')


  const handleRefine = async () => {
    if (!newInstruction.trim()) {
      toast.error('Please enter refinement instructions')
      return
    }

    if (!currentImage) {
      toast.error('Please generate an image first in another tab')
      return
    }

    setLoading(true)
    try {
      // Convert blob URL to base64 if needed
      let imageData = ''
      if (currentImage.startsWith('blob:')) {
        const response = await fetch(currentImage)
        const blob = await response.blob()
        const reader = new FileReader()
        imageData = await new Promise((resolve) => {
          reader.onload = () => {
            const result = reader.result as string
            // Remove data:image/...;base64, prefix
            resolve(result.split(',')[1] || result)
          }
          reader.readAsDataURL(blob)
        })
      } else if (currentImage.startsWith('data:image')) {
        imageData = currentImage.split(',')[1] || currentImage
      }

      const requestData = {
        prompt: 'Refine this image',
        conversation_id: state.conversationId,
        previous_image_data: imageData,
        edit_instruction: newInstruction,
        quality: 'ultra'
      }

      const response = await fetch('/api/nano-banana/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle JSON response with base64 image data
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Refinement failed')
      }
      
      // Convert base64 to blob URL
      const imageUrl = `data:image/png;base64,${result.image_data}`
      
      // Add to conversation history
      const newEntry: ConversationEntry = {
        instruction: newInstruction,
        result_image: imageUrl
      }
      setConversationHistory(prev => [...prev, newEntry])
      
      setGeneratedImage(imageUrl)
      setNewInstruction('')
      
      // Update conversation ID if returned from API
      if (result.conversation_id) {
        setConversationId(result.conversation_id)
      }
      
      toast.success('Image refined successfully!')
    } catch (error) {
      console.error('Error refining image:', error)
      toast.error('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setConversationHistory([])
    setConversationId(null)
    toast.success('Conversation history cleared')
  }

  return (
    <div className="space-y-4">
      {!currentImage && (
        <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
          Generate an image in another tab first, then come back here to refine it.
        </div>
      )}

      {conversationHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Conversation History</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {conversationHistory.map((entry, index) => (
              <div key={index} className="p-2 bg-muted rounded text-sm">
                <span className="font-medium">Step {index + 1}:</span> {entry.instruction}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="refine-instruction">Refinement Instructions</Label>
        <Textarea
          id="refine-instruction"
          placeholder="Describe how you want to refine the current image..."
          value={newInstruction}
          onChange={(e) => setNewInstruction(e.target.value)}
          rows={4}
          className="mt-1"
        />
      </div>



      <Button 
        onClick={handleRefine} 
        disabled={loading || !newInstruction.trim() || !currentImage}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refining...
          </>
        ) : (
          <>
            <MessageSquare className="mr-2 h-4 w-4" />
            Refine Image
          </>
        )}
      </Button>
    </div>
  )
}