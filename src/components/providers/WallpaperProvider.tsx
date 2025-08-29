'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface WallpaperContextType {
  wallpaperUrl: string
  setWallpaperUrl: (url: string) => void
  resetToDefault: () => void
  enableBlur: boolean
  setEnableBlur: (enable: boolean) => void
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined)

const DEFAULT_WALLPAPER = ''

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [wallpaperUrl, setWallpaperUrlState] = useState<string>(DEFAULT_WALLPAPER)
  const [enableBlur, setEnableBlurState] = useState<boolean>(false)
  const [isClient, setIsClient] = useState(false)

  // Load wallpaper URL and blur setting from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    const savedWallpaper = localStorage.getItem('custom-wallpaper-url')
    if (savedWallpaper) {
      setWallpaperUrlState(savedWallpaper)
    }
    const savedBlur = localStorage.getItem('custom-wallpaper-blur')
    if (savedBlur) {
      setEnableBlurState(savedBlur === 'true')
    }
  }, [])

  const setWallpaperUrl = (url: string) => {
    setWallpaperUrlState(url)
    localStorage.setItem('custom-wallpaper-url', url)
  }

  const setEnableBlur = (enable: boolean) => {
    setEnableBlurState(enable)
    localStorage.setItem('custom-wallpaper-blur', enable.toString())
  }

  const resetToDefault = () => {
    setWallpaperUrlState('')
    setEnableBlurState(false)
    localStorage.removeItem('custom-wallpaper-url')
    localStorage.removeItem('custom-wallpaper-blur')
  }

  return (
    <WallpaperContext.Provider value={{ wallpaperUrl: isClient ? wallpaperUrl : '', setWallpaperUrl, resetToDefault, enableBlur: isClient ? enableBlur : false, setEnableBlur }}>
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