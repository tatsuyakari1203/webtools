'use client';

import React, { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  accept = 'image/*', 
  disabled = false,
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = event.dataTransfer.files;
    const file = files[0];
    
    if (file && file.type.startsWith('image/')) {
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [disabled, onFileSelect]);

  return (
    <Card 
      className={cn(
        'relative border-2 border-dashed transition-colors duration-200',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {fileName ? (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {fileName ? 'File Selected' : 'Upload Image'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {fileName || 'Drag and drop an image here, or click to select'}
          </p>
        </div>
        
        <Input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        
        <div className="text-xs text-muted-foreground">
          Supports: JPG, PNG, GIF, WebP
        </div>
      </div>
    </Card>
  );
}

export default FileUpload;