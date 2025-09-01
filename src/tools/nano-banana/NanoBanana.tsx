'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Upload, Wand2, Combine, Palette, Image as ImageIcon, X, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface GenerateRequest {
  prompt: string
  width?: number
  height?: number
  style?: string
  quality?: string
}

interface EditRequest {
  prompt: string
  edit_instruction: string
  style?: string
  quality?: string
}

interface ComposeRequest {
  prompt: string
  composition_type?: string
  style?: string
  quality?: string
}

interface StyleTransferRequest {
  content_image: File
  style_image: File
  intensity?: number
  style?: string
  quality?: string
}

interface ConversationRequest {
  image: File
  conversation_history: Array<{
    instruction: string
    result_image?: string
  }>
  new_instruction: string
  style?: string
  quality?: string
}

interface ApiResponse {
  success: boolean
  image_data?: string
  message?: string
  error?: string
}

const NanoBanana: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  
  // Generate tab states
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generateStyle, setGenerateStyle] = useState('photorealistic')

  const [imageSize, setImageSize] = useState([1024])
  
  // Edit tab states
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editInstruction, setEditInstruction] = useState('')
  const [editStyle, setEditStyle] = useState('photorealistic')

  
  // Compose tab states
  const [composeImages, setComposeImages] = useState<File[]>([])
  const [composeImagePreviews, setComposeImagePreviews] = useState<string[]>([])
  const [composePrompt, setComposePrompt] = useState('')
  const [composeType, setComposeType] = useState('collage')
  const [composeStyle, setComposeStyle] = useState('photorealistic')

  
  // Style Transfer tab states
  const [styleContentImage, setStyleContentImage] = useState<File | null>(null)
  const [styleContentPreview, setStyleContentPreview] = useState<string | null>(null)
  const [styleStyleImage, setStyleStyleImage] = useState<File | null>(null)
  const [styleStylePreview, setStyleStylePreview] = useState<string | null>(null)
  const [styleIntensity, setStyleIntensity] = useState([0.7])
  const [styleTransferStyle, setStyleTransferStyle] = useState('artistic')

  
  // Conversation states
  const [conversationHistory, setConversationHistory] = useState<Array<{
    instruction: string
    result_image: string
  }>>([])
  const [refineInstruction, setRefineInstruction] = useState('')
  const [showRefineDialog, setShowRefineDialog] = useState(false)
  
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const composeFileInputRef = useRef<HTMLInputElement>(null)

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) {
      toast.error('Please enter image description')
      return
    }

    setLoading(true)
    try {
      const requestData: GenerateRequest = {
        prompt: generatePrompt,
        width: imageSize[0],
        height: imageSize[0],
        style: generateStyle,
        quality: 'ultra'
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result: ApiResponse = await response.json()
      
      if (result.success && result.image_data) {
        setGeneratedImage(`data:image/png;base64,${result.image_data}`)
        toast.success('Image generated successfully!')
      } else {
        toast.error(result.error || 'Error occurred while generating image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editImage || !editInstruction.trim()) {
      toast.error('Please upload image and enter edit instructions')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', editImage)
      formData.append('prompt', editPrompt)
      formData.append('edit_instruction', editInstruction)
      
      formData.append('style', editStyle)
      formData.append('quality', 'ultra')

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/edit`, {
        method: 'POST',
        body: formData
      })

      const result: ApiResponse = await response.json()
      
      if (result.success && result.image_data) {
        setGeneratedImage(`data:image/png;base64,${result.image_data}`)
        toast.success('Image edited successfully!')
      } else {
        // Handle specific AI refusal cases
        if (result.error === 'AI_REFUSAL') {
          toast.error('AI cannot edit this image. Try using the Generate tab to create a new image with your description instead.', {
            duration: 5000
          })
        } else {
          const errorMessage = result.error || 'Error occurred while editing image'
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error editing image:', error)
      toast.error('Không thể kết nối đến server')
    } finally {
      setLoading(false)
    }
  }

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
      formData.append('composition_type', composeType)
      
      formData.append('style', composeStyle)
      formData.append('quality', 'ultra')

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/compose`, {
        method: 'POST',
        body: formData
      })

      const result: ApiResponse = await response.json()
      
      if (result.success && result.image_data) {
        setGeneratedImage(`data:image/png;base64,${result.image_data}`)
        toast.success('Images composed successfully!')
      } else {
        toast.error(result.error || 'Error occurred while composing images')
      }
    } catch (error) {
      console.error('Error composing images:', error)
      toast.error('Không thể kết nối đến server')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return
    
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `nano-banana-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleEditFileChange = async (file: File) => {
    try {
      // Show loading state
      toast.loading('Processing image...', { id: 'compress' })
      
      // Compress image if it's too large
      const processedFile = file.size > 2 * 1024 * 1024 ? await compressImage(file) : file
      
      setEditImage(processedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(processedFile)
      
      toast.success('Image processed successfully!', { id: 'compress' })
    } catch (error) {
      toast.error('Failed to process image', { id: 'compress' })
    }
  }

  const removeEditImage = () => {
    setEditImage(null)
    setEditImagePreview(null)
  }

  const handleComposeFileChange = async (files: File[]) => {
    // Check if adding new files would exceed the limit
    if (composeImages.length + files.length > 3) {
      toast.error(`Maximum 3 images allowed. You can add ${3 - composeImages.length} more image(s).`)
      return
    }
    
    try {
      toast.loading('Processing images...', { id: 'compress-compose' })
      
      // Process new files
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          return file.size > 2 * 1024 * 1024 ? await compressImage(file) : file
        })
      )
      
      // Add to existing images instead of replacing
      const updatedImages = [...composeImages, ...processedFiles]
      setComposeImages(updatedImages)
      
      // Create previews for new files and add to existing previews
      const newPreviews: string[] = []
      let loadedCount = 0
      
      processedFiles.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews[index] = e.target?.result as string
          loadedCount++
          
          if (loadedCount === processedFiles.length) {
            setComposeImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })
      
      toast.success('Images processed successfully!', { id: 'compress-compose' })
    } catch (error) {
      toast.error('Failed to process images', { id: 'compress-compose' })
    }
  }

  const removeComposeImage = (index: number) => {
    const newImages = composeImages.filter((_, i) => i !== index)
    const newPreviews = composeImagePreviews.filter((_, i) => i !== index)
    setComposeImages(newImages)
    setComposeImagePreviews(newPreviews)
  }

  const clearAllComposeImages = () => {
    setComposeImages([])
    setComposeImagePreviews([])
    toast.success('Đã xóa toàn bộ ảnh')
  }

  // Style Transfer handlers
  const handleStyleContentFileChange = async (file: File) => {
    try {
      toast.loading('Processing content image...', { id: 'compress-content' })
      const processedFile = file.size > 2 * 1024 * 1024 ? await compressImage(file) : file
      
      setStyleContentImage(processedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setStyleContentPreview(e.target?.result as string)
      }
      reader.readAsDataURL(processedFile)
      
      toast.success('Content image processed successfully!', { id: 'compress-content' })
    } catch (error) {
      toast.error('Failed to process content image', { id: 'compress-content' })
    }
  }

  const handleStyleStyleFileChange = async (file: File) => {
    try {
      toast.loading('Processing style image...', { id: 'compress-style' })
      const processedFile = file.size > 2 * 1024 * 1024 ? await compressImage(file) : file
      
      setStyleStyleImage(processedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setStyleStylePreview(e.target?.result as string)
      }
      reader.readAsDataURL(processedFile)
      
      toast.success('Style image processed successfully!', { id: 'compress-style' })
    } catch (error) {
      toast.error('Failed to process style image', { id: 'compress-style' })
    }
  }

  const removeStyleContentImage = () => {
    setStyleContentImage(null)
    setStyleContentPreview(null)
  }

  const removeStyleStyleImage = () => {
    setStyleStyleImage(null)
    setStyleStylePreview(null)
  }

  const handleStyleTransfer = async () => {
    if (!styleContentImage || !styleStyleImage) {
      toast.error('Please upload both content and style images')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('content_image', styleContentImage)
      formData.append('style_image', styleStyleImage)
      // Create a more detailed prompt based on selected style
      let stylePrompt = 'Transfer the style from the style image to the content image'
      if (styleTransferStyle === 'anime') {
         stylePrompt = 'Transform the ENTIRE content image into Japanese anime/manga art style using the style reference image. Convert the complete scene including background, foreground, objects, and characters into anime style with large expressive eyes, vibrant colors, clean line art, cel-shaded appearance, and characteristic anime facial features and proportions.'
       } else if (styleTransferStyle === 'photorealistic') {
         stylePrompt = 'Transform the ENTIRE content image to photorealistic style using the style reference image. Apply natural lighting and realistic textures to all elements including background and foreground.'
       } else if (styleTransferStyle === 'artistic') {
         stylePrompt = 'Transform the ENTIRE content image with artistic painterly style using the style reference image. Apply creative interpretation and artistic flair to all elements including background, objects, and lighting.'
       }
      formData.append('prompt', stylePrompt)
      formData.append('intensity', styleIntensity[0].toString())
      formData.append('style', styleTransferStyle)
      formData.append('quality', 'ultra')

      const response = await fetch('http://localhost:8000/api/style-transfer', {
        method: 'POST',
        body: formData
      })

      const result: ApiResponse = await response.json()
      
      if (result.success && result.image_data) {
        setGeneratedImage(`data:image/png;base64,${result.image_data}`)
        toast.success('Style transfer completed successfully!')
      } else {
        toast.error(result.error || 'Style transfer failed')
      }
    } catch (error) {
      console.error('Style transfer error:', error)
      toast.error('Error occurred while transferring style')
    } finally {
      setLoading(false)
    }
  }

  // Handle conversation refinement
  const handleRefineImage = async () => {
    if (!generatedImage || !refineInstruction.trim()) {
      toast.error('Please provide a refinement instruction')
      return
    }

    setLoading(true)
    try {
      // Extract base64 data from data URL
      const base64Data = generatedImage.split(',')[1]

      const requestData = {
        prompt: generatePrompt || 'Image refinement',
        conversation_id: `conv_${Date.now()}`,
        previous_image_data: base64Data,
        edit_instruction: refineInstruction,
        style: editStyle,
        quality: 'ultra'
      }

      const apiResponse = await fetch('http://localhost:8000/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result: ApiResponse = await apiResponse.json()
      
      if (result.success && result.image_data) {
        // Add to conversation history
        setConversationHistory(prev => [
          ...prev,
          {
            instruction: refineInstruction,
            result_image: generatedImage
          }
        ])
        
        setGeneratedImage(`data:image/png;base64,${result.image_data}`)
        setRefineInstruction('')
        toast.success('Image refined successfully!')
      } else {
        toast.error(result.error || 'Refinement failed')
      }
    } catch (error) {
      console.error('Refinement error:', error)
      toast.error('Error occurred while refining image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Panel */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Combine className="w-4 h-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="style-transfer" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Style
              </TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Generate image from text
                  </CardTitle>
                  <CardDescription>
                    Describe the image you want to create with text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="generate-prompt">Image description</Label>
                    <Textarea
                      id="generate-prompt"
                      placeholder="Example: A cute cat sitting on a window, anime style"
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="generate-style">Style</Label>
                    <Select value={generateStyle} onValueChange={setGenerateStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                        <SelectItem value="cartoon">Cartoon</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="artistic">Artistic</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Size: {imageSize[0]}x{imageSize[0]}px</Label>
                    <Slider
                      value={imageSize}
                      onValueChange={setImageSize}
                      max={2048}
                      min={512}
                      step={256}
                      className="mt-2"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !generatePrompt.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Edit image
                  </CardTitle>
                  <CardDescription>
                    Upload an image and describe how to edit it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select image</Label>
                    <DropZone
                      onFilesChange={(files) => files[0] && handleEditFileChange(files[0])}
                      accept="image/*"
                      multiple={false}
                      className="mt-2"
                    >
                      {editImagePreview ? (
                        <div className="relative">
                          <div className="relative w-full h-64 overflow-hidden rounded-lg">
                            <img
                              src={editImagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeEditImage}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            {editImage?.name}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                           <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground">
                             Drag and drop an image here, or click to select
                           </p>
                           <p className="text-xs text-muted-foreground mt-1">
                             Large images will be automatically compressed
                           </p>
                         </div>
                      )}
                    </DropZone>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-prompt">Current image description <span className="text-sm text-muted-foreground">(optional)</span></Label>
                    <Textarea
                      id="edit-prompt"
                      placeholder="Example: A landscape photo of mountains (helps AI understand the image better)"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-instruction">Edit instructions</Label>
                    <Textarea
                      id="edit-instruction"
                      placeholder="Example: Add a rainbow in the sky"
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-style">Style</Label>
                    <Select value={editStyle} onValueChange={setEditStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                        <SelectItem value="cartoon">Cartoon</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="artistic">Artistic</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleEdit} 
                    disabled={loading || !editImage || !editInstruction.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Palette className="w-4 h-4 mr-2" />
                        Edit Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compose Tab */}
            <TabsContent value="compose" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Combine className="w-5 h-5" />
                    Compose multiple images
                  </CardTitle>
                  <CardDescription>
                    Upload 2-3 images to compose into one
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Select images (2-3 files)</Label>
                      {composeImages.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllComposeImages}
                          className="h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <DropZone
                      onFilesChange={handleComposeFileChange}
                      accept="image/*"
                      multiple={true}
                      maxFiles={3}
                      className="mt-2"
                    >
                      {composeImagePreviews.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {composeImagePreviews.map((preview, index) => (
                              <div key={index} className="relative">
                                <div className="relative w-full h-48 overflow-hidden rounded-lg">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeComposeImage(index)}
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {composeImages[index]?.name}
                                </p>
                              </div>
                            ))}
                          </div>
                          {composeImages.length < 3 && (
                            <p className="text-sm text-muted-foreground text-center">
                              Drag more images here or click to add more (max 3)
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                           <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground">
                             Drag and drop 2-3 images here, or click to select
                           </p>
                           <p className="text-xs text-muted-foreground mt-1">
                             Large images will be automatically compressed
                           </p>
                         </div>
                      )}
                    </DropZone>
                  </div>
                  
                  <div>
                    <Label htmlFor="compose-prompt">Composition description</Label>
                    <Textarea
                      id="compose-prompt"
                      placeholder="Example: Combine the images into an artistic painting"
                      value={composePrompt}
                      onChange={(e) => setComposePrompt(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="compose-type">Composition type</Label>
                      <Select value={composeType} onValueChange={setComposeType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="combine">Combine</SelectItem>
                          <SelectItem value="blend">Blend</SelectItem>
                          <SelectItem value="collage">Collage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="compose-style">Style</Label>
                      <Select value={composeStyle} onValueChange={setComposeStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="photorealistic">Photorealistic</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                          <SelectItem value="abstract">Abstract</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCompose} 
                    disabled={loading || composeImages.length < 2 || !composePrompt.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Composing...
                      </>
                    ) : (
                      <>
                        <Combine className="w-4 h-4 mr-2" />
                        Compose Images
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Style Transfer Tab */}
            <TabsContent value="style-transfer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Style Transfer
                  </CardTitle>
                  <CardDescription>
                    Transfer the style from one image to another
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Content Image */}
                    <div>
                      <Label>Content Image</Label>
                      <DropZone
                        onFilesChange={(files) => files[0] && handleStyleContentFileChange(files[0])}
                        accept="image/*"
                        multiple={false}
                        className="mt-2"
                      >
                        {styleContentPreview ? (
                          <div className="relative">
                            <div className="relative w-full h-48 overflow-hidden rounded-lg">
                              <img
                                src={styleContentPreview}
                                alt="Content Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeStyleContentImage}
                              className="absolute top-2 right-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                              {styleContentImage?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                             <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                             <p className="text-sm text-muted-foreground">
                               Content image
                             </p>
                             <p className="text-xs text-muted-foreground mt-1">
                               The image to apply style to
                             </p>
                           </div>
                        )}
                      </DropZone>
                    </div>

                    {/* Style Image */}
                    <div>
                      <Label>Style Image</Label>
                      <DropZone
                        onFilesChange={(files) => files[0] && handleStyleStyleFileChange(files[0])}
                        accept="image/*"
                        multiple={false}
                        className="mt-2"
                      >
                        {styleStylePreview ? (
                          <div className="relative">
                            <div className="relative w-full h-48 overflow-hidden rounded-lg">
                              <img
                                src={styleStylePreview}
                                alt="Style Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeStyleStyleImage}
                              className="absolute top-2 right-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <p className="text-sm text-muted-foreground mt-2 text-center">
                              {styleStyleImage?.name}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                             <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                             <p className="text-sm text-muted-foreground">
                               Style image
                             </p>
                             <p className="text-xs text-muted-foreground mt-1">
                               The style to transfer
                             </p>
                           </div>
                        )}
                      </DropZone>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Style Intensity: {(styleIntensity[0] * 100).toFixed(0)}%</Label>
                    <Slider
                      value={styleIntensity}
                      onValueChange={setStyleIntensity}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="style-transfer-style">Style</Label>
                    <Select value={styleTransferStyle} onValueChange={setStyleTransferStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artistic">Artistic</SelectItem>
                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleStyleTransfer} 
                    disabled={loading || !styleContentImage || !styleStyleImage}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transferring Style...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Transfer Style
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Result Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Result
              </CardTitle>
              <CardDescription>
                Generated or edited images will be displayed here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={generatedImage}
                      alt="Generated result"
                      className="w-full h-auto rounded-lg border shadow-lg"
                    />
                  </div>
                  
                  {/* Conversation History */}
                  {conversationHistory.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Refinement History</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conversationHistory.map((item, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded text-muted-foreground">
                            {index + 1}. {item.instruction}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleDownload} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button 
                        variant="default" 
                        onClick={() => setShowRefineDialog(!showRefineDialog)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refine
                      </Button>
                    </div>
                    
                    {/* Inline Refine Input */}
                    {showRefineDialog && (
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="refine-instruction" className="text-sm font-medium">
                            Refinement Instruction
                          </Label>
                          <Textarea
                            id="refine-instruction"
                            placeholder="e.g., Make the colors more vibrant, add more details to the background..."
                            value={refineInstruction}
                            onChange={(e) => setRefineInstruction(e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowRefineDialog(false)
                              setRefineInstruction('')
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleRefineImage} 
                            disabled={loading || !refineInstruction.trim()}
                            className="flex-1"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Refining...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refine Image
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
                  <ImageIcon className="w-12 h-12 mb-4" />
                  <p className="text-center">
                    Images will be displayed here after processing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// DropZone component for drag and drop functionality
interface DropZoneProps {
  onFilesChange: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  className?: string
  children: React.ReactNode
}

function DropZone({ onFilesChange, accept, multiple = false, maxFiles, className, children }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
     e.preventDefault()
     setIsDragOver(false)
     
     const files = Array.from(e.dataTransfer.files)
     if (maxFiles && files.length > maxFiles) {
       toast.error(`Maximum ${maxFiles} files allowed`)
       return
     }
     
     if (accept) {
       const acceptedTypes = accept.split(',')
       const validFiles = files.filter(file => 
         acceptedTypes.some(type => 
           type.trim() === '*/*' || 
           file.type.startsWith(type.trim().replace('*', ''))
         )
       )
       if (validFiles.length !== files.length) {
         toast.error('Some files have invalid format')
       }
       onFilesChange(validFiles)
     } else {
       onFilesChange(files)
     }
   }, [onFilesChange, accept, maxFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onFilesChange(files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [onFilesChange])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div
      className={`border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
        isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      } ${className}`}
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
        onChange={handleFileInputChange}
        className="hidden"
      />
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export default NanoBanana