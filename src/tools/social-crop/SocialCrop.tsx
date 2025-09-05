'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';

// Import our custom components
import FileUpload from './components/FileUpload';
import AspectRatioSelector from './components/AspectRatioSelector';
import ImageCrop from './components/ImageCrop';
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
  
  // Custom hooks
  const { processImage } = useImageProcessor();
  
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
  
  // Handle crop completion - implement thuật toán cắt ảnh theo code gốc
  const handleCropComplete = useCallback(async (croppedImageUrl: string) => {
    setIsProcessing(true);
    
    try {
      // Tạo canvas từ cropped image URL
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = croppedImageUrl;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      const images: string[] = [];
      
      // Xử lý theo từng chế độ crop
      if (aspectRatio === 'special2') {
        // Special2 (3 ảnh): 1 hình chữ nhật 2:1 phía trên và 2 hình vuông phía dưới
        const fullWidth = canvas.width;
        const rectHeight = fullWidth / 2; // Tỷ lệ 2:1
        
        // Ảnh 1: Rectangle 2:1 phía trên
        const rectCanvas = document.createElement('canvas');
        rectCanvas.width = fullWidth;
        rectCanvas.height = rectHeight;
        const rectCtx = rectCanvas.getContext('2d')!;
        rectCtx.drawImage(canvas, 0, 0, fullWidth, rectHeight, 0, 0, fullWidth, rectHeight);
        images.push(rectCanvas.toDataURL());
        
        // Ảnh 2,3: 2 hình vuông phía dưới
        const squareSize = rectHeight;
        for (let i = 0; i < 2; i++) {
          const squareCanvas = document.createElement('canvas');
          squareCanvas.width = squareSize;
          squareCanvas.height = squareSize;
          const squareCtx = squareCanvas.getContext('2d')!;
          squareCtx.drawImage(canvas, i * squareSize, rectHeight, squareSize, squareSize, 0, 0, squareSize, squareSize);
          images.push(squareCanvas.toDataURL());
        }
        
        toast.success('Successfully created 3 images for special layout');
      } else if (aspectRatio === 'special') {
        // Special (5 ảnh): Theo code gốc - crop 6:5 rồi chia thành 5 phần
        const fullWidth = canvas.width;
        const fullHeight = canvas.height;
        
        // Tính toán kích thước theo tỷ lệ 6:5 (width:height)
        let cropWidth, cropHeight;
        const targetRatio = 6 / 5; // width/height = 1.2
        const currentRatio = fullWidth / fullHeight;
        
        if (currentRatio > targetRatio) {
          // Image quá rộng, crop theo height
          cropHeight = fullHeight;
          cropWidth = cropHeight * targetRatio;
        } else {
          // Image quá cao, crop theo width
          cropWidth = fullWidth;
          cropHeight = cropWidth / targetRatio;
        }
        
        // Tạo canvas với tỷ lệ 6:5
        const specialCanvas = document.createElement('canvas');
        specialCanvas.width = cropWidth;
        specialCanvas.height = cropHeight;
        const specialCtx = specialCanvas.getContext('2d')!;
        
        // Crop từ center
        const startX = (fullWidth - cropWidth) / 2;
        const startY = (fullHeight - cropHeight) / 2;
        specialCtx.drawImage(canvas, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        
        // Chia thành 2 phần: top (3/5 height) và bottom (2/5 height)
        const topHeight = (3 / 5) * cropHeight;
        const bottomHeight = (2 / 5) * cropHeight;
        
        // Top canvas
        const topCanvas = document.createElement('canvas');
        topCanvas.width = cropWidth;
        topCanvas.height = topHeight;
        const topCtx = topCanvas.getContext('2d')!;
        topCtx.drawImage(specialCanvas, 0, 0, cropWidth, topHeight, 0, 0, cropWidth, topHeight);
        
        // Bottom canvas
        const bottomCanvas = document.createElement('canvas');
        bottomCanvas.width = cropWidth;
        bottomCanvas.height = bottomHeight;
        const bottomCtx = bottomCanvas.getContext('2d')!;
        bottomCtx.drawImage(specialCanvas, 0, topHeight, cropWidth, bottomHeight, 0, 0, cropWidth, bottomHeight);
        
        // Helper function để split canvas theo code gốc
        const splitCanvas = (sourceCanvas: HTMLCanvasElement, index: number, totalParts: number) => {
          const partWidth = sourceCanvas.width / totalParts;
          const partHeight = sourceCanvas.height;
          const canvas = document.createElement('canvas');
          canvas.width = partWidth;
          canvas.height = partHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(
            sourceCanvas,
            index * partWidth,
            0,
            partWidth,
            partHeight,
            0,
            0,
            partWidth,
            partHeight
          );
          return canvas;
        };
        
        // Tạo 5 ảnh theo code gốc
        const square1 = splitCanvas(topCanvas, 0, 2);
        const square2 = splitCanvas(topCanvas, 1, 2);
        const square3 = splitCanvas(bottomCanvas, 0, 3);
        const square4 = splitCanvas(bottomCanvas, 1, 3);
        const square5 = splitCanvas(bottomCanvas, 2, 3);
        
        [square1, square2, square3, square4, square5].forEach((canvas) => {
          images.push(canvas.toDataURL());
        });
        
        toast.success('Successfully created 5 images for special layout');
      } else {
        // Chế độ crop thông thường (2 hoặc 3 ảnh)
        const ratio = parseInt(aspectRatio, 10);
        const squareWidth = canvas.width / ratio;
        
        for (let i = 0; i < ratio; i++) {
          const squareCanvas = document.createElement('canvas');
          squareCanvas.width = squareWidth;
          squareCanvas.height = squareWidth;
          const squareCtx = squareCanvas.getContext('2d')!;
          
          const imageData = ctx.getImageData(i * squareWidth, 0, squareWidth, squareWidth);
          squareCtx.putImageData(imageData, 0, 0);
          
          images.push(squareCanvas.toDataURL());
        }
        
        toast.success(`Successfully created ${ratio} square images`);
      }
      
      setCroppedImages(images);
      
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to process cropped image');
    } finally {
      setIsProcessing(false);
    }
  }, [aspectRatio]);
  
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
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Social Media Image Cropper</h1>
        <p className="text-muted-foreground">
          Upload an image, adjust the crop layout, and preview the split images. Perfect for social media posts!
        </p>
      </div>
      
      {/* Image element for cropper - will be displayed in container below */}
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - Upload and Controls */}
        <div className="xl:col-span-1 space-y-6">
          {/* File Upload */}
          <FileUpload 
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
          />
          
          {/* Aspect Ratio Selector */}
          <AspectRatioSelector
            value={aspectRatio}
            onValueChange={handleAspectRatioChange}
            disabled={isProcessing}
          />
          
          {/* Download Controls */}
          {canDownload && (
            <div className="bg-card rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-4">Download Options</h3>
              <div className="flex items-center gap-4">
                <select 
                  value={downloadFormat} 
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                </select>
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download Images
                </button>
              </div>
            </div>
          )}
        
        {/* Image Crop Component */}
        {selectedFile && imageUrl && (
          <div className="mt-6">
            <ImageCrop
              src={imageUrl}
              onCropComplete={handleCropComplete}
              aspectRatio={getAspectRatio(aspectRatio)}
              circular={false}
            />
          </div>
        )}
        </div>
        
        {/* Right Column - Preview */}
        <div className="xl:col-span-1">
          <div className="bg-card rounded-lg border p-4 min-h-[400px]">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}