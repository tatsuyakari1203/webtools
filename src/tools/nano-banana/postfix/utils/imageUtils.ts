import { ImageDimensions } from '../types'

/**
 * Get image dimensions from a File object
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Get image dimensions from a base64 string
 */
export function getImageDimensionsFromBase64(base64: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image from base64'))
    }
    
    img.src = `data:image/png;base64,${base64}`
  })
}

/**
 * Scale an image (base64) to target dimensions
 */
export function scaleImageToSize(base64: string, targetDimensions: ImageDimensions): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // Create canvas with target dimensions
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        canvas.width = targetDimensions.width
        canvas.height = targetDimensions.height
        
        // Draw scaled image
        ctx.drawImage(img, 0, 0, targetDimensions.width, targetDimensions.height)
        
        // Convert back to base64
        const scaledBase64 = canvas.toDataURL('image/png').split(',')[1]
        resolve(scaledBase64)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image for scaling'))
    }
    
    img.src = `data:image/png;base64,${base64}`
  })
}

/**
 * Convert base64 to blob URL for display
 */
export function base64ToBlobUrl(base64: string): string {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'image/png' })
  return URL.createObjectURL(blob)
}

/**
 * Check if two dimensions are equal
 */
export function dimensionsEqual(dim1: ImageDimensions, dim2: ImageDimensions): boolean {
  return dim1.width === dim2.width && dim1.height === dim2.height
}

/**
 * Calculate aspect ratio
 */
export function getAspectRatio(dimensions: ImageDimensions): number {
  return dimensions.width / dimensions.height
}

/**
 * Scale dimensions while maintaining aspect ratio
 */
export function scaleToFit(
  sourceDimensions: ImageDimensions, 
  targetDimensions: ImageDimensions, 
  maintainAspectRatio: boolean = true
): ImageDimensions {
  if (!maintainAspectRatio) {
    return targetDimensions
  }
  
  const sourceRatio = getAspectRatio(sourceDimensions)
  const targetRatio = getAspectRatio(targetDimensions)
  
  if (sourceRatio > targetRatio) {
    // Source is wider, fit to width
    return {
      width: targetDimensions.width,
      height: Math.round(targetDimensions.width / sourceRatio)
    }
  } else {
    // Source is taller, fit to height
    return {
      width: Math.round(targetDimensions.height * sourceRatio),
      height: targetDimensions.height
    }
  }
}