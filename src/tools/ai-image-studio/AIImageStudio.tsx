'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import ImageUpload from './components/ImageUpload';
import EditInstructions from './components/EditInstructions';
import SettingsComponent from './components/Settings';
import FluxKontextSettings from './components/FluxKontextSettings';
import Preview from './components/Preview';
import type { AIImageStudioProps, AIImageStudioState } from './types';

// Custom Components
import { ModelSelector } from './components/ModelSelector';
import { GenerateButton } from './components/GenerateButton';
import { ErrorDisplay } from './components/ErrorDisplay';

// Custom hooks and utilities
import { useAIImageStudio } from './useAIImageStudio';
import { downloadImage } from './utils';

// Constants and utility functions moved to Settings.tsx component

export default function AIImageStudio({}: AIImageStudioProps) {
  // Use custom hook for state management and actions
  const {
    state,
    setState,
    sizeMode,
    setSizeMode,
    originalImageSize,
    setOriginalImageSize,
    isEnhancing,
    includeImageContext,
    setIncludeImageContext,
    enableAutoResize,
    setEnableAutoResize,
    handleFileProcess,
    handleEnhancePrompt,
    handleProcess,
    handleReset
  } = useAIImageStudio();

  // Hàm processFiles đã được chuyển sang file-processor.ts



  // Các hàm handleProcess và handleReset đã được chuyển sang useAIImageStudio.ts

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
            processFiles={handleFileProcess}
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
