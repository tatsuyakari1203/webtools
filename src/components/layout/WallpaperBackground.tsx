'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface WallpaperBackgroundProps {
  wallpaperUrl?: string;
  enableBlur?: boolean;
}

export default function WallpaperBackground({ wallpaperUrl, enableBlur = false }: WallpaperBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset states when wallpaperUrl changes
  useEffect(() => {
    if (wallpaperUrl) {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [wallpaperUrl]);

  // Don't render if no wallpaper URL is provided
  if (!wallpaperUrl || hasError) {
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
          className={`object-cover object-center transition-opacity duration-1000 ${enableBlur ? 'blur-sm' : ''} ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
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