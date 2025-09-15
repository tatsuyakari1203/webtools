import { useState } from 'react';
import { toast } from 'sonner';
import { apiService } from './services/api-service';
import { processFiles } from './file-processor';
import type { AIImageStudioState } from './types';

/**
 * Custom hook for managing AI Image Studio state and operations
 */
export const useAIImageStudio = () => {
  // Main state for the application
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
  
  // Additional state variables
  const [sizeMode, setSizeMode] = useState<'auto' | 'square' | 'portrait' | 'landscape' | 'wide' | 'ultrawide' | 'custom'>('auto');
  const [originalImageSize, setOriginalImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [includeImageContext, setIncludeImageContext] = useState(false);
  const [enableAutoResize, setEnableAutoResize] = useState(true);

  /**
   * Handles file processing when images are uploaded
   */
  const handleFileProcess = async (files: File[]) => {
    const result = await processFiles(files, state.imageUrls, sizeMode);
    
    if (result) {
      // Update state with new images and reset seed
      setState(prev => ({
        ...prev,
        uploadedImages: [...prev.uploadedImages, ...files],
        imageUrls: [...prev.imageUrls, ...result.imageUrls],
        base64Images: [...prev.base64Images, ...result.base64Images],
        imageSize: result.imageSize,
        error: null,
        seed: undefined // Reset seed when new images are added
      }));
      
      if (result.originalImageSize) {
        setOriginalImageSize(result.originalImageSize);
      }
    }
  };

  /**
   * Handles prompt enhancement
   */
  const handleEnhancePrompt = async () => {
    if (!state.prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      // Use service to enhance prompt
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

  /**
   * Handles the main image processing operation
   */
  const handleProcess = async () => {
    // Generate a new random seed for each request
    const newSeed = Math.floor(Math.random() * 2147483647);
    
    setState(prev => ({ ...prev, isProcessing: true, error: null, seed: newSeed }));

    try {
      // Use service to process image creation request
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
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An error occurred',
        isProcessing: false 
      }));
    }
  };

  /**
   * Resets the application state
   */
  const handleReset = () => {
    // Revoke object URLs to prevent memory leaks
    [...state.imageUrls, ...state.resultImages].forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    // Reset state
    setState({
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
    
    // Reset additional state
    setSizeMode('auto');
    setOriginalImageSize(null);
    setIncludeImageContext(false);
    
    toast.info('All images and settings have been reset');
  };

  return {
    // State
    state,
    setState,
    sizeMode,
    setSizeMode,
    originalImageSize,
    setOriginalImageSize,
    isEnhancing,
    setIsEnhancing,
    includeImageContext,
    setIncludeImageContext,
    enableAutoResize,
    setEnableAutoResize,
    
    // Actions
    handleFileProcess,
    handleEnhancePrompt,
    handleProcess,
    handleReset
  };
};