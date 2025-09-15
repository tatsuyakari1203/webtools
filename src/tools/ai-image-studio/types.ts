export interface AIImageStudioProps {
  tool: unknown;
}

export interface AIImageStudioState {
  prompt: string;
  uploadedImages: File[];
  imageUrls: string[];
  base64Images: string[];
  resultImages: string[];
  isProcessing: boolean;
  error: string | null;
  imageSize: {
    width: number;
    height: number;
  };
  numImages: number;
  maxImages: number;
  enableSafetyChecker: boolean;
  seed?: number;
}

export interface SeedreamRequest {
  prompt: string;
  image_urls?: string[];
  images?: string[];
  image_size?: {
    width: number;
    height: number;
  };
  num_images?: number;
  max_images?: number;
  seed?: number;
  sync_mode?: boolean;
  enable_safety_checker?: boolean;
}

export interface SeedreamResponse {
  images: Array<{
    url: string;
  }>;
  seed: number;
}

export interface ImageUploadResult {
  url: string;
  file: File;
}
