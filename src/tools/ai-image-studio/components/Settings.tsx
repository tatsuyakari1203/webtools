'use client';

// Preset sizes for common use cases
export const PRESET_SIZES = {
  'auto': { width: 0, height: 0, label: 'Auto (Keep Original Ratio)' },
  'square': { width: 1280, height: 1280, label: 'Square (1:1)' },
  'portrait': { width: 1024, height: 1536, label: 'Portrait (2:3)' },
  'landscape': { width: 1536, height: 1024, label: 'Landscape (3:2)' },
  'wide': { width: 1792, height: 1024, label: 'Wide (16:9)' },
  'ultrawide': { width: 2048, height: 1152, label: 'Ultra Wide (16:8)' }
};

// Calculate optimal size while maintaining aspect ratio and staying within limits
export const calculateOptimalSize = (originalWidth: number, originalHeight: number) => {
  const maxSize = 4096;
  const minSize = 1024;
  
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  let width, height;
  
  if (aspectRatio >= 1) {
    // Landscape or square
    width = Math.min(maxSize, Math.max(minSize, originalWidth));
    height = Math.round(width / aspectRatio);
    
    // Ensure height is within bounds
    if (height > maxSize) {
      height = maxSize;
      width = Math.round(height * aspectRatio);
    } else if (height < minSize) {
      height = minSize;
      width = Math.round(height * aspectRatio);
    }
  } else {
    // Portrait
    height = Math.min(maxSize, Math.max(minSize, originalHeight));
    width = Math.round(height * aspectRatio);
    
    // Ensure width is within bounds
    if (width > maxSize) {
      width = maxSize;
      height = Math.round(width / aspectRatio);
    } else if (width < minSize) {
      width = minSize;
      height = Math.round(width / aspectRatio);
    }
  }
  
  // Round to nearest multiple of 64 for better compatibility
  width = Math.round(width / 64) * 64;
  height = Math.round(height / 64) * 64;
  
  return { width, height };
};