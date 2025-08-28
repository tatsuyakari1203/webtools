'use client';

import React, { useState, useCallback } from 'react';
import { Upload, RotateCw, ZoomIn, ZoomOut, Download, Copy, Settings, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Image from 'next/image';
import { OCRResponse, OCRResult, OCRSettings, SUPPORTED_LANGUAGES, ACCURACY_OPTIONS, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './types';

export default function OCRTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [settings, setSettings] = useState<OCRSettings>({
    language: 'auto',
    accuracy: 'standard'
  });

  // Xử lý drag & drop
  // Validate file
  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Định dạng file không được hỗ trợ. Vui lòng chọn JPG, PNG, GIF hoặc WebP.');
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File quá lớn. Kích thước tối đa là 10MB.');
      return false;
    }
    
    return true;
  };

  // Xử lý chọn file
  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    
    // Tạo preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset các state khác
    setOcrResult(null);
    setImageRotation(0);
    setImageZoom(1);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Xử lý OCR
  const handleOCRProcess = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn hình ảnh trước.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('language', settings.language);
      formData.append('accuracy', settings.accuracy);

      const response = await fetch('/api/ocr/process', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Lỗi khi xử lý OCR');
      }

      const result: OCRResponse = await response.json();
      
      if (result.success) {
        setOcrResult({
          extractedText: result.text,
          confidence: result.confidence,
          processingTime: result.processingTime,
          timestamp: new Date()
        });
        toast.success('Trích xuất văn bản thành công!');
      } else {
        throw new Error(result.error || 'Lỗi không xác định');
      }
    } catch {
      toast.error('Lỗi khi xử lý OCR');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    if (!ocrResult?.extractedText) return;
    
    try {
      await navigator.clipboard.writeText(ocrResult.extractedText);
      toast.success('Đã sao chép văn bản!');
    } catch {
      toast.error('Không thể sao chép văn bản');
    }
  };

  // Download text as file
  const handleDownloadText = () => {
    if (!ocrResult?.extractedText) return;
    
    const blob = new Blob([ocrResult.extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr-result-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Đã tải xuống file văn bản!');
  };

  // Image controls
  const rotateImage = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const zoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Công cụ OCR - Trích xuất Văn bản
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sử dụng AI của Google Gemini để trích xuất văn bản từ hình ảnh một cách chính xác
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Preview Section */}
        <div className="space-y-4">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Tải lên Hình ảnh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Kéo thả hình ảnh vào đây</p>
                <p className="text-sm text-gray-500 mb-4">hoặc click để chọn file</p>
                <p className="text-xs text-gray-400">
                  Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Preview */}
          {imagePreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Xem trước Hình ảnh</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={zoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={zoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={rotateImage}>
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96 flex justify-center">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={800}
                    height={600}
                    className="max-w-full h-auto"
                    style={{
                      transform: `rotate(${imageRotation}deg) scale(${imageZoom})`,
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings & Results Section */}
        <div className="space-y-4">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt OCR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">Ngôn ngữ</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger id="ocr-language-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent id="ocr-language-content">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="accuracy">Độ chính xác</Label>
                <Select
                  value={settings.accuracy}
                  onValueChange={(value: 'standard' | 'high') => 
                    setSettings(prev => ({ ...prev, accuracy: value }))
                  }
                >
                  <SelectTrigger id="ocr-accuracy-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent id="ocr-accuracy-content">
                    {ACCURACY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleOCRProcess} 
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Trích xuất Văn bản
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-gray-500">
                    {progress}% hoàn thành
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {ocrResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kết quả OCR</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyText}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadText}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={ocrResult.extractedText}
                  onChange={(e) => setOcrResult(prev => prev ? {
                    ...prev,
                    extractedText: e.target.value
                  } : null)}
                  className="min-h-32 resize-y"
                  placeholder="Văn bản được trích xuất sẽ hiển thị ở đây..."
                />
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Độ tin cậy: {Math.round(ocrResult.confidence * 100)}%</span>
                  <span>Thời gian: {ocrResult.processingTime}ms</span>
                  <span>Số từ: {ocrResult.extractedText.split(/\s+/).filter(word => word.length > 0).length}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}