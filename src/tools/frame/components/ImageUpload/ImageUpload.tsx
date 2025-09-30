'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import type { ImageUploadProps, ImageData, ExifData } from '../../types';
import { extractExifData } from '../../services/exifService';

export default function ImageUpload({ onImageUpload, onExifData, isProcessing }: ImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File) => {
    try {
      setError(null);
      setUploadProgress(10);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file size must be less than 10MB');
      }

      setUploadProgress(30);

      // Create image data URL
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);

      // Create image element to get dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = imageDataUrl;
      });

      setUploadProgress(70);

      // Create ImageData object
      const imageData: ImageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width: img.width,
        height: img.height,
        imageData: imageDataUrl,
        uploadedAt: new Date()
      };

      setUploadProgress(80);

      // Extract EXIF data
      try {
        const exifData = await extractExifData(file);
        onExifData(exifData);
      } catch (exifError) {
        console.warn('Failed to extract EXIF data:', exifError);
        // Create default EXIF data if extraction fails
        const defaultExifData: ExifData = {
          camera: { make: 'Unknown', model: 'Unknown' },
          settings: { aperture: 'f/0', shutterSpeed: '1/0s', iso: 0, focalLength: '0mm' },
          datetime: new Date().toISOString()
        };
        onExifData(defaultExifData);
      }

      setUploadProgress(100);
      onImageUpload(imageData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      setUploadProgress(0);
    }
  }, [onImageUpload, onExifData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processImage(acceptedFiles[0]);
    }
  }, [processImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.tiff', '.bmp']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed transition-colors">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`text-center cursor-pointer transition-all ${
              isDragActive ? 'scale-105' : ''
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              {isDragActive ? (
                <Upload className="h-16 w-16 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              )}
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  {isDragActive ? 'Drop your image here' : 'Upload your photo'}
                </h3>
                <p className="text-muted-foreground">
                  {isDragActive 
                    ? 'Release to upload' 
                    : 'Drag & drop an image here, or click to select'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPEG, PNG, WebP, TIFF, BMP (max 10MB)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}