'use client';

import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';

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