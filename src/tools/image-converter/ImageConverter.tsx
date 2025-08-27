'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Upload, Download, Trash2, Play, RotateCcw, Settings, FileImage } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ImageFile, ConversionSettings, ProcessingResult } from './types';
import { WorkerPool } from './utils/workerPool';
import { 
  formatFileSize, 
  formatProcessingTime, 
  formatCompressionRatio,
  calculateFileStatistics,
  getFormatDisplayName
} from './utils/statistics';
import StatisticsPanel from './components/StatisticsPanel';

const ImageConverter: React.FC = () => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProcessingTime, setBatchProcessingTime] = useState<number | undefined>(undefined);
  const [zipSize, setZipSize] = useState<number>(0);
  const [settings, setSettings] = useState<ConversionSettings>({
    outputFormat: 'webp',
    quality: 0.8,
    maxWidth: undefined,
    maxHeight: undefined,
    preserveExif: true,
    renamePattern: '{name}_converted.{ext}'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const workerPoolRef = useRef<WorkerPool | null>(null);

  // Initialize worker pool
  useEffect(() => {
    workerPoolRef.current = new WorkerPool();
    return () => {
      workerPoolRef.current?.terminate();
    };
  }, []);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    const newFiles: ImageFile[] = await Promise.all(
      validFiles.map(async (file) => {
        // Get image dimensions for metadata
         const img = document.createElement('img');
         const url = URL.createObjectURL(file);
         const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
           img.onload = () => {
             URL.revokeObjectURL(url);
             resolve({ width: img.width, height: img.height });
           };
           img.src = url;
         });
        return {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: URL.createObjectURL(file),
          status: 'pending',
          progress: 0,
          metadata: {
             originalDimensions: dimensions,
             convertedDimensions: { width: 0, height: 0 }, // Will be updated after processing
             originalFormat: file.type.split('/')[1] || 'unknown',
             convertedFormat: '', // Will be updated after processing
             originalSize: file.size,
             convertedSize: 0, // Will be updated after processing
             compressionRatio: 0, // Will be updated after processing
             processingTime: 0 // Will be updated after processing
           }
        };
      })
    );

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`Added ${newFiles.length} file(s)`);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  // Process single file using worker pool
  const processFile = async (imageFile: ImageFile): Promise<ProcessingResult> => {
    const startTime = Date.now();
    
    if (!workerPoolRef.current) {
      return {
        success: false,
        error: 'Worker pool not initialized',
        originalSize: imageFile.file.size,
        compressedSize: 0,
        compressionRatio: 0,
        processingTime: Date.now() - startTime
      };
    }

    try {
      const options = {
        fileType: settings.outputFormat,
        initialQuality: settings.quality,
        maxWidthOrHeight: Math.max(settings.maxWidth || 0, settings.maxHeight || 0) || undefined,
        preserveExif: settings.preserveExif
      };

      const result = await workerPoolRef.current!.processImage(
        imageFile.file,
        options,
        (progress) => {
          setFiles(prev => prev.map(f => 
            f.id === imageFile.id ? { ...f, progress } : f
          ));
        }
      );
      
      const processingTime = Date.now() - startTime;
      let metadata = undefined;
      
      if (result.file) {
        // Get converted image dimensions for metadata
        const img = document.createElement('img');
        const url = URL.createObjectURL(result.file);
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
          };
          img.src = url;
        });
        
        metadata = {
          originalDimensions: imageFile.metadata?.originalDimensions || { width: 0, height: 0 },
          originalFormat: imageFile.metadata?.originalFormat || 'unknown',
          originalSize: imageFile.file.size,
          convertedDimensions: dimensions,
          convertedFormat: settings.outputFormat,
          convertedSize: result.file.size,
          compressionRatio: Math.round((1 - result.file.size / imageFile.file.size) * 100),
          processingTime
        };
      }
      
      return {
        success: true,
        file: result.file,
        originalSize: imageFile.file.size,
        compressedSize: result.file?.size || 0,
        compressionRatio: result.file ? Math.round((1 - result.file.size / imageFile.file.size) * 100) : 0,
        processingTime,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalSize: imageFile.file.size,
        compressedSize: 0,
        compressionRatio: 0,
        processingTime: Date.now() - startTime
      };
    }
  };

  // Process single file with progress
  const handleProcessFile = async (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f
    ));

    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      const result = await processFile(file);

      if (result.success && result.file) {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100, 
                convertedFile: result.file 
              } 
            : f
        ));
        toast.success(`${file.name} converted successfully`);
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', progress: 0, error: result.error } 
            : f
        ));
        toast.error(`Failed to convert ${file.name}: ${result.error}`);
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          : f
      ));
      toast.error(`Failed to convert ${file.name}`);
    }
  };

  // Process all files in parallel
  const handleProcessAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.info('No files to process');
      return;
    }

    setIsProcessing(true);
    const batchStartTime = Date.now();
    
    // Set all files to processing state
    setFiles(prev => prev.map(f => 
      pendingFiles.some(pf => pf.id === f.id) 
        ? { ...f, status: 'processing', progress: 0 }
        : f
    ));
    
    try {
      // Process files in parallel using Promise.allSettled
      const results = await Promise.allSettled(
        pendingFiles.map(async (file) => {
          const result = await processFile(file);
          return { fileId: file.id, result, fileName: file.name };
        })
      );

      // Update file states based on results
      results.forEach((promiseResult, index) => {
        const file = pendingFiles[index];
        
        if (promiseResult.status === 'fulfilled') {
          const { result, fileName } = promiseResult.value;
          
          if (result.success && result.file) {
            setFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { 
                    ...f, 
                    status: 'completed', 
                    progress: 100, 
                    convertedFile: result.file,
                    processingTime: result.processingTime,
                    convertedMetadata: result.metadata
                  } 
                : f
            ));
            toast.success(`${fileName} converted successfully`);
          } else {
            setFiles(prev => prev.map(f => 
              f.id === file.id 
                ? { ...f, status: 'error', progress: 0, error: result.error } 
                : f
            ));
            toast.error(`Failed to convert ${fileName}: ${result.error}`);
          }
        } else {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'error', 
                  progress: 0, 
                  error: 'Processing failed' 
                } 
              : f
          ));
          toast.error(`Failed to convert ${file.name}`);
        }
      });
      
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.result.success
      ).length;
      
      toast.success(`Processing completed: ${successCount}/${pendingFiles.length} files converted`);
    } catch {
      toast.error('Batch processing failed');
    } finally {
      const batchEndTime = Date.now();
      const actualProcessingTime = batchEndTime - batchStartTime;
      setBatchProcessingTime(actualProcessingTime);
      setIsProcessing(false);
    }
  };

  // Download as ZIP
  const handleDownloadZip = async () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.convertedFile);
    
    if (completedFiles.length === 0) {
      toast.error('No converted files to download');
      return;
    }

    try {
      const zip = new JSZip();
      
      completedFiles.forEach((file, index) => {
        if (file.convertedFile) {
          const fileName = settings.renamePattern
            .replace('{name}', file.name.split('.')[0])
            .replace('{index}', (index + 1).toString().padStart(3, '0'))
            .replace('{ext}', settings.outputFormat);
          
          zip.file(fileName, file.convertedFile);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      setZipSize(content.size);
      saveAs(content, `converted_images_${Date.now()}.zip`);
      toast.success('ZIP file downloaded successfully');
    } catch {
      toast.error('Failed to create ZIP file');
    }
  };

  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Clear all files
  const handleClearAll = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    setFiles([]);
    toast.success('All files cleared');
  };

  // Calculate total progress
  const totalProgress = files.length > 0 
    ? Math.round(files.reduce((sum, file) => sum + file.progress, 0) / files.length)
    : 0;

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  
  // Calculate overall statistics
  const overallStats = {
    ...calculateFileStatistics(files, batchProcessingTime),
    zipSize
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Image Converter</h1>
        <p className="text-muted-foreground">
          Convert, compress, and optimize your images with bulk processing support
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop images here or click to browse</h3>
            <p className="text-muted-foreground mb-4">
              Supports JPEG, PNG, WebP, AVIF, BMP, TIFF (max 50MB per file)
            </p>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Select Files
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                handleFileSelect(Array.from(e.target.files));
              }
            }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Conversion Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select
                value={settings.outputFormat}
                onValueChange={(value: string) => 
                  setSettings(prev => ({ ...prev, outputFormat: value as 'webp' | 'jpeg' | 'png' | 'avif' | 'bmp' | 'tiff' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="avif">AVIF</SelectItem>
                  <SelectItem value="bmp">BMP</SelectItem>
                  <SelectItem value="tiff">TIFF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quality: {Math.round(settings.quality * 100)}%</Label>
              <Slider
                value={[settings.quality * 100]}
                onValueChange={([value]) => 
                  setSettings(prev => ({ ...prev, quality: value / 100 }))
                }
                min={10}
                max={100}
                step={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Max Width</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={settings.maxWidth || ''}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      maxWidth: e.target.value ? parseInt(e.target.value) : undefined 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Height</Label>
                <Input
                  type="number"
                  placeholder="Auto"
                  value={settings.maxHeight || ''}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      maxHeight: e.target.value ? parseInt(e.target.value) : undefined 
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Preserve EXIF Data</Label>
              <Switch
                checked={settings.preserveExif}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, preserveExif: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Rename Pattern</Label>
              <Input
                value={settings.renamePattern}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, renamePattern: e.target.value }))
                }
                placeholder="{name}_{index}.{ext}"
              />
              <p className="text-xs text-muted-foreground">
                Use &#123;name&#125;, &#123;index&#125;, &#123;ext&#125; as placeholders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File List and Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {files.length} file{files.length !== 1 ? 's' : ''}
                  </Badge>
                  {completedCount > 0 && (
                    <Badge variant="default">
                      {completedCount} completed
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="destructive">
                      {errorCount} failed
                    </Badge>
                  )}
                  {processingCount > 0 && (
                    <Badge variant="secondary">
                      {processingCount} processing
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcessAll}
                    disabled={isProcessing || files.length === 0}
                    size="sm"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Process All
                  </Button>
                  <Button
                    onClick={handleDownloadZip}
                    disabled={completedCount === 0}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download ZIP
                  </Button>
                  <Button
                    onClick={handleClearAll}
                    disabled={files.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Statistics */}
          {completedCount > 0 && (
            <StatisticsPanel 
              statistics={overallStats} 
            />
          )}

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Files
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={file.id}>
                      <div className="p-4 flex items-center gap-4">
                        <Image
                          src={file.preview}
                          alt={file.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span>Original: {formatFileSize(file.size)}</span>
                              {file.metadata && (
                                <span>{file.metadata.originalDimensions.width} × {file.metadata.originalDimensions.height}</span>
                              )}
                              <span>{getFormatDisplayName(file.type.split('/')[1])}</span>
                            </div>
                            {file.status === 'completed' && file.convertedFile && (
                              <div className="flex items-center gap-4">
                                <span className="text-green-600">
                                  Converted: {formatFileSize(file.convertedFile.size)}
                                </span>
                                {file.metadata && (
                                  <span>{file.metadata.convertedDimensions.width} × {file.metadata.convertedDimensions.height}</span>
                                )}
                                <span>{getFormatDisplayName(settings.outputFormat)}</span>
                                <span className="text-green-600">
                                  {formatCompressionRatio(
                                    Math.round((1 - file.convertedFile.size / file.size) * 100)
                                  )} saved
                                </span>
                                {file.processingTime && (
                                  <span>{formatProcessingTime(file.processingTime)}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {file.status === 'processing' && (
                            <Progress value={file.progress} className="mt-2" />
                          )}
                          {file.status === 'error' && (
                            <p className="text-sm text-destructive mt-1">
                              {file.error}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              file.status === 'completed' ? 'default' :
                              file.status === 'error' ? 'destructive' :
                              file.status === 'processing' ? 'secondary' : 'outline'
                            }
                          >
                            {file.status}
                          </Badge>
                          {file.status === 'error' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcessFile(file.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {index < files.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;