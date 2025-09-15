import { toast } from 'sonner';
import { convertToBase64 } from './utils';

/**
 * Calculates the optimal image size based on the original dimensions
 * @param width Original image width
 * @param height Original image height
 * @returns Optimal image size object
 */
export const calculateOptimalSize = (width: number, height: number) => {
  const maxSize = 4096;
  const minSize = 1024;
  
  // Calculate aspect ratio
  const aspectRatio = width / height;
  
  let newWidth, newHeight;
  
  if (aspectRatio >= 1) {
    // Landscape or square
    newWidth = Math.min(maxSize, Math.max(minSize, width));
    newHeight = Math.round(newWidth / aspectRatio);
    
    // Ensure height is within bounds
    if (newHeight > maxSize) {
      newHeight = maxSize;
      newWidth = Math.round(newHeight * aspectRatio);
    } else if (newHeight < minSize) {
      newHeight = minSize;
      newWidth = Math.round(newHeight * aspectRatio);
    }
  } else {
    // Portrait
    newHeight = Math.min(maxSize, Math.max(minSize, height));
    newWidth = Math.round(newHeight * aspectRatio);
    
    // Ensure width is within bounds
    if (newWidth > maxSize) {
      newWidth = maxSize;
      newHeight = Math.round(newWidth / aspectRatio);
    } else if (newWidth < minSize) {
      newWidth = minSize;
      newHeight = Math.round(newWidth / aspectRatio);
    }
  }
  
  // Round to nearest multiple of 64 for better compatibility
  newWidth = Math.round(newWidth / 64) * 64;
  newHeight = Math.round(newHeight / 64) * 64;
  
  return { width: newWidth, height: newHeight };
};

/**
 * Interface for the result of processed files
 */
export interface ProcessedFilesResult {
  imageUrls: string[];
  base64Images: string[];
  imageSize: { width: number; height: number };
  originalImageSize: { width: number; height: number } | null;
}

/**
 * Processes uploaded image files, validates them, and converts to base64
 * @param files Array of files to process
 * @param currentImageUrls Current image URLs in state
 * @param sizeMode Current size mode setting
 * @returns Object containing processed image data
 */
export const processFiles = async (
  files: File[], 
  currentImageUrls: string[], 
  sizeMode: 'auto' | 'square' | 'portrait' | 'landscape' | 'wide' | 'ultrawide' | 'custom'
): Promise<ProcessedFilesResult | null> => {
  if (files.length === 0) return null;

  // Validate file types and sizes
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not a valid image file`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error(`${file.name} is too large (max 10MB)`);
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) return null;

  // Check total image limit
  if (currentImageUrls.length + validFiles.length > 10) {
    toast.error('Maximum 10 images allowed');
    return null;
  }

  // Process each file
  const newImageUrls: string[] = [];
  const newBase64Images: string[] = [];
  let firstImageDimensions: { width: number; height: number } | null = null;

  for (const file of validFiles) {
    try {
      const base64 = await convertToBase64(file);
      const imageUrl = URL.createObjectURL(file);
      
      // Get image dimensions for each image to calculate optimal size
      if (sizeMode === 'auto') {
        const img = new Image();
        const imageDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
          };
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Use the first image dimensions or update if this is the first image being added
        if (!firstImageDimensions) {
          firstImageDimensions = imageDimensions;
        }
      }
      
      newImageUrls.push(imageUrl);
      newBase64Images.push(base64);
    } catch (error) {
      // Xử lý lỗi im lặng
      toast.error(`Failed to process ${file.name}`);
    }
  }

  // Calculate optimal size if we have the first image dimensions and auto mode is selected
  let newImageSize = { width: 1024, height: 1024 }; // Default size
  if (firstImageDimensions && sizeMode === 'auto') {
    newImageSize = calculateOptimalSize(firstImageDimensions.width, firstImageDimensions.height);
  }

  toast.success(`Added ${newImageUrls.length} image${newImageUrls.length > 1 ? 's' : ''}`);

  return {
    imageUrls: newImageUrls,
    base64Images: newBase64Images,
    imageSize: newImageSize,
    originalImageSize: firstImageDimensions
  };
};