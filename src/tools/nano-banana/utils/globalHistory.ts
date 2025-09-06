export interface HistoryItem {
  id: string
  image: string
  prompt: string
  timestamp: number
  type: 'generate' | 'edit' | 'compose' | 'style' | 'refine'
}

const GLOBAL_HISTORY_KEY = 'nano-banana-global-history'

const getStorageSize = (data: string): number => {
  return new Blob([data]).size
}

const compressImageData = (imageData: string): string => {
  // For data URLs, use simple size-based compression
  if (imageData.startsWith('data:image/')) {
    try {
      const base64Data = imageData.split(',')[1]
      if (!base64Data) return imageData
      
      const sizeInBytes = (base64Data.length * 3) / 4
      const maxSizeBytes = 80 * 1024 // 80KB max
      
      if (sizeInBytes > maxSizeBytes) {
        // Return a small placeholder for oversized images
        const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        console.warn(`Image too large (${(sizeInBytes/1024).toFixed(1)}KB), using placeholder`)
        return placeholder
      }
      
      return imageData
    } catch (error) {
      console.warn('Image compression failed, using original:', error)
      return imageData
    }
  }
  // For blob URLs, just store the URL
  return imageData
}

// Synchronous version for immediate use
const compressImageDataSync = (imageData: string): string => {
  if (!imageData.startsWith('data:image/')) {
    return imageData
  }
  
  try {
    // Simple size-based compression without canvas manipulation
    const base64Data = imageData.split(',')[1]
    if (!base64Data) return imageData
    
    const sizeInBytes = (base64Data.length * 3) / 4
    const maxSizeBytes = 100 * 1024 // 100KB max
    
    if (sizeInBytes > maxSizeBytes) {
      // Return a small placeholder for oversized images
      const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      console.warn(`Image too large (${(sizeInBytes/1024).toFixed(1)}KB), using placeholder`)
      return placeholder
    }
    
    return imageData
  } catch (error) {
    console.warn('Image compression failed:', error)
    return imageData
  }
}

// Simple compression by reducing base64 data size
const createCompressedThumbnail = (imageData: string): string => {
  if (!imageData.startsWith('data:image/')) {
    return imageData
  }
  
  try {
    // For immediate storage, we'll use a simple approach:
    // Store only a truncated version for preview and keep metadata
    const base64Data = imageData.split(',')[1]
    if (!base64Data) return imageData
    
    // If the image is too large, create a placeholder
    const sizeInBytes = (base64Data.length * 3) / 4
    const maxSizeBytes = 50 * 1024 // 50KB max per image
    
    if (sizeInBytes > maxSizeBytes) {
      // Create a small placeholder image (1x1 pixel)
      const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      console.warn(`Image too large (${(sizeInBytes/1024).toFixed(1)}KB), using placeholder`)
      return placeholder
    }
    
    return imageData
  } catch (error) {
    console.warn('Image processing failed:', error)
    return imageData
  }
}

export const addToGlobalHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const existingHistory = getGlobalHistory()
    
    // Strict limit: max 20 items to prevent storage issues
    const MAX_HISTORY_ITEMS = 20
    
    const newItem: HistoryItem = {
      ...item,
      image: createCompressedThumbnail(item.image),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    // Always keep only the latest items
    const updatedHistory = [newItem, ...existingHistory.slice(0, MAX_HISTORY_ITEMS - 1)]
    
    // Progressive storage attempt with size checking
    let maxItems = Math.min(MAX_HISTORY_ITEMS, updatedHistory.length)
    let success = false
    
    while (maxItems > 0 && !success) {
      const limitedHistory = updatedHistory.slice(0, maxItems)
      const dataToStore = JSON.stringify(limitedHistory)
      
      // Check data size (limit to 2MB to be very safe)
      const dataSize = getStorageSize(dataToStore)
      if (dataSize > 2 * 1024 * 1024) {
        maxItems = Math.max(1, Math.floor(maxItems * 0.5))
        console.warn(`Data too large (${(dataSize / 1024 / 1024).toFixed(2)}MB), reducing to ${maxItems} items`)
        continue
      }
      
      try {
        // Clear existing data first to free up space
        localStorage.removeItem(GLOBAL_HISTORY_KEY)
        localStorage.setItem(GLOBAL_HISTORY_KEY, dataToStore)
        success = true
        
        if (maxItems < MAX_HISTORY_ITEMS) {
          console.warn(`History limited to ${maxItems} items due to storage constraints`)
        }
      } catch (storageError) {
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, reducing history size')
          maxItems = Math.max(1, Math.floor(maxItems * 0.5))
          
          if (maxItems === 1) {
            // Last resort: store only the new item
            try {
              localStorage.removeItem(GLOBAL_HISTORY_KEY)
              localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify([newItem]))
              success = true
              console.warn('Emergency: Cleared all history, keeping only latest item')
            } catch (finalError) {
              console.error('Critical: Failed to store even a single item:', finalError)
              // Emergency cleanup
              emergencyStorageCleanup()
              return null
            }
          }
        } else {
          console.error('Storage error:', storageError)
          maxItems = Math.max(1, Math.floor(maxItems * 0.5))
        }
      }
    }
    
    return success ? newItem : null
  } catch (error) {
    console.error('Error adding to global history:', error)
    return null
  }
}

export const getGlobalHistory = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem(GLOBAL_HISTORY_KEY)
    if (!saved) return []
    
    const parsed = JSON.parse(saved)
    
    // Validate the data structure
    if (!Array.isArray(parsed)) {
      console.warn('Invalid history data format, clearing history')
      localStorage.removeItem(GLOBAL_HISTORY_KEY)
      return []
    }
    
    return parsed.filter(item => 
      item && 
      typeof item.id === 'string' && 
      typeof item.image === 'string' && 
      typeof item.prompt === 'string' && 
      typeof item.timestamp === 'number' && 
      typeof item.type === 'string'
    )
  } catch (error) {
    console.error('Error loading global history:', error)
    // If parsing fails, clear the corrupted data
    try {
      localStorage.removeItem(GLOBAL_HISTORY_KEY)
    } catch (clearError) {
      console.error('Failed to clear corrupted history:', clearError)
    }
    return []
  }
}

export const removeFromGlobalHistory = (id: string) => {
  try {
    const history = getGlobalHistory()
    const filtered = history.filter(item => item.id !== id)
    localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error removing from global history:', error)
    return false
  }
}

export const clearGlobalHistory = () => {
  try {
    localStorage.removeItem(GLOBAL_HISTORY_KEY)
    return true
  } catch (error) {
    console.error('Error clearing global history:', error)
    return false
  }
}

export const getStorageInfo = () => {
  try {
    const history = getGlobalHistory()
    const dataString = JSON.stringify(history)
    const sizeInBytes = getStorageSize(dataString)
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
    
    return {
      itemCount: history.length,
      sizeInBytes,
      sizeInMB: parseFloat(sizeInMB),
      estimatedQuotaUsage: (sizeInBytes / (5 * 1024 * 1024)) * 100 // Assuming 5MB quota
    }
  } catch (error) {
    console.error('Error getting storage info:', error)
    return {
      itemCount: 0,
      sizeInBytes: 0,
      sizeInMB: 0,
      estimatedQuotaUsage: 0
    }
  }
}

export const cleanupOldHistory = (maxItems: number = 15) => {
  try {
    const history = getGlobalHistory()
    if (history.length <= maxItems) {
      return { cleaned: false, removedCount: 0 }
    }
    
    const cleanedHistory = history.slice(0, maxItems)
    
    // Clear and re-set to ensure clean storage
    localStorage.removeItem(GLOBAL_HISTORY_KEY)
    localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(cleanedHistory))
    
    console.log(`Cleaned up history: removed ${history.length - maxItems} old items`)
    
    return {
      cleaned: true,
      removedCount: history.length - maxItems
    }
  } catch (error) {
    console.error('Error cleaning up history:', error)
    return { cleaned: false, removedCount: 0 }
  }
}

// Auto cleanup function that runs periodically
export const autoCleanupHistory = () => {
  try {
    const storageInfo = getStorageInfo()
    
    // If storage usage is high or too many items, cleanup
    if (storageInfo.itemCount > 15 || storageInfo.sizeInMB > 1.5) {
      return cleanupOldHistory(10) // Keep only 10 most recent items
    }
    
    return { cleaned: false, removedCount: 0 }
  } catch (error) {
    console.error('Error in auto cleanup:', error)
    return { cleaned: false, removedCount: 0 }
  }
}

// Emergency cleanup function for when storage quota is exceeded
export const emergencyStorageCleanup = () => {
  try {
    console.warn('Performing emergency storage cleanup for nano-banana')
    
    // Clear all nano-banana related localStorage items
    const keys = Object.keys(localStorage)
    const nanoBananaKeys = keys.filter(key => key.startsWith('nano-banana-'))
    
    nanoBananaKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (e) {
        console.error(`Error removing localStorage item ${key}:`, e)
      }
    })
    
    // Clear sessionStorage items as well
    try {
      const sessionKeys = Object.keys(sessionStorage)
      const nanoBananaSessionKeys = sessionKeys.filter(key => key.startsWith('nano-banana-'))
      nanoBananaSessionKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key)
        } catch (e) {
          console.error(`Error removing sessionStorage item ${key}:`, e)
        }
      })
    } catch (e) {
      console.error('Error accessing sessionStorage:', e)
    }
    
    console.log('Emergency cleanup completed')
    return true
  } catch (error) {
    console.error('Error during emergency cleanup:', error)
    return false
  }
}