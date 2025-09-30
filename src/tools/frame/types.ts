import type { Tool } from '@/lib/tools-registry';

export interface FrameProps {
  tool: Tool;
}

// EXIF Data Types
export interface ExifData {
  camera: {
    make: string;
    model: string;
  };
  settings: {
    aperture: string;
    shutterSpeed: string;
    iso: number;
    focalLength: string;
  };
  datetime: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
}

// Frame Configuration Types
export interface FrameConfig {
  style: 'classic' | 'modern' | 'minimal' | 'vintage' | 'polaroid';
  color: string;
  borderWidth: number;
  cornerRadius: number;
  showMetadata: boolean;
  showTitle: boolean;
  titleText: string;
  fontSize: number;
  textColor: 'auto' | 'black' | 'white' | 'gray' | 'custom';
  exportFormat: 'jpeg' | 'png' | 'webp';
  exportQuality: number;
  exportWidth: number;
  
  // Metadata Bar Configuration
  barPosition: 'top' | 'bottom' | 'both';
  customCameraBrand?: string;
  customAperture?: string;
  customShutter?: string;
  customISO?: string;
  customFocal?: string;
  photographerName?: string;
  customDate?: string;
}

// Processing State Types
export interface ProcessingState {
  isLoading: boolean;
  progress: number;
  error: string | null;
  stage: 'upload' | 'exif' | 'render' | 'export' | 'complete';
}

// Image Types
export interface ImageData {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  imageData: string; // base64 or blob URL
  uploadedAt: Date;
}

// Camera Brand Types
export type CameraBrand = 
  | 'Canon' 
  | 'Nikon' 
  | 'Sony' 
  | 'Fujifilm' 
  | 'Olympus' 
  | 'Panasonic' 
  | 'Leica' 
  | 'Pentax' 
  | 'Hasselblad' 
  | 'PhaseOne' 
  | 'Apple' 
  | 'Samsung' 
  | 'Google' 
  | 'Huawei' 
  | 'Xiaomi' 
  | 'OnePlus' 
  | 'Other';

// Component Props Types
export interface ImageUploadProps {
  onImageUpload: (image: ImageData) => void;
  onExifData: (exif: ExifData) => void;
  isProcessing: boolean;
}

export interface SettingsPanelProps {
  config: FrameConfig;
  exifData: ExifData | null;
  onConfigChange: (config: FrameConfig) => void;
  onExport: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export interface FrameEditorProps {
  imageData: ImageData | null;
  exifData: ExifData | null;
  config: FrameConfig;
  onExport: (canvas?: HTMLCanvasElement) => void;
  isProcessing: boolean;
}

// Main Frame State
export interface FrameState {
  imageData: ImageData | null;
  exifData: ExifData | null;
  config: FrameConfig;
  isProcessing: boolean;
  error: string | null;
}
