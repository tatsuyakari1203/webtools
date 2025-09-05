'use client';

import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, Download, Crop, RotateCw, Image as ImageIcon } from 'lucide-react';

// Import our custom components
import FileUpload from './components/FileUpload';
import AspectRatioSelector from './components/AspectRatioSelector';
import ImageCrop, { ImageCropRef } from './components/ImageCrop';
import CropPreview from './components/CropPreview';

// Import our custom hooks
import { useImageProcessor } from './hooks/useImageProcessor';

export default function SocialCrop() {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState('2');
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const [downloadFormat, setDownloadFormat] = useState('jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const imageCropRef = useRef<ImageCropRef>(null);
  
  // Custom hooks
  const { processImage, isProcessing: workerProcessing } = useImageProcessor();
  
  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCroppedImages([]); // Reset cropped images
  }, []);
  
  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback((value: string) => {
    setAspectRatio(value);
    setCroppedImages([]); // Reset cropped images when aspect ratio changes
  }, []);
  
  // Get aspect ratio for ImageCrop component - theo code gốc
  const getAspectRatio = (value: string): number | undefined => {
    switch (value) {
      case '2': return 2/1; // 2:1 ratio for 2 squares (width/height) - nằm ngang
      case '3': return 3/1; // 3:1 ratio for 3 squares (width/height) - nằm ngang
      case 'special2': return 1; // Square for special2 (3 pics)
      case 'special': return 6/5; // 6:5 ratio for special (5 pics) (width/height) - nằm ngang
      default: return undefined; // Free form
    }
  };
  
  // Handle crop completion - sử dụng worker để xử lý ảnh
  const handleCropComplete = useCallback(async (croppedImageUrl: string) => {
    if (workerProcessing) {
      toast.error('Already processing an image');
      return;
    }
    
    try {
      // Đối với free form, chỉ cần trả về ảnh đã crop
      if (aspectRatio === 'free') {
        setCroppedImages([croppedImageUrl]);
        toast.success('Crop completed successfully');
        return;
      }
      
      // Load ảnh đã crop sẵn từ ImageCrop component
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = croppedImageUrl;
      });
      
      // Tạo canvas để lấy ImageData cho worker
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      let processedImages: ImageData[];
      
      // Sử dụng worker để xử lý ảnh dựa trên aspect ratio
      if (aspectRatio === '2' || aspectRatio === '3') {
        // Crop thông thường
        const ratio = parseInt(aspectRatio);
        processedImages = await processImage('crop', imageData, {
          ratio,
          cropData: { x: 0, y: 0, width: canvas.width, height: canvas.height }
        });
        toast.success(`Successfully created ${ratio} square images`);
      } else if (aspectRatio === 'special2' || aspectRatio === 'special') {
        // Special crop modes
        processedImages = await processImage('special-crop', imageData, {
          mode: aspectRatio as 'special' | 'special2',
          cropData: { x: 0, y: 0, width: canvas.width, height: canvas.height }
        });
        const count = aspectRatio === 'special2' ? 3 : 5;
        toast.success(`Successfully created ${count} images for special layout`);
      } else {
        // Fallback cho các trường hợp khác
        setCroppedImages([croppedImageUrl]);
        toast.success('Crop completed successfully');
        return;
      }
      
      // Chuyển đổi ImageData thành URL để hiển thị
      const imageUrls = await Promise.all(
        processedImages.map(imageData => {
          return new Promise<string>((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            const ctx = canvas.getContext('2d')!;
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(URL.createObjectURL(blob));
              }
            }, 'image/png');
          });
        })
      );
      
      setCroppedImages(imageUrls);
      
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to process cropped image');
    }
  }, [aspectRatio, processImage, workerProcessing]);
  
  // Handle crop button click
  const handleCropButtonClick = useCallback(() => {
    if (!imageCropRef.current) {
      toast.error('Image crop component not ready');
      return;
    }
    imageCropRef.current.generateCrop();
  }, []);
  
  // Download function
  const handleDownload = useCallback(() => {
    if (croppedImages.length === 0) {
      toast.error('No images to download');
      return;
    }
    
    const fileName = selectedFile?.name.split('.')[0] || 'cropped';
    
    croppedImages.forEach((imageUrl, index) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${fileName}_crop_${index + 1}.${downloadFormat}`;
      link.click();
    });
    
    toast.success('Download started');
  }, [croppedImages, downloadFormat, selectedFile]);
  
  const canDownload = croppedImages.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Section with Glassmorphism */}
      <Card className="mb-8 border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="rounded-lg bg-primary/20 backdrop-blur-sm p-2 border border-white/20 dark:border-white/10">
              <Crop className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Social Media Image Cropper</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Upload an image, adjust the crop layout, and preview the split images. Perfect for social media posts!
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10">
              Multiple Layouts
            </Badge>
            <Badge variant="secondary" className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10">
              High Quality
            </Badge>
            <Badge variant="secondary" className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10">
              Instant Download
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      {/* Image element for cropper - will be displayed in container below */}
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Upload and Controls */}
        <div className="xl:col-span-1 space-y-6">
          {!selectedFile ? (
            /* File Upload */
            <FileUpload 
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
            />
          ) : (
            /* Crop Interface */
            <>
              {/* Image Crop Component with Glassmorphism */}
              <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crop className="h-5 w-5 text-primary" />
                    Crop Image
                  </CardTitle>
                  <CardDescription>
                    Adjust the crop area to fit your desired layout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageCrop
                    ref={imageCropRef}
                    src={imageUrl}
                    onCropComplete={handleCropComplete}
                    aspectRatio={getAspectRatio(aspectRatio)}
                    circular={false}
                  />
                  <div className="mt-6">
                    <Button 
                      onClick={handleCropButtonClick}
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 backdrop-blur-sm"
                      disabled={isProcessing || workerProcessing}
                    >
                      {(isProcessing || workerProcessing) ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Crop className="mr-2 h-4 w-4" />
                          Crop Image
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Aspect Ratio Selector with Glassmorphism */}
              <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">Layout Options</CardTitle>
                  <CardDescription>
                    Choose how to split your image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AspectRatioSelector
                    value={aspectRatio}
                    onValueChange={handleAspectRatioChange}
                    disabled={isProcessing}
                  />
                </CardContent>
              </Card>
              
              {/* Upload New Image Button with Glassmorphism */}
              <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                <CardContent className="pt-6">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setImageUrl('');
                      setCroppedImages([]);
                    }}
                    className="w-full bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-black/30"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Image
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        
        {/* Right Column - Download & Preview */}
        <div className="xl:col-span-1 space-y-6">
          {/* Download Controls with Glassmorphism */}
          {canDownload && (
            <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Download Options
                </CardTitle>
                <CardDescription>
                  Choose format and download your cropped images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                    <SelectTrigger className="w-32 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleDownload}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 backdrop-blur-sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Preview Section with Glassmorphism */}
          <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Preview
              </CardTitle>
              <CardDescription>
                {croppedImages.length > 0 
                  ? `${croppedImages.length} cropped images ready for download`
                  : 'Cropped images will appear here after processing'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {croppedImages.length > 0 ? (
                <div className={`gap-2 ${
                  aspectRatio === '2' ? 'grid grid-cols-2' :
                  aspectRatio === '3' ? 'grid grid-cols-3' :
                  aspectRatio === 'special2' ? 'space-y-2' :
                  aspectRatio === 'special' ? 'space-y-2' :
                  'grid grid-cols-1 md:grid-cols-2'
                }`}>
                {aspectRatio === 'special2' ? (
                  // Layout cho special2: 1 ảnh rectangle trên, 2 ảnh vuông dưới
                  <>
                    <div className="relative">
                      <img 
                        src={croppedImages[0]} 
                        alt="Cropped 1"
                        className="w-full h-auto rounded-lg border"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        1
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {croppedImages.slice(1).map((imageUrl, index) => (
                        <div key={index + 1} className="relative">
                          <img 
                            src={imageUrl} 
                            alt={`Cropped ${index + 2}`}
                            className="w-full h-auto rounded-lg border"
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {index + 2}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : aspectRatio === 'special' ? (
                  // Layout cho special: 2 ảnh trên, 3 ảnh dưới
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {croppedImages.slice(0, 2).map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={imageUrl} 
                            alt={`Cropped ${index + 1}`}
                            className="w-full h-auto rounded-lg border"
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {croppedImages.slice(2).map((imageUrl, index) => (
                        <div key={index + 2} className="relative">
                          <img 
                            src={imageUrl} 
                            alt={`Cropped ${index + 3}`}
                            className="w-full h-auto rounded-lg border"
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {index + 3}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // Layout cho crop 2, 3 và các chế độ khác
                  croppedImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={imageUrl} 
                        alt={`Cropped ${index + 1}`}
                        className="w-full h-auto rounded-lg border"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        {index + 1}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Cropped images will appear here</p>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}