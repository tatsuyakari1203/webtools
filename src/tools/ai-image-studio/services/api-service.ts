import { SeedreamRequest, SeedreamResponse, FluxKontextRequest, FluxKontextResponse } from '../types';
import { resizeImageToOriginal } from '../utils';

/**
 * Service class để xử lý các API request liên quan đến AI Image Studio
 */
export class ApiService {
  /**
   * Xử lý request tạo ảnh dựa trên model được chọn
   */
  async processImages({
    prompt,
    base64Images,
    imageUrls,
    selectedModel,
    imageSize,
    numImages,
    outputImages,
    enableSafetyChecker,
    aspectRatio,
    safetyTolerance,
    guidanceScale,
    enhancePrompt,
    outputFormat,
    seed
  }: {
    prompt: string;
    base64Images: string[];
    imageUrls: string[];
    selectedModel: 'seedream' | 'flux-kontext';
    imageSize: { width: number; height: number };
    numImages: number;
    outputImages: number; // Output images setting for Seedream
    enableSafetyChecker: boolean;
    aspectRatio: "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21";
    safetyTolerance: string;
    guidanceScale: number;
    enhancePrompt: boolean;
    outputFormat: 'jpeg' | 'png';
    seed: number;
  }): Promise<string[]> {
    if (!prompt.trim()) {
      throw new Error('Please enter a prompt');
    }

    if (base64Images.length === 0) {
      throw new Error('Please upload at least one image');
    }

    let response;
    
    if (selectedModel === 'seedream') {
      // Use base64 images for the API request
      const requestData: SeedreamRequest = {
        prompt,
        images: base64Images,
        image_size: imageSize,
        num_images: numImages,
        max_images: outputImages,
        sync_mode: true,
        seed,
        enable_safety_checker: enableSafetyChecker
      };

      response = await fetch('/api/ai-image-generation/models/seedream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    } else if (selectedModel === 'flux-kontext') {
      // Only use the first image for Flux Kontext
      if (imageUrls.length === 0) {
        throw new Error('Please upload an image');
      }
      

      
      // Sử dụng ảnh gốc không resize để giữ chất lượng tốt nhất
      let imageBase64 = base64Images[0];
      
      // Đảm bảo định dạng base64 đúng
      if (imageBase64 && !imageBase64.startsWith('data:')) {
        imageBase64 = `data:image/png;base64,${imageBase64}`;
      }
      
      const requestData: FluxKontextRequest = {
        prompt,
        image_base64: imageBase64,
        aspect_ratio: aspectRatio as "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21" | undefined,
        num_images: numImages,
        sync_mode: true,
        seed,
        safety_tolerance: safetyTolerance,
        guidance_scale: guidanceScale,
        enhance_prompt: enhancePrompt || false,
        output_format: (outputFormat || 'jpeg') as 'jpeg' | 'png'
      };
      


      response = await fetch('/api/ai-image-generation/models/flux-kontext', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    } else {
      throw new Error('Invalid model selected');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process images');
    }

    let resultImageUrls: string[] = [];
    
    if (selectedModel === 'seedream') {
      const result: SeedreamResponse = await response.json();
      // Get the result images URLs
      resultImageUrls = result.images.map(img => img.url);
    } else if (selectedModel === 'flux-kontext') {
      const result: FluxKontextResponse = await response.json();
      // Get the result images URLs
      resultImageUrls = result.images.map(img => img.url);
    }
    
    return resultImageUrls;
  }

  /**
   * Xử lý request nâng cao prompt
   */
  async enhancePrompt({
    prompt,
    category = 'image-editing',
    model,
    image
  }: {
    prompt: string;
    category?: string;
    model: string;
    image?: string;
  }): Promise<string> {
    if (!prompt.trim()) {
      throw new Error('Please enter a prompt first');
    }

    const response = await fetch('/api/ai-image-generation/enhance-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        category,
        model,
        ...(image && { image })
      })
    });

    const data = await response.json();

    if (data.success) {
      return data.enhanced_prompt;
    } else {
      throw new Error(data.error || 'Failed to enhance prompt');
    }
  }

  /**
   * Resize ảnh để khớp với kích thước gốc
   * Sử dụng hàm từ utils.ts
   */
  resizeImageToOriginal(imageUrl: string, originalWidth: number, originalHeight: number): Promise<string> {
    return resizeImageToOriginal(imageUrl, originalWidth, originalHeight);
  }
}

// Export một instance của service để sử dụng trong ứng dụng
export const apiService = new ApiService();