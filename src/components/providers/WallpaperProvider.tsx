'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { 
  WallpaperContextType, 
  WallpaperConfig, 
  WallpaperItem, 
  WallpaperRotationSettings,
  DEFAULT_WALLPAPER_CONFIG,
  DEFAULT_ROTATION_SETTINGS 
} from '@/types/wallpaper'

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined)

const DEFAULT_WALLPAPER = ''
const STORAGE_KEY = 'wallpaper-config'
const LEGACY_URL_KEY = 'custom-wallpaper-url'
const LEGACY_BLUR_KEY = 'custom-wallpaper-blur'

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WallpaperConfig>(DEFAULT_WALLPAPER_CONFIG)
  const [isClient, setIsClient] = useState(false)
  const [rotationTimer, setRotationTimer] = useState<NodeJS.Timeout | null>(null)
  const hasRotatedOnRefresh = useRef(false)

  // Generate unique ID for wallpapers
  const generateId = () => `wallpaper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Load configuration from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    
    // Try to load new config format first
    const savedConfig = localStorage.getItem(STORAGE_KEY)
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
        return
      } catch (e) {
        console.warn('Failed to parse wallpaper config, falling back to legacy format')
      }
    }
    
    // Fallback to legacy format for backward compatibility
    const legacyUrl = localStorage.getItem(LEGACY_URL_KEY)
    const legacyBlur = localStorage.getItem(LEGACY_BLUR_KEY)
    
    if (legacyUrl) {
      const legacyWallpaper: WallpaperItem = {
        id: generateId(),
        url: legacyUrl,
        name: 'Legacy Wallpaper',
        addedAt: Date.now()
      }
      
      const migratedConfig: WallpaperConfig = {
        ...DEFAULT_WALLPAPER_CONFIG,
        wallpapers: [legacyWallpaper],
        currentWallpaperId: legacyWallpaper.id,
        enableBlur: legacyBlur === 'true'
      }
      
      setConfig(migratedConfig)
      saveConfig(migratedConfig)
      
      // Clean up legacy storage
      localStorage.removeItem(LEGACY_URL_KEY)
      localStorage.removeItem(LEGACY_BLUR_KEY)
    }
  }, [])

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: WallpaperConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
  }, [])

  // Setup rotation timer
  useEffect(() => {
    if (config.rotationSettings.mode === 'timer' && config.wallpapers.length > 1) {
      const interval = (config.rotationSettings.timerInterval || 30) * 60 * 1000 // Convert to milliseconds
      
      const timer = setInterval(() => {
        nextWallpaper()
      }, interval)
      
      setRotationTimer(timer)
      
      return () => {
        if (timer) clearInterval(timer)
      }
    } else {
      if (rotationTimer) {
        clearInterval(rotationTimer)
        setRotationTimer(null)
      }
    }
  }, [config.rotationSettings, config.wallpapers.length])

  // Get current wallpaper
  const currentWallpaper = config.wallpapers.find(w => w.id === config.currentWallpaperId) || null
  const wallpaperUrl = currentWallpaper?.url || ''

  // Wallpaper management functions
  const addWallpaper = useCallback((url: string, name?: string) => {
    const newWallpaper: WallpaperItem = {
      id: generateId(),
      url,
      name: name || `Wallpaper ${config.wallpapers.length + 1}`,
      addedAt: Date.now()
    }
    
    const newConfig = {
      ...config,
      wallpapers: [...config.wallpapers, newWallpaper],
      currentWallpaperId: config.currentWallpaperId || newWallpaper.id
    }
    
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [config, saveConfig])

  const removeWallpaper = useCallback((id: string) => {
    const newWallpapers = config.wallpapers.filter(w => w.id !== id)
    let newCurrentId = config.currentWallpaperId
    
    if (config.currentWallpaperId === id) {
      newCurrentId = newWallpapers.length > 0 ? newWallpapers[0].id : null
    }
    
    const newConfig = {
      ...config,
      wallpapers: newWallpapers,
      currentWallpaperId: newCurrentId
    }
    
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [config, saveConfig])

  const updateWallpaper = useCallback((id: string, updates: Partial<WallpaperItem>) => {
    const newWallpapers = config.wallpapers.map(w => 
      w.id === id ? { ...w, ...updates } : w
    )
    
    const newConfig = {
      ...config,
      wallpapers: newWallpapers
    }
    
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [config, saveConfig])

  const setCurrentWallpaper = useCallback((id: string) => {
    const newConfig = {
      ...config,
      currentWallpaperId: id
    }
    
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [config, saveConfig])

  const nextWallpaper = useCallback(() => {
    if (config.wallpapers.length <= 1) return
    
    const currentIndex = config.wallpapers.findIndex(w => w.id === config.currentWallpaperId)
    let nextIndex
    
    if (config.rotationSettings.randomOrder) {
      do {
        nextIndex = Math.floor(Math.random() * config.wallpapers.length)
      } while (nextIndex === currentIndex && config.wallpapers.length > 1)
    } else {
      nextIndex = (currentIndex + 1) % config.wallpapers.length
    }
    
    setCurrentWallpaper(config.wallpapers[nextIndex].id)
  }, [config, setCurrentWallpaper])

  const previousWallpaper = useCallback(() => {
    if (config.wallpapers.length <= 1) return
    
    const currentIndex = config.wallpapers.findIndex(w => w.id === config.currentWallpaperId)
    const prevIndex = currentIndex <= 0 ? config.wallpapers.length - 1 : currentIndex - 1
    
    setCurrentWallpaper(config.wallpapers[prevIndex].id)
  }, [config, setCurrentWallpaper])

  // Handle refresh rotation - only run once when client loads
  useEffect(() => {
    if (isClient && config.rotationSettings.mode === 'refresh' && config.wallpapers.length > 1 && !hasRotatedOnRefresh.current) {
      // Only rotate if we have a current wallpaper (config is loaded)
      if (config.currentWallpaperId) {
        hasRotatedOnRefresh.current = true
        
        // Manually implement next wallpaper logic to avoid dependency issues
        const currentIndex = config.wallpapers.findIndex(w => w.id === config.currentWallpaperId)
        let nextIndex
        
        if (config.rotationSettings.randomOrder) {
          do {
            nextIndex = Math.floor(Math.random() * config.wallpapers.length)
          } while (nextIndex === currentIndex && config.wallpapers.length > 1)
        } else {
          nextIndex = (currentIndex + 1) % config.wallpapers.length
        }
        
        const newConfig = {
          ...config,
          currentWallpaperId: config.wallpapers[nextIndex].id
        }
        
        setConfig(newConfig)
        saveConfig(newConfig)
      }
    }
  }, [isClient, config.rotationSettings.mode, config.wallpapers.length, config.currentWallpaperId, config.rotationSettings.randomOrder, saveConfig]) // Safe dependencies

  const updateRotationSettings = useCallback((settings: Partial<WallpaperRotationSettings>) => {
    const newConfig = {
      ...config,
      rotationSettings: { ...config.rotationSettings, ...settings }
    }
    
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [config, saveConfig])

  const setEnableBlur = useCallback((enable: boolean) => {
    const newConfig = {
      ...config,
      enableBlur: enable
    }
    
    setConfig(newConfig)
    saveConfig(newConfig)
  }, [config, saveConfig])

  // Legacy support functions
  const setWallpaperUrl = useCallback((url: string) => {
    if (url) {
      addWallpaper(url, 'Custom Wallpaper')
    }
  }, [addWallpaper])

  const resetToDefault = useCallback(() => {
    const newConfig = DEFAULT_WALLPAPER_CONFIG
    setConfig(newConfig)
    saveConfig(newConfig)
    localStorage.removeItem(LEGACY_URL_KEY)
    localStorage.removeItem(LEGACY_BLUR_KEY)
  }, [saveConfig])

  const contextValue: WallpaperContextType = {
    // Current wallpaper
    wallpaperUrl: isClient ? wallpaperUrl : '',
    currentWallpaper: isClient ? currentWallpaper : null,
    
    // Wallpaper management
    wallpapers: isClient ? config.wallpapers : [],
    addWallpaper,
    removeWallpaper,
    updateWallpaper,
    setCurrentWallpaper,
    
    // Rotation
    rotationSettings: isClient ? config.rotationSettings : DEFAULT_ROTATION_SETTINGS,
    updateRotationSettings,
    nextWallpaper,
    previousWallpaper,
    
    // Blur and other settings
    enableBlur: isClient ? config.enableBlur : false,
    setEnableBlur,
    
    // Legacy support
    setWallpaperUrl,
    resetToDefault
  }

  return (
    <WallpaperContext.Provider value={contextValue}>
      {children}
    </WallpaperContext.Provider>
  )
}

export function useWallpaper() {
  const context = useContext(WallpaperContext)
  if (context === undefined) {
    throw new Error('useWallpaper must be used within a WallpaperProvider')
  }
  return context
}