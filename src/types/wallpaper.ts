export interface WallpaperItem {
  id: string
  url: string
  name?: string
  addedAt: number
}

export type RotationMode = 'manual' | 'timer' | 'refresh'

export interface WallpaperRotationSettings {
  mode: RotationMode
  timerInterval?: number // in minutes
  randomOrder?: boolean
}

export interface WallpaperConfig {
  wallpapers: WallpaperItem[]
  currentWallpaperId: string | null
  enableBlur: boolean
  rotationSettings: WallpaperRotationSettings
}

export interface WallpaperContextType {
  // Current wallpaper
  wallpaperUrl: string
  currentWallpaper: WallpaperItem | null
  
  // Wallpaper management
  wallpapers: WallpaperItem[]
  addWallpaper: (url: string, name?: string) => void
  removeWallpaper: (id: string) => void
  updateWallpaper: (id: string, updates: Partial<WallpaperItem>) => void
  setCurrentWallpaper: (id: string) => void
  
  // Rotation
  rotationSettings: WallpaperRotationSettings
  updateRotationSettings: (settings: Partial<WallpaperRotationSettings>) => void
  nextWallpaper: () => void
  previousWallpaper: () => void
  
  // Blur and other settings
  enableBlur: boolean
  setEnableBlur: (enable: boolean) => void
  
  // Legacy support
  setWallpaperUrl: (url: string) => void
  resetToDefault: () => void
}

export const DEFAULT_ROTATION_SETTINGS: WallpaperRotationSettings = {
  mode: 'manual',
  timerInterval: 30,
  randomOrder: false
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  wallpapers: [],
  currentWallpaperId: null,
  enableBlur: false,
  rotationSettings: DEFAULT_ROTATION_SETTINGS
}