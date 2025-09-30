/**
 * Utility functions for image processing in nano-banana tool
 */

/**
 * Detect image format from base64 string by analyzing the magic bytes
 */
export function detectImageFormat(base64String: string): string {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String
    
    if (!base64Data || base64Data.trim() === '') {
      return 'image/png' // Default fallback
    }

    // Decode first few bytes to check magic numbers
    const binaryString = atob(base64Data.substring(0, 20)) // Only decode first few bytes for efficiency
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Check magic bytes for different image formats
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png'
    }
    
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg'
    }
    
    // WebP: RIFF ... WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp'
    }
    
    // GIF: GIF87a or GIF89a
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'image/gif'
    }
    
    // BMP: BM
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return 'image/bmp'
    }
    
    // Default fallback to PNG
    return 'image/png'
    
  } catch (error) {
    console.warn('Failed to detect image format:', error)
    return 'image/png' // Safe fallback
  }
}

/**
 * Extract MIME type from data URL if present
 */
export function extractMimeTypeFromDataUrl(dataUrl: string): string | null {
  try {
    if (dataUrl.startsWith('data:')) {
      const mimeMatch = dataUrl.match(/^data:([^;]+)/)
      return mimeMatch ? mimeMatch[1] : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Convert base64 string to blob URL with correct MIME type detection
 */
export function base64ToBlobUrl(base64: string | { url?: string; data?: string } | unknown): string | null {
  try {
    // Handle different data types
    let base64String: string
    let detectedMimeType: string | null = null
    
    if (typeof base64 === 'string') {
      base64String = base64
      // Try to extract MIME type from data URL first
      detectedMimeType = extractMimeTypeFromDataUrl(base64String)
    } else if (base64 && typeof base64 === 'object') {
      // Handle case where base64 might be an object (e.g., from API response)
      const base64Obj = base64 as { url?: string; data?: string }
      if (base64Obj.url) {
        // If it's a URL object, we can't process it here
        console.error('Received URL object instead of base64 string:', base64)
        throw new Error('Invalid image format: URL object received')
      } else if (base64Obj.data) {
        base64String = base64Obj.data
      } else {
        base64String = String(base64)
      }
    } else {
      base64String = String(base64)
    }
    
    // Validate base64 string
    if (!base64String || base64String.trim() === '') {
      throw new Error('Empty base64 string')
    }
    
    // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String
    
    // Validate base64 format
    if (!base64Data || base64Data.trim() === '') {
      throw new Error('Invalid base64 format')
    }
    
    // Detect MIME type if not already extracted from data URL
    let mimeType = detectedMimeType || detectImageFormat(base64Data)
    
    // Fallback to PNG if format detection fails
    if (!mimeType || mimeType === 'application/octet-stream') {
      console.warn('Could not detect image format, falling back to image/png')
      mimeType = 'image/png'
    }
    
    // Convert to blob
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    
    return URL.createObjectURL(blob)
    
  } catch (error) {
    console.error('Failed to process image data:', error, 'Data:', base64)
    return null
  }
}

/**
 * Batch convert multiple base64 strings to blob URLs
 */
export function batchBase64ToBlobUrls(base64Array: (string | { url?: string; data?: string } | unknown)[]): string[] {
  return base64Array.map(base64 => base64ToBlobUrl(base64)).filter(Boolean) as string[]
}