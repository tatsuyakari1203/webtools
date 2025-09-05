'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageInputProps {
  label: string
  value: File | null
  onChange: (file: File | null) => void
  preview?: string | null
  onPreviewChange?: (preview: string | null) => void
  accept?: string
  className?: string
  multiple?: boolean

}

// Utility function to resize image
const resizeImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(resizedFile)
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

export const ImageInput: React.FC<ImageInputProps> = ({
  label,
  value,
  onChange,
  preview,
  onPreviewChange,
  accept = 'image/*',
  className = '',
  multiple = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return null
    }

    setIsProcessing(true)
    try {
      // Resize image before processing
      const resizedFile = await resizeImage(file)
      
      // Create preview
      const previewUrl = URL.createObjectURL(resizedFile)
      onPreviewChange?.(previewUrl)
      
      return resizedFile
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Error processing image')
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [onPreviewChange])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const processedFile = await processFile(file)
    
    if (processedFile) {
      onChange(processedFile)
    }
  }, [onChange, processFile])

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
  }, [handleFileSelect])

  const handleRemove = useCallback(() => {
    onChange(null)
    onPreviewChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onChange, onPreviewChange])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
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
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
        
        {preview ? (
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg border-2 border-border shadow-lg bg-background">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-3 right-3 h-8 w-8 p-0 shadow-lg hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isProcessing ? 'Processing image...' : 'Drop image here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, GIF, WebP. Images will be automatically resized for optimal processing.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {value && (
        <div className="text-xs text-muted-foreground">
          Selected: {value.name} ({(value.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
    </div>
  )
}

export default ImageInput