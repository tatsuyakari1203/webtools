'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Wand2 } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import EditInstructions from './components/EditInstructions';
import SettingsComponent from './components/Settings';
import { calculateOptimalSize } from './components/Settings';
import Preview from './components/Preview';
import type { AIImageStudioProps, AIImageStudioState, SeedreamRequest, SeedreamResponse } from './types';

// Constants and utility functions moved to Settings.tsx component

export default function AIImageStudio({}: AIImageStudioProps) {
  const [state, setState] = useState<AIImageStudioState>({
    prompt: '',
    uploadedImages: [],
    imageUrls: [],
    base64Images: [],
    resultImages: [],
    isProcessing: false,
    error: null,
    imageSize: { width: 1024, height: 1024 },
    numImages: 1,
    maxImages: 4,
    enableSafetyChecker: true,
  });
  
  const [sizeMode, setSizeMode] = useState<'auto' | 'square' | 'portrait' | 'landscape' | 'wide' | 'ultrawide' | 'custom'>('auto');
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [includeImageContext, setIncludeImageContext] = useState(false);
  const [enableAutoResize, setEnableAutoResize] = useState(true); // State for auto-resize toggle

  // handleSizeModeChange moved to Settings.tsx component

  // Handle prompt enhancement
  const handleEnhancePrompt = async () => {
    if (!state.prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai-image-generation/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: state.prompt,
          category: 'image-editing',
          model: 'seedream',
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



  // Function to resize an image to match the original dimensions exactly
  const resizeImageToOriginal = async (imageUrl: string, originalWidth: number, originalHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for the image
      
      // Set a timeout to handle cases where the image might take too long to load
      const timeoutId = setTimeout(() => {
        reject(new Error('Image loading timeout'));
      }, 10000); // 10 seconds timeout
      
      img.onload = () => {
        clearTimeout(timeoutId);
        
        try {
          // Create a canvas with the original dimensions
          const canvas = document.createElement('canvas');
          canvas.width = originalWidth;
          canvas.height = originalHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Set image smoothing properties for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image onto the canvas, scaling it to match original dimensions
          ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
          
          // Convert canvas to data URL
          const resizedImageUrl = canvas.toDataURL('image/png');
          resolve(resizedImageUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load image for resizing'));
      };
      
      img.src = imageUrl;
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

    // Generate a new random seed for each request
    const newSeed = Math.floor(Math.random() * 2147483647);
    
    setState(prev => ({ ...prev, isProcessing: true, error: null, seed: newSeed }));

    try {
      // Use base64 images for the API request
      const requestData: SeedreamRequest = {
        prompt: state.prompt,
        images: state.base64Images,
        image_size: state.imageSize,
        num_images: state.numImages,
        max_images: state.maxImages,
        sync_mode: true,
        seed: newSeed,
        enable_safety_checker: state.enableSafetyChecker
      };

      const response = await fetch('/api/ai-image-generation/models/seedream', {
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
      
      // Get the result images URLs
      let resultImageUrls = result.images.map(img => img.url);
      
      // If auto-resize is enabled and we have original image dimensions, resize the result images
      if (enableAutoResize && originalImageSize && sizeMode === 'auto') {
        try {
          toast.info('Resizing images to match original dimensions...');
          
          // Process each image to match original dimensions
          const resizedPromises = resultImageUrls.map((url, index) => 
            resizeImageToOriginal(url, originalImageSize.width, originalImageSize.height)
              .catch(error => {
                console.error(`Error resizing image ${index + 1}:`, error);
                // Return the original URL if resizing fails
                return url;
              })
          );
          
          // Wait for all images to be resized
          const resizedUrls = await Promise.all(resizedPromises);
          
          // Count how many images were successfully resized
          const successCount = resizedUrls.filter((url, index) => url !== resultImageUrls[index]).length;
          
          if (successCount === resultImageUrls.length) {
            toast.success(`All ${successCount} images resized to match original dimensions (${originalImageSize.width}×${originalImageSize.height})`);
          } else if (successCount > 0) {
            toast.success(`${successCount} of ${resultImageUrls.length} images resized to match original dimensions`);
          } else {
            toast.error('Could not resize any images');
          }
          
          resultImageUrls = resizedUrls;
        } catch (error) {
          console.error('Error in image resizing process:', error);
          toast.error('Failed to resize images');
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        resultImages: resultImageUrls,
        isProcessing: false
        // We don't update seed from response anymore as we generate a new one for each request
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
      maxImages: 4,
      enableSafetyChecker: true,
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
          
          {/* Generate Image Button */}
          <div className="mt-3 mb-3">
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

          {/* Settings with Reset Button */}
          <div className="space-y-2">
            <SettingsComponent 
              imageSize={state.imageSize}
              onImageSizeChange={(newSize: { width: number; height: number }) => setState(prev => ({ ...prev, imageSize: newSize }))}
              sizeMode={sizeMode}
              onSizeModeChange={setSizeMode}
              numImages={state.numImages}
              onNumImagesChange={(num: number) => setState(prev => ({ ...prev, numImages: num }))}
              maxImages={state.maxImages}
              onMaxImagesChange={(maxImages: number) => setState(prev => ({ ...prev, maxImages }))}
              enableSafetyChecker={state.enableSafetyChecker}
              onEnableSafetyCheckerChange={(enableSafetyChecker: boolean) => setState(prev => ({ ...prev, enableSafetyChecker }))}
              enableAutoResize={enableAutoResize}
              onEnableAutoResizeChange={(value: boolean) => setEnableAutoResize(value)}
              seed={state.seed}
              originalImageSize={originalImageSize}
              disabled={state.isProcessing}
            />
            
            {/* Reset Button - Moved closer to Settings */}
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={state.isProcessing}
              className="w-full h-8 text-xs"
              size="sm"
            >
              Reset
            </Button>
          </div>

          {/* Error Display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Right Column - Preview */}
        <Preview 
          resultImages={state.resultImages}
          onDownload={downloadImage}
        />
      </div>
    </div>
  );
}
