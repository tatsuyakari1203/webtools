'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useWallpaper } from '../providers/WallpaperProvider';

export default function WallpaperBackground() {
  const { wallpaperUrl, enableBackground, enableBlur, enableZoom, zoomLevel } = useWallpaper();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when wallpaperUrl changes
  useEffect(() => {
    if (wallpaperUrl) {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [wallpaperUrl]);

  // Don't render if background is disabled, no wallpaper URL is provided, or has error
  if (!enableBackground || !wallpaperUrl || hasError) {
    return null;
  }

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    console.warn('Failed to load wallpaper image:', wallpaperUrl);
  };

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={wallpaperUrl}
          alt="Background wallpaper"
          fill
          className={`object-cover object-center transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: enableBlur ? 'blur(4px)' : undefined,
            transform: enableZoom ? `scale(${zoomLevel})` : undefined
          }}
          onLoad={handleLoad}
          onError={handleError}
          priority
          unoptimized // Allow external URLs and GIFs
          sizes="100vw"
          quality={85}
        />
      </div>
      

      
      {/* Overlay (70% opacity) - Dark in light mode, Light in dark mode */}
      <div 
        className="absolute inset-0 bg-white/70 dark:bg-black/70" 
        aria-hidden="true"
      />
    </div>
  );
}