'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Image as ImageIcon, Plus, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

interface MultiImageInputProps {
  label: string
  values: File[]
  onChange: (files: File[]) => void
  previews: string[]
  onPreviewsChange: (previews: string[]) => void
  maxFiles?: number
  accept?: string
  className?: string
}

// Utility function to compress image without resizing
const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Keep original dimensions
      const { width, height } = img
      
      canvas.width = width
      canvas.height = height
      
      // Draw at original size and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.src = URL.createObjectURL(file)
  })
}



export const MultiImageInput: React.FC<MultiImageInputProps> = ({
  label,
  values,
  onChange,
  previews,
  onPreviewsChange,
  maxFiles = 3,
  accept = 'image/*',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files')
      return
    }

    if (values.length + imageFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }

    setIsProcessing(true)
    try {
      const processedFiles: File[] = []
      const newPreviews: string[] = []
      
      for (const file of imageFiles) {
        const compressedFile = await compressImage(file)
        const previewUrl = URL.createObjectURL(compressedFile)
        
        processedFiles.push(compressedFile)
        newPreviews.push(previewUrl)
      }
      
      onChange([...values, ...processedFiles])
      onPreviewsChange([...previews, ...newPreviews])
      
      toast.success(`Added ${processedFiles.length} image(s)`)
    } catch (error) {
      console.error('Error processing images:', error)
      toast.error('Error processing images')
    } finally {
      setIsProcessing(false)
    }
  }, [values, previews, onChange, onPreviewsChange, maxFiles])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    await processFiles(files)
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    await handleFileSelect(files)
  }, [handleFileSelect])

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileSelect(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFileSelect])

  const handleRemove = useCallback((index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previews[index])
    
    onChange(newValues)
    onPreviewsChange(newPreviews)
  }, [values, previews, onChange, onPreviewsChange])

  const handleClick = useCallback(() => {
    if (values.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }
    fileInputRef.current?.click()
  }, [values.length, maxFiles])

  const handlePasteFromClipboard = useCallback(async () => {
    if (values.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }

    try {
      const clipboardItems = await navigator.clipboard.read()
      const imageItems = clipboardItems.filter(item => 
        item.types.some(type => type.startsWith('image/'))
      )

      if (imageItems.length === 0) {
        toast.error('No images found in clipboard')
        return
      }

      setIsProcessing(true)
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const item of imageItems) {
        const imageType = item.types.find(type => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], `clipboard-image-${Date.now()}.png`, {
            type: imageType,
            lastModified: Date.now()
          })

          const compressedFile = await compressImage(file)
          const previewUrl = URL.createObjectURL(compressedFile)
          
          processedFiles.push(compressedFile)
          newPreviews.push(previewUrl)
        }
      }

      if (processedFiles.length > 0) {
        onChange([...values, ...processedFiles])
        onPreviewsChange([...previews, ...newPreviews])
        toast.success(`Pasted ${processedFiles.length} image(s) from clipboard`)
      }
    } catch (error) {
      console.error('Error pasting from clipboard:', error)
      toast.error('Failed to paste from clipboard. Make sure you have copied an image.')
    } finally {
      setIsProcessing(false)
    }
  }, [values, previews, onChange, onPreviewsChange, maxFiles])

  // Handle keyboard paste
  useEffect(() => {
    const handleKeyboardPaste = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        await handlePasteFromClipboard()
      }
    }

    document.addEventListener('keydown', handleKeyboardPaste)
    return () => document.removeEventListener('keydown', handleKeyboardPaste)
  }, [handlePasteFromClipboard])

  const canAddMore = values.length < maxFiles

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>{label} ({values.length}/{maxFiles})</Label>
        {canAddMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePasteFromClipboard}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            <Clipboard className="h-4 w-4" />
            Paste from Clipboard
          </Button>
        )}
      </div>
      
      {/* Image previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="relative overflow-hidden rounded-lg border-2 border-border shadow-lg bg-background transition-transform hover:scale-[1.02]">
                 <img
                   src={preview}
                   alt={`Preview ${index + 1}`}
                   className="w-full h-40 object-cover"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
               </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-sm px-2 py-1 rounded-md font-medium">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {previews.length > 0 ? (
                <Plus className="h-8 w-8 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isProcessing 
                  ? 'Processing images...' 
                  : previews.length > 0 
                    ? 'Add more images' 
                    : 'Drop images here, click to browse, or paste from clipboard'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {previews.length > 0 
                  ? `You can add ${maxFiles - values.length} more image(s). Use Ctrl+V to paste from clipboard.` 
                  : `Select up to ${maxFiles} images. Supports JPG, PNG, GIF, WebP. Use Ctrl+V to paste from clipboard. Images will be compressed while maintaining original dimensions.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      {values.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          {values.map((file, index) => (
            <div key={index}>
              {index + 1}. {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MultiImageInput