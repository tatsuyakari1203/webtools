/**
 * Utility functions for AI Image Studio
 */

/**
 * Chuyển đổi file thành chuỗi base64
 */
export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part (remove data:image/...;base64, prefix)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Resize ảnh để khớp với kích thước gốc
 */
export const resizeImageToOriginal = (imageUrl: string, originalWidth: number, originalHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set a timeout to handle cases where the image might not load
    const timeoutId = setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, 10000); // 10 seconds timeout
    
    img.onload = () => {
      clearTimeout(timeoutId);
      
      try {
        // Create a canvas with the original dimensions
        const canvas = document.createElement('canvas');
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set image smoothing properties for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw the image onto the canvas, scaling it to match original dimensions
        ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
        
        // Convert canvas to data URL
        const resizedImageUrl = canvas.toDataURL('image/png');
        resolve(resizedImageUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load image for resizing'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Tải ảnh từ URL
 */
export const downloadImage = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};