'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Wand2 } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import EditInstructions from './components/EditInstructions';
import SettingsComponent from './components/Settings';
import FluxKontextSettings from './components/FluxKontextSettings';
import { calculateOptimalSize } from './components/Settings';
import Preview from './components/Preview';
import type { AIImageStudioProps, AIImageStudioState } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Custom Components
import { ModelSelector } from './components/ModelSelector';
import { GenerateButton } from './components/GenerateButton';
import { ErrorDisplay } from './components/ErrorDisplay';

// Services
import { apiService } from './services/api-service';
import { convertToBase64, downloadImage } from './utils';

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
    selectedModel: 'seedream',
    aspectRatio: '1:1',
    guidanceScale: 7.5,
    safetyTolerance: '3',
    enhancePrompt: false,
    outputFormat: 'jpeg'
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
      // Sử dụng service để nâng cao prompt
      const imageParam = includeImageContext && state.base64Images.length > 0 ? state.base64Images[0] : undefined;
      const enhancedPrompt = await apiService.enhancePrompt({
        prompt: state.prompt,
        category: 'image-editing',
        model: state.selectedModel,
        image: imageParam
      });
      
      setState(prev => ({ ...prev, prompt: enhancedPrompt }));
      toast.success('Prompt enhanced successfully!');
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Hàm convertToBase64 đã được chuyển sang utils.ts

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



  // Function resizeImageToOriginal has been moved to ApiService
  
  const handleProcess = async () => {
    // Generate a new random seed for each request
    const newSeed = Math.floor(Math.random() * 2147483647);
    
    setState(prev => ({ ...prev, isProcessing: true, error: null, seed: newSeed }));

    try {
      // Sử dụng service để xử lý request tạo ảnh
      const resultImageUrls = await apiService.processImages({
        prompt: state.prompt,
        base64Images: state.base64Images,
        imageUrls: state.imageUrls,
        selectedModel: state.selectedModel,
        imageSize: state.imageSize,
        numImages: state.numImages,
        maxImages: state.maxImages,
        enableSafetyChecker: state.enableSafetyChecker,
        aspectRatio: state.aspectRatio || '1:1',
        safetyTolerance: state.safetyTolerance || '3',
        guidanceScale: state.guidanceScale || 7.5,
        enhancePrompt: state.enhancePrompt || false,
        outputFormat: state.outputFormat || 'jpeg',
        seed: newSeed
      });
      
      // If auto-resize is enabled and we have original image dimensions, resize the result images
      // Only apply auto-resize for Seedream model
      let finalImageUrls = resultImageUrls;
      if (enableAutoResize && originalImageSize && sizeMode === 'auto' && state.selectedModel === 'seedream') {
        try {
          toast.info('Resizing images to match original dimensions...');
          
          // Process each image to match original dimensions
          const resizedPromises = resultImageUrls.map((url, index) => 
            apiService.resizeImageToOriginal(url, originalImageSize.width, originalImageSize.height)
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
          
          finalImageUrls = resizedUrls;
        } catch (error) {
          console.error('Error in image resizing process:', error);
          toast.error('Failed to resize images');
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        resultImages: finalImageUrls,
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
      seed: undefined,
      selectedModel: 'seedream',
      aspectRatio: '1:1',
      guidanceScale: 7.5,
      safetyTolerance: '3',
      enhancePrompt: false,
      outputFormat: 'jpeg'
    });
    
    // Reset other states
    setSizeMode('auto');
    setOriginalImageSize(null);
  };

  // Hàm downloadImage đã được chuyển sang utils.ts

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

          {/* Model Selection */}
          <ModelSelector
            selectedModel={state.selectedModel}
            onModelChange={(value) => {
              console.log('Model changed to:', value, 'Images:', state.uploadedImages.length, state.imageUrls.length);
              setState(prev => ({ ...prev, selectedModel: value }));
            }}
            disabled={state.isProcessing}
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
          <GenerateButton
            onClick={() => {
              console.log('Generate button clicked:', {
                isProcessing: state.isProcessing,
                uploadedImagesCount: state.uploadedImages.length,
                promptEmpty: !state.prompt.trim(),
                prompt: state.prompt
              });
              handleProcess();
            }}
            isProcessing={state.isProcessing}
            disabled={state.isProcessing || state.uploadedImages.length === 0 || !state.prompt.trim()}
            hasPrompt={!!state.prompt.trim()}
            hasImages={state.uploadedImages.length > 0}
          />

          {/* Settings with Reset Button */}
          <div className="space-y-2">
            {state.selectedModel === 'seedream' ? (
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
                selectedModel={state.selectedModel}
              />
            ) : (
              <FluxKontextSettings
                aspectRatio={state.aspectRatio || '1:1'}
                onAspectRatioChange={(value: string) => setState(prev => ({ ...prev, aspectRatio: value as AIImageStudioState['aspectRatio'] }))}
                numImages={state.numImages}
                onNumImagesChange={(numImages: number) => setState(prev => ({ ...prev, numImages: numImages }))}
                guidanceScale={state.guidanceScale || 7.5}
                onGuidanceScaleChange={(scale: number) => setState(prev => ({ ...prev, guidanceScale: scale }))}
                safetyTolerance={state.safetyTolerance || '3'}
                onSafetyToleranceChange={(value: string) => setState(prev => ({ ...prev, safetyTolerance: value }))}
                outputFormat={state.outputFormat || 'jpeg'}
                onOutputFormatChange={(format: 'jpeg' | 'png') => setState(prev => ({ ...prev, outputFormat: format }))}
                enhancePrompt={state.enhancePrompt || false}
                onEnhancePromptChange={(checked: boolean) => setState(prev => ({ ...prev, enhancePrompt: checked }))}
                seed={state.seed}
                disabled={state.isProcessing}
              />
            )}
            
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
          <ErrorDisplay error={state.error} />
        </div>

        {/* Right Column - Preview */}
        <Preview 
          resultImages={state.resultImages}
          onDownload={(url, index) => downloadImage(url, `${state.selectedModel}-result-${index + 1}.png`)}
        />
      </div>
    </div>
  );
}
