'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Wand2, Sparkles, Camera, Palette, Package, Minus, Image as ImageIcon, Type } from 'lucide-react'
import { MultiImageInput } from './MultiImageInput'
import { useNanoBanana } from '../context/NanoBananaContext'
import { toast } from 'sonner'

// Helper function to get operation labels in Vietnamese
function getOperationLabel(operationType: string): string {
  switch (operationType) {
    case 'edit':
      return 'chỉnh sửa'
    case 'compose':
      return 'kết hợp'
    case 'style_transfer':
      return 'chuyển đổi phong cách'
    default:
      return operationType
  }
}

type OperationType = 'edit' | 'compose' | 'style_transfer'

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
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [imageCount, setImageCount] = useState(1)
  const [operationType, setOperationType] = useState<OperationType>('edit')
  const [improvingPrompt, setImprovingPrompt] = useState<string | null>(null)
  const [describingImage, setDescribingImage] = useState(false)
  
  const { setLastGeneratedImages } = useNanoBanana()

  // Smart operation detection based on number of images
  useEffect(() => {
    if (images.length >= 2 && operationType === 'edit') {
      setOperationType('compose')
      toast.info('Tự động chuyển sang chế độ Compose vì có nhiều ảnh')
    } else if (images.length === 1 && operationType === 'compose') {
      setOperationType('edit')
    }
  }, [images.length, operationType])

  const handleDescribeImage = async () => {
    if (images.length === 0) {
      toast.error('Vui lòng upload ảnh trước khi mô tả')
      return
    }

    setDescribingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', images[0])

      const response = await fetch('/api/nano-banana/describe-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.description) {
        // Auto-fill prompt with description
        const description = data.description
        setPrompt(prev => {
          const newPrompt = prev ? `${prev}\n\nMô tả ảnh: ${description}` : `Chỉnh sửa ảnh này: ${description}`
          return newPrompt
        })
        toast.success('Đã mô tả ảnh thành công!')
      } else {
        throw new Error(data.error || 'Không thể mô tả ảnh')
      }
    } catch (error) {
      console.error('Describe image error:', error)
      toast.error('Có lỗi xảy ra khi mô tả ảnh')
    } finally {
      setDescribingImage(false)
    }
  }

  const handleImprovePrompt = async (category: string) => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập prompt trước khi cải thiện')
      return
    }

    setImprovingPrompt(category)
    
    // Import streaming utility dynamically
    const { handleStreamingImprovePrompt } = await import('../utils/streamingApi')
    
    try {
      let accumulatedText = ''
      
      const improvedPrompt = await handleStreamingImprovePrompt(
        prompt,
        category,
        // onChunk callback - update prompt in real-time
        (chunk: string, accumulated: string) => {
          accumulatedText = accumulated
          setPrompt(accumulatedText)
        },
        // onComplete callback
        (finalPrompt: string) => {
          setPrompt(finalPrompt)
          toast.success('Đã cải thiện prompt thành công!')
        },
        // onError callback
        (error: string) => {
          console.error('Streaming error:', error)
          toast.error('Có lỗi xảy ra khi cải thiện prompt')
        }
      )
      
    } catch (error) {
      console.error('Improve prompt error:', error)
      toast.error('Có lỗi xảy ra khi cải thiện prompt')
    } finally {
      setImprovingPrompt(null)
    }
  }

  const handleGenerate = async () => {
    if (images.length === 0) {
      toast.error('Vui lòng upload ít nhất một ảnh')
      return
    }
    
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả cho ảnh')
      return
    }

    // Validate operation requirements
    if (operationType === 'compose' && images.length < 2) {
      toast.error('Chế độ Compose cần ít nhất 2 ảnh')
      return
    }

    if (operationType === 'style_transfer' && images.length < 2) {
      toast.error('Chế độ Style Transfer cần ít nhất 2 ảnh')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('instruction', prompt.trim())
      formData.append('operationType', operationType)
      formData.append('numImages', imageCount.toString())
      
      // Add all images to formData
      images.forEach((image, index) => {
        formData.append(`image${index === 0 ? '' : index}`, image)
      })
      
      console.log('Sending request with:', {
        imageCount: images.length,
        prompt,
        operationType,
        generateCount: imageCount
      })
      
      const response = await fetch('/api/nano-banana/edit', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }
      
      const data = await response.json()
      console.log('Edit response:', data)
      
      if (data.success) {
        // Handle both single image and multiple images response
        const images = Array.isArray(data.imageData) ? data.imageData : [data.imageData]
        
        if (images && images.length > 0) {
          // Convert base64 to blob URLs for display
          const imageUrls = images.map((base64: string) => {
            const byteCharacters = atob(base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/png' })
            return URL.createObjectURL(blob)
          })
          
          // Set multiple images for the gallery
          setLastGeneratedImages(imageUrls)
          
          // Set the first image for backward compatibility
          setGeneratedImage(imageUrls[0])
          
          toast.success(`Đã ${getOperationLabel(operationType)} thành công ${imageUrls.length} ảnh!`)
        } else {
          throw new Error('Không nhận được ảnh từ server')
        }
      } else {
        throw new Error(data.error || 'Không thể xử lý ảnh')
      }
    } catch (error) {
      console.error('Edit error:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xử lý ảnh')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Chỉnh sửa ảnh với AI
          </CardTitle>
          <CardDescription>
            Upload ảnh và mô tả những thay đổi bạn muốn thực hiện
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Images */}
          <div className="space-y-2">
            <MultiImageInput
              label="Ảnh đầu vào"
              values={images}
              onChange={setImages}
              previews={imagePreviews}
              onPreviewsChange={setImagePreviews}
              maxFiles={4}
              accept="image/*"
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Mô tả thay đổi</Label>
            <Textarea
              id="prompt"
              placeholder="Mô tả những thay đổi bạn muốn thực hiện với ảnh..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Enhance Prompt Buttons */}
          <div className="space-y-2">
            <Label>Cải thiện prompt</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('photorealistic')}
                disabled={loading || improvingPrompt === 'photorealistic' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'photorealistic' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Camera className="h-3 w-3 mr-1" />
                )}
                Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('artistic')}
                disabled={loading || improvingPrompt === 'artistic' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'artistic' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Palette className="h-3 w-3 mr-1" />
                )}
                Artistic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('product')}
                disabled={loading || improvingPrompt === 'product' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'product' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Package className="h-3 w-3 mr-1" />
                )}
                Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('minimalist')}
                disabled={loading || improvingPrompt === 'minimalist' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'minimalist' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Minus className="h-3 w-3 mr-1" />
                )}
                Minimal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('illustration')}
                disabled={loading || improvingPrompt === 'illustration' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'illustration' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <ImageIcon className="h-3 w-3 mr-1" />
                )}
                Illustration
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('logo')}
                disabled={loading || improvingPrompt === 'logo' || !prompt.trim()}
                className="text-xs"
              >
                {improvingPrompt === 'logo' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Type className="h-3 w-3 mr-1" />
                )}
                Logo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleImprovePrompt('edit')}
                disabled={loading || improvingPrompt === 'edit' || !prompt.trim()}
                className="text-xs col-span-2"
              >
                {improvingPrompt === 'edit' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Edit
              </Button>
            </div>
          </div>

          {/* Image Count Setting */}
          <div className="space-y-2">
            <Label htmlFor="image-count">Số lượng ảnh tạo ra</Label>
            <Input
              id="image-count"
              type="number"
              min="1"
              max="4"
              value={imageCount}
              onChange={(e) => setImageCount(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Tạo 1-4 ảnh cùng lúc. Nhiều ảnh hơn sẽ mất thời gian xử lý lâu hơn.
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || images.length === 0 || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang tạo ảnh...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Tạo ảnh ({imageCount})
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}