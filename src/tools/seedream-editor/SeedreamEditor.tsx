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
import { Palette, Upload, X, Download, Loader2, Settings, Image as ImageIcon } from 'lucide-react';
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setState(prev => ({ ...prev, error: 'Please select only image files' }));
      return;
    }

    // Check total count (max 10)
    if (state.uploadedImages.length + validFiles.length > 10) {
      setState(prev => ({ ...prev, error: 'Maximum 10 images allowed' }));
      return;
    }

    // Convert files to URLs for preview and base64 for API
    const newImageUrls = validFiles.map(file => URL.createObjectURL(file));
    
    // Convert files to base64
    const base64Images = await Promise.all(
      validFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
    
    setState(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, ...validFiles],
      imageUrls: [...prev.imageUrls, ...newImageUrls],
      base64Images: [...(prev.base64Images || []), ...base64Images],
      error: null
    }));
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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>{(tool as any)?.name || 'Seedream Editor'}</CardTitle>
          </div>
          <CardDescription>
            {(tool as any)?.description || 'Edit and enhance images using AI-powered Seedream technology'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Upload Images</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop images here, or click to select files
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Images
              </Button>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, WebP. Max 10 images.
              </p>
            </div>
          </div>

          {/* Image Preview */}
          {state.imageUrls.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Uploaded Images ({state.imageUrls.length})</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {state.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-medium">Edit Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe how you want to edit the images (e.g., 'make it more colorful', 'add a sunset background', 'change to winter scene')..."
              value={state.prompt}
              onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Width</Label>
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
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
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
              <div className="space-y-2">
                <Label htmlFor="numImages">Number of Results</Label>
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
            {state.seed && (
              <div className="space-y-2">
                <Label>Seed (for reproducibility)</Label>
                <Badge variant="secondary">{state.seed}</Badge>
              </div>
            )}
          </div>

          {/* Error Display */}
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleProcess}
              disabled={state.isProcessing || state.uploadedImages.length === 0 || !state.prompt.trim()}
              className="flex-1"
            >
              {state.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  Edit Images
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={state.isProcessing}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {state.resultImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Generated {state.resultImages.length} edited image{state.resultImages.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.resultImages.map((imageUrl, index) => (
                <div key={index} className="space-y-3">
                  <img
                    src={imageUrl}
                    alt={`Result ${index + 1}`}
                    className="w-full rounded-lg border shadow-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadImage(imageUrl, index)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Image {index + 1}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
