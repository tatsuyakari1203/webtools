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
  // If it's a data URL, we can't compress it much, but we can validate it
  if (imageData.startsWith('data:image/')) {
    return imageData
  }
  // For blob URLs, just store the URL
  return imageData
}

export const addToGlobalHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const existingHistory = getGlobalHistory()
    const newItem: HistoryItem = {
      ...item,
      image: compressImageData(item.image),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    const updatedHistory = [newItem, ...existingHistory]
    
    // Start with a smaller limit and reduce if storage fails
    let maxItems = 50
    let success = false
    
    while (maxItems > 0 && !success) {
      const limitedHistory = updatedHistory.slice(0, maxItems)
      const dataToStore = JSON.stringify(limitedHistory)
      
      // Check if the data size is reasonable (< 4MB to be safe)
      const dataSize = getStorageSize(dataToStore)
      if (dataSize > 4 * 1024 * 1024) {
        maxItems = Math.floor(maxItems * 0.7)
        continue
      }
      
      try {
        localStorage.setItem(GLOBAL_HISTORY_KEY, dataToStore)
        success = true
        
        // If we had to reduce the limit, log it
        if (maxItems < 50) {
          console.warn(`Reduced history limit to ${maxItems} items due to storage constraints`)
        }
      } catch (storageError) {
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, reducing history size')
          // If storage fails due to quota, try with fewer items
          maxItems = Math.floor(maxItems * 0.7)
          if (maxItems < 5) {
            // If we can't even store 5 items, clear the history and try with just the new item
            try {
              localStorage.removeItem(GLOBAL_HISTORY_KEY)
              localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify([newItem]))
              success = true
              console.warn('Cleared history due to storage quota exceeded, keeping only the latest item')
            } catch (finalError) {
              console.error('Failed to store even a single item:', finalError)
              return null
            }
          }
        } else {
          console.error('Storage error:', storageError)
          maxItems = Math.floor(maxItems * 0.7)
          if (maxItems < 5) {
            return null
          }
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

export const cleanupOldHistory = (maxItems: number = 25) => {
  try {
    const history = getGlobalHistory()
    if (history.length <= maxItems) {
      return { cleaned: false, removedCount: 0 }
    }
    
    const cleanedHistory = history.slice(0, maxItems)
    localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(cleanedHistory))
    
    return {
      cleaned: true,
      removedCount: history.length - maxItems
    }
  } catch (error) {
    console.error('Error cleaning up history:', error)
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