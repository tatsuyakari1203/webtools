'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Palette, Upload, X, Download, Loader2, Settings, Wand2, Image as ImageIcon } from 'lucide-react';
import type { SeedreamEditorProps, SeedreamEditorState, SeedreamRequest, SeedreamResponse } from './types';

export default function SeedreamEditor({ tool }: SeedreamEditorProps) {
  const [state, setState] = useState<SeedreamEditorState>({
    prompt: '',
    uploadedImages: [],
    imageUrls: [],
    base64Images: [],
    resultImages: [],
    isProcessing: false,
    error: null,
    imageSize: { width: 1280, height: 1280 },
    numImages: 1
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part (remove data:image/...;base64, prefix)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check total image limit
    if (state.imageUrls.length + validFiles.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    // Process each file
    const newImageUrls: string[] = [];
    const newBase64Images: string[] = [];

    for (const file of validFiles) {
      try {
        const base64 = await convertToBase64(file);
        const imageUrl = URL.createObjectURL(file);
        
        newImageUrls.push(imageUrl);
        newBase64Images.push(base64);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    // Update state with new images
    setState(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...validFiles],
      imageUrls: [...prev.imageUrls, ...newImageUrls],
      base64Images: [...prev.base64Images, ...newBase64Images],
      error: null
    }));

    toast.success(`Added ${newImageUrls.length} image${newImageUrls.length > 1 ? 's' : ''}`);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await processFiles(files);
  };

  const removeImage = (index: number) => {
    setState(prev => {
      const newUploadedImages = [...prev.uploadedImages];
      const newImageUrls = [...prev.imageUrls];
      const newBase64Images = [...(prev.base64Images || [])];
      
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newImageUrls[index]);
      
      newUploadedImages.splice(index, 1);
      newImageUrls.splice(index, 1);
      newBase64Images.splice(index, 1);
      
      return {
        ...prev,
        uploadedImages: newUploadedImages,
        imageUrls: newImageUrls,
        base64Images: newBase64Images
      };
    });
  };

  const handleProcess = async () => {
    if (!state.prompt.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a prompt' }));
      return;
    }

    if (state.uploadedImages.length === 0) {
      setState(prev => ({ ...prev, error: 'Please upload at least one image' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Use base64 images for the API request
      const requestData: SeedreamRequest = {
        prompt: state.prompt,
        images: state.base64Images || [],
        image_size: state.imageSize,
        num_images: state.numImages,
        sync_mode: true,
        ...(state.seed && { seed: state.seed })
      };

      const response = await fetch('/api/seedream/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process images');
      }

      const result: SeedreamResponse = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        resultImages: result.images.map(img => img.url),
        isProcessing: false,
        seed: result.seed
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An error occurred',
        isProcessing: false 
      }));
    }
  };

  const handleReset = () => {
    // Revoke all object URLs
    state.imageUrls.forEach(url => URL.revokeObjectURL(url));
    
    setState({
      prompt: '',
      uploadedImages: [],
      imageUrls: [],
      base64Images: [],
      resultImages: [],
      isProcessing: false,
      error: null,
      imageSize: { width: 1280, height: 1280 },
      numImages: 1
    });
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `seedream-result-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {(tool as any)?.name || 'Seedream Editor'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(tool as any)?.description || 'Edit and enhance images using AI-powered Seedream technology'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Image Upload Section */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-base font-medium">Upload Images</CardTitle>
               <CardDescription>
                 Upload up to 10 images for AI-powered editing
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div 
                 className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/25"
                 onDragOver={(e) => {
                   e.preventDefault();
                   e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                 }}
                 onDragLeave={(e) => {
                   e.preventDefault();
                   e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                 }}
                 onDrop={async (e) => {
                   e.preventDefault();
                   e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                   const files = Array.from(e.dataTransfer.files);
                   if (files.length > 0) {
                     await processFiles(files);
                   }
                 }}
               >
                 <input
                   ref={fileInputRef}
                   type="file"
                   multiple
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="hidden"
                 />
                 <div className="flex flex-col items-center gap-2">
                   <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                     <ImageIcon className="h-6 w-6 text-muted-foreground" />
                   </div>
                   <div className="space-y-1">
                     <p className="text-sm font-medium">
                       Drag and drop images here
                     </p>
                     <p className="text-xs text-muted-foreground">
                       or click to browse files
                     </p>
                   </div>
                   <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     onClick={() => fileInputRef.current?.click()}
                     className="mt-2"
                   >
                     <Upload className="h-4 w-4 mr-2" />
                     Browse Files
                   </Button>
                 </div>
               </div>

              {/* Image Preview Grid */}
              {state.imageUrls.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Uploaded Images ({state.imageUrls.length}/10)
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          imageUrls: [],
                          base64Images: [],
                          uploadedImages: []
                        }));
                      }}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {state.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={url}
                            alt={`Uploaded ${index + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Edit Instructions</CardTitle>
              <CardDescription>
                Configure your AI-powered image editing parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Edit Prompt
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe how you want to edit the images (e.g., 'make it more colorful', 'add a sunset background', 'change to winter scene')..."
                  value={state.prompt}
                  onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the changes you want to make
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Image Size
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          min="256"
                          max="2048"
                          step="64"
                          value={state.imageSize.width}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            imageSize: { ...prev.imageSize, width: parseInt(e.target.value) || 1280 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          min="256"
                          max="2048"
                          step="64"
                          value={state.imageSize.height}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            imageSize: { ...prev.imageSize, height: parseInt(e.target.value) || 1280 }
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Number of Results
                    </Label>
                    <Input
                      id="numImages"
                      type="number"
                      min="1"
                      max="4"
                      value={state.numImages}
                      onChange={(e) => setState(prev => ({ ...prev, numImages: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
              </div>
              {state.seed && (
                <div className="space-y-2">
                  <Label>Seed (for reproducibility)</Label>
                  <Badge variant="secondary">{state.seed}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="pt-2">
              <Button
                onClick={handleProcess}
                disabled={state.isProcessing || state.uploadedImages.length === 0 || !state.prompt.trim()}
                className="w-full"
                size="lg"
              >
                {state.isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Images...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Edited Images
                  </>
                )}
              </Button>
              {(!state.prompt.trim() || state.uploadedImages.length === 0) && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {!state.prompt.trim() ? 'Enter an edit prompt to continue' : 'Upload images to get started'}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={state.isProcessing}
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Preview</CardTitle>
            <CardDescription>
              Original and edited images will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Original Images Preview */}
            {state.imageUrls.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Original Images</h4>
                  <div className="space-y-3">
                    {state.imageUrls.map((url, index) => (
                      <div key={index} className="overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={url}
                          alt={`Original ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Preview */}
            {state.resultImages.length > 0 && (
              <div className="space-y-4 mt-6">
                <Separator />
                <h4 className="text-sm font-medium mb-3">Edited Results</h4>
                <div className="space-y-4">
                  {state.resultImages.map((imageUrl, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Result {index + 1}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(imageUrl, index)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={imageUrl}
                          alt={`Result ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {state.imageUrls.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium mb-1">No images uploaded yet</h3>
                <p className="text-xs text-muted-foreground">
                  Upload images and add edit instructions to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
