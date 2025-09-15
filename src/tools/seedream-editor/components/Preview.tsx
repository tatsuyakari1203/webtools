'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import Lightbox from './Lightbox';

interface PreviewProps {
  resultImages: string[];
  onDownload: (url: string, index: number) => void;
}

export default function Preview({
  resultImages,
  onDownload
}: PreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const filmStripRef = useRef<HTMLDivElement>(null);

  const scrollFilmStrip = (direction: 'left' | 'right') => {
    if (!filmStripRef.current) return;
    
    const scrollAmount = 100; // Adjust as needed
    const currentScroll = filmStripRef.current.scrollLeft;
    
    filmStripRef.current.scrollTo({
      left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  };

  // When active index changes, ensure it's visible in the film strip
  useEffect(() => {
    if (filmStripRef.current && resultImages.length > 1) {
      const thumbnails = filmStripRef.current.querySelectorAll('.thumbnail');
      if (thumbnails[activeIndex]) {
        thumbnails[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeIndex, resultImages.length]);

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Preview</CardTitle>
          <CardDescription>
            Edited images will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Results Preview */}
          {resultImages.length > 0 && (
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="relative">
                <div 
                  className="overflow-hidden rounded-lg border bg-muted cursor-pointer relative group"
                  onClick={() => openLightbox(activeIndex)}
                >
                  <img
                    src={resultImages[activeIndex]}
                    alt={`Result ${activeIndex + 1}`}
                    className="w-full h-auto object-contain max-h-[60vh] transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Result {activeIndex + 1} of {resultImages.length}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(resultImages[activeIndex], activeIndex)}
                    className="h-8 px-2"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="text-xs">Download</span>
                  </Button>
                </div>
              </div>
              
              {/* Film Strip for Multiple Images */}
              {resultImages.length > 1 && (
                <div className="relative mt-4 pt-2">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-background/80 shadow-sm hover:bg-background"
                      onClick={() => scrollFilmStrip('left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div 
                    ref={filmStripRef}
                    className="flex gap-2 overflow-x-auto pb-2 px-10 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {resultImages.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="thumbnail flex-shrink-0 cursor-pointer transition-all duration-200 relative"
                        onClick={() => setActiveIndex(index)}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Thumbnail ${index + 1}`} 
                          className="h-16 w-16 object-cover rounded-md"
                        />
                        {activeIndex !== index && (
                          <div className="absolute inset-0 bg-black/30 rounded-md hover:bg-black/10 transition-colors"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-background/80 shadow-sm hover:bg-background"
                      onClick={() => scrollFilmStrip('right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {resultImages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">No edited images yet</h3>
              <p className="text-xs text-muted-foreground">
                Add edit instructions and generate images to see results
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox for full-screen preview */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={resultImages}
        initialIndex={lightboxIndex}
        onDownload={onDownload}
      />
    </>
  );
}