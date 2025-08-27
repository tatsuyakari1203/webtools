export interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  convertedFile?: Blob;
  error?: string;
  // Enhanced metadata
  metadata?: ImageMetadata;
  processingTime?: number; // in milliseconds
}

export interface ConversionSettings {
  outputFormat: 'webp' | 'jpeg' | 'png' | 'avif' | 'bmp' | 'tiff';
  quality: number; // 0.1 - 1.0
  maxWidth?: number;
  maxHeight?: number;
  preserveExif: boolean;
  renamePattern: string; // e.g., "{name}_{index}.{ext}"
}

export interface ProcessingResult {
  success: boolean;
  file?: Blob;
  error?: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  // Enhanced metadata
  metadata?: ImageMetadata;
  processingTime?: number;
}

export interface ProcessingTask {
  id: string;
  file: File;
  settings: ConversionSettings;
  resolve: (result: ProcessingResult) => void;
  reject: (error: Error) => void;
}

export interface WorkerMessage {
  type: 'success' | 'error' | 'progress';
  fileId: string;
  result?: Blob;
  error?: string;
  progress?: number;
  stats?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

export interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  accept: string;
  maxSize: number;
  disabled?: boolean;
}

export interface FileItemProps {
  imageFile: ImageFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export interface SettingsPanelProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
}

export interface BatchControlsProps {
  files: ImageFile[];
  onStartAll: () => void;
  onClearAll: () => void;
  onDownloadZip: () => void;
  isProcessing: boolean;
}

export interface ProgressTrackerProps {
  files: ImageFile[];
  totalProgress: number;
}

// Enhanced metadata interfaces
export interface ImageMetadata {
  originalFormat: string;
  convertedFormat: string;
  originalDimensions: {
    width: number;
    height: number;
  };
  convertedDimensions: {
    width: number;
    height: number;
  };
  originalSize: number;
  convertedSize: number;
  compressionRatio: number;
  processingTime: number;
}

// Statistics interfaces
export interface FileStatistics {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  processingFiles: number;
  totalOriginalSize: number;
  totalConvertedSize: number;
  totalSavedSize: number;
  averageCompressionRatio: number;
  totalProcessingTime: number; // Sum of individual file processing times
  actualProcessingTime?: number; // Actual elapsed time for batch processing
  parallelEfficiency?: number; // Ratio of actual time vs sum of individual times
  zipSize?: number;
}

// Statistics panel props
export interface StatisticsPanelProps {
  statistics: FileStatistics;
}

// Format utilities
export interface FormatOptions {
  precision?: number;
  showUnit?: boolean;
  compact?: boolean;
}