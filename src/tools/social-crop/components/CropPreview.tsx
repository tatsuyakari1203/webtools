'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, Grid3X3, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CropPreviewProps {
  images: ImageData[];
  mode: string;
  className?: string;
}

export function CropPreview({ images, mode, className }: CropPreviewProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const renderImageToCanvas = useCallback((_imageData: ImageData, _index: number) => {
    // Get canvas reference and render ImageData
    const canvas = canvasRefs.current[_index];
    if (canvas && _imageData) {
      canvas.width = _imageData.width;
      canvas.height = _imageData.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(_imageData, 0, 0);
      }
    }
  }, []);

  useEffect(() => {
    // Update canvas elements with image data
    images.forEach((imageData, index) => {
      renderImageToCanvas(imageData, index);
    });
  }, [images, renderImageToCanvas]);

  if (images.length === 0) {
    return (
      <Card className={cn('relative overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-muted/30 to-muted/10', className)}>
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <div className="mb-6 p-4 rounded-full bg-muted/50">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-muted-foreground">Chưa có preview</h3>
            <p className="text-sm text-muted-foreground/70 max-w-sm">
              Tải lên và crop ảnh để xem kết quả preview tại đây
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/50">
            <Grid3X3 className="h-4 w-4" />
            <span>Hỗ trợ nhiều định dạng crop khác nhau</span>
          </div>
        </div>
      </Card>
    );
  }

  const getGridClassName = () => {
    switch (mode) {
      case '2':
        return 'grid-cols-2';
      case '3':
        return 'grid-cols-3';
      case 'special2':
        return 'grid-cols-2 gap-4';
      case 'special':
        return 'grid-cols-3 gap-4';
      default:
        return 'grid-cols-1';
    }
  };

  const getSpecialLayout = () => {
    if (mode === 'special2' && images.length === 3) {
      return (
        <div className="space-y-6">
          {/* Rectangle image (2:1) - Featured */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 z-10">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg">
                Ảnh chính (2:1)
              </Badge>
            </div>
            <PreviewImage 
              imageData={images[0]} 
              index={0} 
              label="Ảnh chính"
              ref={(el) => { canvasRefs.current[0] = el; }}
            />
          </div>
          
          {/* Two square images */}
          <div className="grid grid-cols-2 gap-6">
            <PreviewImage 
              imageData={images[1]} 
              index={1} 
              label="Ảnh vuông 1"
              ref={(el) => { canvasRefs.current[1] = el; }}
            />
            <PreviewImage 
              imageData={images[2]} 
              index={2} 
              label="Ảnh vuông 2"
              ref={(el) => { canvasRefs.current[2] = el; }}
            />
          </div>
        </div>
      );
    }

    if (mode === 'special' && images.length === 5) {
      return (
        <div className="space-y-6">
          {/* Top row - 2 images */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 z-10">
              <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg">
                Hàng trên
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <PreviewImage 
                imageData={images[0]} 
                index={0} 
                label="Trên trái"
                ref={(el) => { canvasRefs.current[0] = el; }}
              />
              <PreviewImage 
                imageData={images[1]} 
                index={1} 
                label="Trên phải"
                ref={(el) => { canvasRefs.current[1] = el; }}
              />
            </div>
          </div>
          
          {/* Bottom row - 3 images */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 z-10">
              <Badge className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg">
                Hàng dưới
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <PreviewImage 
                imageData={images[2]} 
                index={2} 
                label="Dưới trái"
                ref={(el) => { canvasRefs.current[2] = el; }}
              />
              <PreviewImage 
                imageData={images[3]} 
                index={3} 
                label="Dưới giữa"
                ref={(el) => { canvasRefs.current[3] = el; }}
              />
              <PreviewImage 
                imageData={images[4]} 
                index={4} 
                label="Dưới phải"
                ref={(el) => { canvasRefs.current[4] = el; }}
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const getModeDisplayName = () => {
    switch (mode) {
      case '2': return 'Chia đôi';
      case '3': return 'Chia ba';
      case 'special2': return 'Đặc biệt 3 ảnh';
      case 'special': return 'Đặc biệt 5 ảnh';
      default: return 'Đơn lẻ';
    }
  };

  return (
    <Card className={cn('overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-muted/20', className)}>
      {/* Header với gradient background */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Kết quả Preview</h3>
              <p className="text-sm text-muted-foreground">Chế độ: {getModeDisplayName()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Grid3X3 className="h-3 w-3 mr-1" />
              {images.length} ảnh
            </Badge>
            {images.length > 0 && (
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Tải xuống tất cả
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="p-6">
        <div className="min-h-[300px]">
          {mode === 'special2' || mode === 'special' ? (
            getSpecialLayout()
          ) : (
            <div className={cn('grid gap-6', getGridClassName())}>
              {images.map((imageData, index) => (
                <PreviewImage
                  key={index}
                  imageData={imageData}
                  index={index}
                  label={`Ảnh ${index + 1}`}
                  ref={(el) => { canvasRefs.current[index] = el; }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface PreviewImageProps {
  imageData: ImageData;
  index: number;
  label: string;
}

const PreviewImage = React.forwardRef<HTMLCanvasElement, PreviewImageProps>(
  ({ imageData, index, label }, ref) => {
    const handleDownload = () => {
      const canvas = ref as React.RefObject<HTMLCanvasElement>;
      if (canvas.current) {
        const link = document.createElement('a');
        link.download = `${label.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.current.toDataURL();
        link.click();
      }
    };

    return (
      <div className="group relative">
        {/* Main image container */}
        <div className="relative overflow-hidden rounded-xl border-2 border-border/50 bg-gradient-to-br from-muted/20 to-muted/5 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30">
          <canvas
            ref={ref}
            className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ maxHeight: '300px', objectFit: 'contain' }}
          />
          
          {/* Overlay với controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <Badge variant="secondary" className="bg-white/90 text-black border-0 shadow-lg">
                {label}
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                className="bg-white/90 hover:bg-white text-black border-0 shadow-lg gap-2"
              >
                <Download className="h-3 w-3" />
                Tải xuống
              </Button>
            </div>
          </div>
          
          {/* Corner decoration */}
          <div className="absolute top-2 right-2 w-3 h-3 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* Image info */}
        <div className="mt-3 text-center">
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {imageData.width} × {imageData.height}px
          </div>
        </div>
      </div>
    );
  }
);

PreviewImage.displayName = 'PreviewImage';

export default CropPreview;