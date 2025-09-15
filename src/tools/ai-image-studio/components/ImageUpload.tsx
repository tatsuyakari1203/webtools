'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  images?: string[];
  onImagesChange: (newImages: string[], newBase64Images: string[], newUploadedImages: File[]) => void;
  processFiles: (files: File[]) => Promise<void>;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images = [],
  onImagesChange,
  processFiles
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  // State to track paste animation
  const [isPasting, setIsPasting] = useState(false);
  
  // Function to request clipboard access and trigger paste programmatically
  const triggerPaste = useCallback(async () => {
    try {
      // Check if the Clipboard API is available
      if (navigator.clipboard) {
        setIsPasting(true);
        
        // Try to read image from clipboard using Clipboard API
        const clipboardItems = await navigator.clipboard.read();
        const imageFiles: File[] = [];
        
        for (const clipboardItem of clipboardItems) {
          // Check for image types in the clipboard
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              // Convert blob to file
              const file = new File([blob], `pasted-image-${Date.now()}.${type.split('/')[1]}`, { type });
              imageFiles.push(file);
            }
          }
        }
        
        if (imageFiles.length > 0) {
          // Add visual feedback when pasting
          if (uploadAreaRef.current) {
            uploadAreaRef.current.classList.add('border-primary', 'bg-primary/5');
            setTimeout(() => {
              uploadAreaRef.current?.classList.remove('border-primary', 'bg-primary/5');
            }, 500);
          }
          
          await processFiles(imageFiles);
          toast.success(`Pasted ${imageFiles.length} image(s) from clipboard`);
        } else {
          // If no images found, show error
          toast.error('No images found in clipboard');
        }
      } else {
        // Fallback for browsers that don't support Clipboard API
        toast.error('Clipboard API not supported in this browser');
      }
    } catch (error) {
      console.error('Error accessing clipboard:', error);
      toast.error('Cannot access clipboard. Please try again or check browser permissions.');
    } finally {
      setIsPasting(false);
    }
  }, [processFiles, uploadAreaRef]);
  
  // Không còn lắng nghe sự kiện paste trên document nữa
  // Chỉ sử dụng nút paste để dán ảnh

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      await processFiles(files);
      
      // Reset the input value so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    uploadAreaRef.current?.classList.add('border-primary', 'bg-primary/5');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    uploadAreaRef.current?.classList.remove('border-primary', 'bg-primary/5');
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    uploadAreaRef.current?.classList.remove('border-primary', 'bg-primary/5');
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const files = Array.from(event.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length > 0) {
        await processFiles(files);
      } else {
        toast.error('Please drop image files only');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Images</CardTitle>
        <CardDescription>
          Upload or paste images to enhance with AI. Supports JPG, PNG, and WebP formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          ref={uploadAreaRef}
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4 transition-colors"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="rounded-full bg-primary/10 p-3">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-medium">Drag and drop your images</h3>
            <p className="text-sm text-muted-foreground">
              Or click to browse (max 10 images)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="gap-2"
              disabled={images.length >= 10}
            >
              <Upload className="h-4 w-4" />
              Browse Files
            </Button>
            <Button
              onClick={triggerPaste}
              variant="outline"
              className="gap-2"
              disabled={isPasting || images.length >= 10}
            >
              <ClipboardPaste className="h-4 w-4" />
              {isPasting ? 'Pasting...' : 'Paste from Clipboard'}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
            disabled={images.length >= 10}
          />
        </div>
        
        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Uploaded Images ({images.length}/10)
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Revoke all object URLs
                  images.forEach(url => URL.revokeObjectURL(url));
                  onImagesChange([], [], []);
                }}
                className="h-8 text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {images.map((url, index) => (
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
                    onClick={() => {
                      const newImages = [...images];
                      // Revoke the object URL to free memory
                      URL.revokeObjectURL(newImages[index]);
                      
                      newImages.splice(index, 1);
                      onImagesChange(newImages, [], []);
                    }}
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
  );
};

export default ImageUpload;