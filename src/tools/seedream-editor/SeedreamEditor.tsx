'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Palette, Upload, Download, Loader2, Settings as SettingsIcon, Wand2, Image as ImageIcon, Sparkles } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import EditInstructions from './components/EditInstructions';
import SettingsComponent from './components/Settings';
import { calculateOptimalSize } from './components/Settings';
import type { SeedreamEditorProps, SeedreamEditorState, SeedreamRequest, SeedreamResponse } from './types';

// Constants and utility functions moved to Settings.tsx component

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
  
  const [sizeMode, setSizeMode] = useState<'auto' | 'square' | 'portrait' | 'landscape' | 'wide' | 'ultrawide' | 'custom'>('auto');
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [includeImageContext, setIncludeImageContext] = useState(false);

  // handleSizeModeChange moved to Settings.tsx component

  // Handle prompt enhancement
  const handleEnhancePrompt = async () => {
    if (!state.prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/seedream/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: state.prompt,
          category: 'image-editing',
          ...(includeImageContext && state.base64Images.length > 0 && {
            image: state.base64Images[0]
          })
        })
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({ ...prev, prompt: data.enhanced_prompt }));
        toast.success('Prompt enhanced successfully!');
      } else {
        toast.error(data.error || 'Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

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
    let firstImageDimensions: { width: number; height: number } | null = null;

    for (const file of validFiles) {
      try {
        const base64 = await convertToBase64(file);
        const imageUrl = URL.createObjectURL(file);
        
        // Get image dimensions for each image to calculate optimal size
        if (sizeMode === 'auto') {
          const img = new Image();
          const imageDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.onerror = reject;
            img.src = imageUrl;
          });
          
          // Use the first image dimensions or update if this is the first image being added
          if (!firstImageDimensions) {
            firstImageDimensions = imageDimensions;
          }
        }
        
        newImageUrls.push(imageUrl);
        newBase64Images.push(base64);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    // Calculate optimal size if we have the first image dimensions and auto mode is selected
    let newImageSize = state.imageSize;
    if (firstImageDimensions && sizeMode === 'auto') {
      newImageSize = calculateOptimalSize(firstImageDimensions.width, firstImageDimensions.height);
      setOriginalImageSize(firstImageDimensions);
    }

    // Update state with new images and reset seed
    setState(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...validFiles],
      imageUrls: [...prev.imageUrls, ...newImageUrls],
      base64Images: [...prev.base64Images, ...newBase64Images],
      imageSize: newImageSize,
      error: null,
      seed: undefined // Reset seed when new images are added
    }));

    toast.success(`Added ${newImageUrls.length} image${newImageUrls.length > 1 ? 's' : ''}`);
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
      numImages: 1,
      seed: undefined
    });
    
    // Reset other states
    setSizeMode('auto');
    setOriginalImageSize(null);
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
              {(tool as { name?: string })?.name || 'Seedream Editor'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {(tool as { description?: string })?.description || 'Edit and enhance images using AI-powered Seedream technology'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Image Upload Section */}
          <ImageUpload 
            images={state.imageUrls}
            onImagesChange={(newImages, newBase64Images, newUploadedImages) => {
              setState(prev => ({
                ...prev,
                imageUrls: newImages,
                base64Images: newBase64Images,
                uploadedImages: newUploadedImages,
                seed: undefined // Reset seed when images change
              }));
              
              // Handle image size calculation for the first image if in auto mode
              if (newImages.length > 0 && sizeMode === 'auto' && newImages.length > state.imageUrls.length) {
                const img = new Image();
                  img.onload = () => {
                    const dimensions = { width: img.width, height: img.height };
                    // Import the function from Settings component
                    import('./components/Settings').then(module => {
                      const optimalSize = module.calculateOptimalSize(dimensions.width, dimensions.height);
                      setOriginalImageSize(dimensions);
                      setState(prev => ({ ...prev, imageSize: optimalSize }));
                    });
                  };
                  img.src = newImages[newImages.length - 1];
              }
              
              // Reset size mode if all images are removed
              if (newImages.length === 0) {
                setSizeMode('auto');
                setOriginalImageSize(null);
              }
            }}
            processFiles={processFiles}
          />

          {/* Edit Instructions Section */}
          <EditInstructions 
            prompt={state.prompt}
            onPromptChange={(newPrompt) => setState(prev => ({ ...prev, prompt: newPrompt }))}
            includeImageContext={includeImageContext}
            onIncludeImageContextChange={(checked) => setIncludeImageContext(checked)}
            hasImages={state.base64Images.length > 0}
            isEnhancing={isEnhancing}
            onEnhancePrompt={handleEnhancePrompt}
          />

          {/* Settings */}
          <SettingsComponent 
            imageSize={state.imageSize}
            onImageSizeChange={(newSize: { width: number; height: number }) => setState(prev => ({ ...prev, imageSize: newSize }))}
            sizeMode={sizeMode}
            onSizeModeChange={setSizeMode}
            numImages={state.numImages}
            onNumImagesChange={(num: number) => setState(prev => ({ ...prev, numImages: num }))}
            seed={state.seed}
            originalImageSize={originalImageSize}
            disabled={state.isProcessing}
          />

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
