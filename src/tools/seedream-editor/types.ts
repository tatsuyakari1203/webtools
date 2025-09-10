export interface SeedreamEditorProps {
  tool: unknown;
}

export interface SeedreamEditorState {
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
  seed?: number;
  sync_mode?: boolean;
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
