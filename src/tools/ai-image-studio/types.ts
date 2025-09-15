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
  aspectRatio?: "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21";
  numImages: number;
  maxImages: number;
  enableSafetyChecker: boolean;
  seed?: number;
  selectedModel: 'seedream' | 'flux-kontext';
  guidanceScale?: number;
  safetyTolerance?: string;
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

export interface FluxKontextRequest {
  prompt: string;
  image_url?: string;
  image_base64?: string;
  aspect_ratio?: "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21";
  num_images?: number;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
  safety_tolerance?: string;
  guidance_scale?: number;
  seed?: number;
  enhance_prompt?: boolean;
}

export interface FluxKontextResponse {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  prompt: string;
  seed: number;
  has_nsfw_concepts: boolean[];
  timings: Record<string, number>;
}

export interface ImageUploadResult {
  url: string;
  file: File;
}
