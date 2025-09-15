'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
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

  // Function to handle paste from clipboard
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    e.preventDefault();
    
    if (e.clipboardData && e.clipboardData.items) {
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];
      
      for (const item of items) {
        // Check if the item is an image
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        // Show paste animation
        setIsPasting(true);
        
        // Add visual feedback when pasting
        if (uploadAreaRef.current) {
          uploadAreaRef.current.classList.add('border-primary', 'bg-primary/5');
          setTimeout(() => {
            uploadAreaRef.current?.classList.remove('border-primary', 'bg-primary/5');
          }, 500);
        }
        
        await processFiles(imageFiles);
        toast.success(`Pasted ${imageFiles.length} image(s) from clipboard`);
        
        // Reset paste animation
        setIsPasting(false);
      } else {
        toast.error('No images found in clipboard');
      }
    }
  }, [processFiles, uploadAreaRef]);
  
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
        toast.info('Press Ctrl+V or Command+V to paste images from clipboard');
      }
    } catch (error) {
      console.error('Error accessing clipboard:', error);
      toast.error('Cannot access clipboard. Please use Ctrl+V or Command+V keyboard shortcut instead.');
    } finally {
      setIsPasting(false);
    }
  }, [processFiles, uploadAreaRef]);
  
  // Handle paste from clipboard
  useEffect(() => {

    // Add event listener to the document
    document.addEventListener('paste', handlePaste);
    
    // Clean up event listener on component unmount
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);  // Added handlePaste to dependency array

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Upload Images</CardTitle>
        <CardDescription>
          Upload up to 10 images for AI-powered editing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={uploadAreaRef}
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
                click to browse files or paste from clipboard
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={isPasting ? 'animate-pulse border-primary' : ''}
                onClick={triggerPaste}
              >
                <ClipboardPaste className="h-4 w-4 mr-2" />
                Paste Image
              </Button>
            </div>
          </div>
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