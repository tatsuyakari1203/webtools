'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Download, Image as ImageIcon, Loader2, Maximize2, Eye, Wand2, Undo, Redo, X, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import { Lightbox } from './Lightbox'
import { useNanoBanana } from '../context/NanoBananaContext'


interface ResultDisplayProps {
  image: string | null
  loading: boolean
  setGeneratedImage: (image: string | null) => void
  originalImage?: string | null
}

interface ImageHistoryItem {
  image: string
  prompt: string
  timestamp: number
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  image, 
  loading, 
  setGeneratedImage,
  originalImage
}) => {
  const { state, setConversationId } = useNanoBanana()
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [showRefineInput, setShowRefineInput] = useState(false)
  const [refinePrompt, setRefinePrompt] = useState('')
  const [refineLoading, setRefineLoading] = useState(false)
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [showBeforeAfter, setShowBeforeAfter] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  // No localStorage - images only stored in memory during session



  // Images are only stored in memory - no localStorage persistence
  const handleDownload = async () => {
    if (!image) return

    try {
      let blob: Blob
      
      if (image.startsWith('blob:')) {
        // Handle blob URL
        const response = await fetch(image)
        blob = await response.blob()
      } else if (image.startsWith('data:image')) {
        // Handle base64 data URL
        const response = await fetch(image)
        blob = await response.blob()
      } else {
        toast.error('Invalid image format')
        return
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nano-banana-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Image downloaded successfully!')
    } catch (error) {
      console.error('Error downloading image:', error)
      toast.error('Failed to download image')
    }
  }

  // Add image to history when a new image is generated
  const addToHistory = useCallback((newImage: string, prompt: string) => {
    const newItem: ImageHistoryItem = {
      image: newImage,
      prompt,
      timestamp: Date.now()
    }
    
    setImageHistory(prev => {
      // Remove any history after current index (for branching)
      const newHistory = [...prev.slice(0, currentHistoryIndex + 1), newItem]
      return newHistory
    })
    
    // Update current index to point to the new item
    setCurrentHistoryIndex(currentHistoryIndex + 1)
  }, [currentHistoryIndex])

  // Add current image to history when it changes (for first time generation)
  useEffect(() => {
    if (image && imageHistory.length === 0) {
      // This is the first image, add it to history
      addToHistory(image, 'Initial generation')
    } else if (image && imageHistory.length > 0 && currentHistoryIndex >= 0) {
      // Check if current image is different from the one in history
      const currentHistoryImage = imageHistory[currentHistoryIndex]?.image
      if (currentHistoryImage !== image) {
        // Image changed externally (e.g., from other tabs), add to history
        addToHistory(image, 'Generated image')
      }
    }
  }, [image, imageHistory, currentHistoryIndex, addToHistory])

  // Handle refine functionality
  const handleRefine = async () => {
    if (!image || !refinePrompt.trim()) {
      toast.error('Please enter a refinement instruction')
      return
    }

    setRefineLoading(true)
    
    try {
      const response = await fetch('/api/nano-banana/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: state.conversationId, // Use existing conversation_id for refine
          previous_image_data: image.replace(/^data:image\/[a-z]+;base64,/, ''),
          edit_instruction: refinePrompt,
          style: state.generateStyle || 'photorealistic',
          quality: 'ultra'
        })
      })

      const data = await response.json()
      
      if (data.success && data.image_data) {
         const newImageUrl = `data:image/png;base64,${data.image_data}`
         
         // Update conversation_id if returned (for first refine)
         if (data.conversation_id) {
           setConversationId(data.conversation_id)
         }
         
         // Add current image to refine history if it's not already there
         if (image && (imageHistory.length === 0 || imageHistory[currentHistoryIndex]?.image !== image)) {
           addToHistory(image, 'Previous version')
         }
         
         setGeneratedImage(newImageUrl)
         addToHistory(newImageUrl, refinePrompt)
         

         
         setRefinePrompt('')
         // Keep refine input open for continuous editing
         toast.success('Image refined successfully!')
      } else {
        toast.error(data.error || 'Failed to refine image')
      }
    } catch (error) {
      console.error('Error refining image:', error)
      toast.error('Failed to refine image')
    } finally {
      setRefineLoading(false)
    }
  }

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const prevIndex = currentHistoryIndex - 1
      setCurrentHistoryIndex(prevIndex)
      setGeneratedImage(imageHistory[prevIndex].image)
      toast.success('Undone to previous version')
    }
  }, [currentHistoryIndex, imageHistory, setGeneratedImage])

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < imageHistory.length - 1) {
      const nextIndex = currentHistoryIndex + 1
      setCurrentHistoryIndex(nextIndex)
      setGeneratedImage(imageHistory[nextIndex].image)
      toast.success('Redone to next version')
    }
  }, [currentHistoryIndex, imageHistory, setGeneratedImage])

  const canUndo = currentHistoryIndex > 0
  const canRedo = currentHistoryIndex < imageHistory.length - 1

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z' && canUndo) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'Z' || e.key === 'y') && canRedo) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, handleUndo, handleRedo])

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Generating image...</p>
              </div>
            ) : image ? (
              <div className="space-y-4">
                {showBeforeAfter && imageHistory.length > 0 ? (
                  /* Before/After Overlay Comparison View */
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Before vs After Comparison</h3>
                      <p className="text-sm text-muted-foreground">Toggle between original and refined image</p>
                    </div>
                    
                    {/* Toggle Button */}
                    <div className="flex justify-center mb-4">
                      <Button
                        variant={showOriginal ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOriginal(!showOriginal)}
                        className="transition-all duration-200"
                      >
                        {showOriginal ? "Show Result" : "Show Original"}
                      </Button>
                    </div>
                    
                    {/* Overlay Image Container */}
                    <div className="relative">
                      <div className="relative group">
                        <img
                          src={showOriginal ? (originalImage || (imageHistory.length > 0 ? imageHistory[0].image : image)) : image}
                          alt={showOriginal ? "Original" : "Result"}
                          className="w-full rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                          style={{ maxHeight: '500px', objectFit: 'contain' }}
                          onClick={() => setIsLightboxOpen(true)}
                        />
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 left-4">
                          <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                            showOriginal 
                              ? 'bg-muted text-muted-foreground' 
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {showOriginal ? 'Original' : 'Result'}
                          </span>
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-black shadow-lg"
                            onClick={() => setIsLightboxOpen(true)}
                          >
                            <Maximize2 className="mr-2 h-4 w-4" />
                            View Full
                          </Button>
                        </div>
                      </div>
                      
                      {/* Image Info */}
                      <div className="mt-2 text-center">
                        {showOriginal ? (
                          <div className="text-xs text-muted-foreground truncate">
                            {originalImage ? "User Input" : (imageHistory.length > 0 ? `"${imageHistory[0].prompt}"` : "Original")}
                          </div>
                        ) : (
                          currentHistoryIndex >= 0 && imageHistory[currentHistoryIndex] && (
                            <div className="text-xs text-muted-foreground truncate">
                              "{imageHistory[currentHistoryIndex].prompt}"
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Normal Single Image View */
                  <div className="relative group">
                    <img
                      src={image}
                      alt="Generated result"
                      className="w-full rounded-xl border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                      style={{ maxHeight: '500px', objectFit: 'contain' }}
                      onClick={() => setIsLightboxOpen(true)}
                    />
                    
                    {/* Overlay with view button */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="bg-white/90 hover:bg-white text-black shadow-lg"
                        onClick={() => setIsLightboxOpen(true)}
                      >
                        <Maximize2 className="mr-2 h-5 w-5" />
                        View Full Size
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    disabled={!image}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={() => setIsLightboxOpen(true)}
                    variant="outline"
                    size="sm"
                    disabled={!image}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full
                  </Button>
                  <Button
                    onClick={() => setShowRefineInput(!showRefineInput)}
                    variant={showRefineInput ? "default" : "outline"}
                    size="sm"
                    disabled={!image}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {showRefineInput ? 'Cancel Refine' : 'Refine Image'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowBeforeAfter(!showBeforeAfter)
                      if (showBeforeAfter) setShowOriginal(false)
                    }}
                    variant={showBeforeAfter ? "default" : "outline"}
                    size="sm"
                    disabled={!image || imageHistory.length === 0}
                    title="Toggle comparison view"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {showBeforeAfter ? 'Hide Comparison' : 'Compare'}
                  </Button>
                  <Button
                    onClick={handleUndo}
                    variant="outline"
                    size="sm"
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleRedo}
                    variant="outline"
                    size="sm"
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Refine Input Section */}
                 {showRefineInput && (
                   <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                     <div className="flex items-center justify-between">
                       <h4 className="text-sm font-medium">Refine Image</h4>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setShowRefineInput(false)}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                     
                     {/* History Display */}
                     {imageHistory.length > 0 && (
                       <div className="space-y-2">
                         <h5 className="text-xs font-medium text-muted-foreground">Refine History ({imageHistory.length} versions)</h5>
                         <div className="max-h-48 overflow-y-auto space-y-2">
                           {imageHistory.map((item, index) => (
                             <div 
                               key={index}
                               className={`flex gap-3 p-2 rounded border ${
                                 index === currentHistoryIndex 
                                   ? 'bg-primary/10 border-primary/20' 
                                   : 'bg-background border-border'
                               }`}
                             >
                               {/* Thumbnail */}
                               <div className="flex-shrink-0">
                                 <img
                                   src={item.image}
                                   alt={`Version ${index + 1}`}
                                   className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                   onClick={() => {
                                     setCurrentHistoryIndex(index)
                                     setGeneratedImage(item.image)
                                     toast.success(`Switched to version ${index + 1}`)
                                   }}
                                 />
                               </div>
                               
                               {/* Content */}
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center justify-between">
                                   <div className="font-medium text-xs">Version {index + 1}</div>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     className="h-6 w-6 p-0"
                                     onClick={async () => {
                                       try {
                                         let blob: Blob
                                         
                                         if (item.image.startsWith('blob:')) {
                                           const response = await fetch(item.image)
                                           blob = await response.blob()
                                         } else if (item.image.startsWith('data:image')) {
                                           const response = await fetch(item.image)
                                           blob = await response.blob()
                                         } else {
                                           toast.error('Invalid image format')
                                           return
                                         }
                                         
                                         const url = URL.createObjectURL(blob)
                                         const link = document.createElement('a')
                                         link.href = url
                                         link.download = `nano-banana-v${index + 1}-${Date.now()}.png`
                                         document.body.appendChild(link)
                                         link.click()
                                         document.body.removeChild(link)
                                         URL.revokeObjectURL(url)
                                         
                                         toast.success(`Version ${index + 1} downloaded!`)
                                       } catch (error) {
                                         console.error('Error downloading image:', error)
                                         toast.error('Failed to download image')
                                       }
                                     }}
                                     title={`Download version ${index + 1}`}
                                   >
                                     <Download className="h-3 w-3" />
                                   </Button>
                                 </div>
                                 <div className="text-muted-foreground text-xs truncate">{item.prompt}</div>
                                 <div className="text-muted-foreground text-xs">
                                   {new Date(item.timestamp).toLocaleTimeString()}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                    <div className="space-y-2">
                      <Input
                        placeholder="Describe how you want to modify the image..."
                        value={refinePrompt}
                        onChange={(e) => setRefinePrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleRefine()
                          }
                        }}
                        disabled={refineLoading}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRefine}
                          disabled={!refinePrompt.trim() || refineLoading}
                          size="sm"
                          className="flex-1"
                        >
                          {refineLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Refining...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Apply Refinement
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRefinePrompt('')
                            setShowRefineInput(false)
                          }}
                          size="sm"
                          disabled={refineLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Generated or edited images will be displayed here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Lightbox - Rendered outside of Card for true full screen */}
      {image && (
        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageSrc={image}
          onDownload={handleDownload}
        />
      )}
    </>
  )
}