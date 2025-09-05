import { useCallback, useRef, useEffect } from 'react';
import type { 
  ImageProcessingMessage, 
  CropResult, 
  CropOptions,
  SpecialCropOptions,
  ResizeOptions,
  RotateOptions,
  FlipOptions
} from '../workers/imageProcessor.worker';

type ProcessImageOptions = CropOptions | SpecialCropOptions | ResizeOptions | RotateOptions | FlipOptions;

export interface UseImageProcessorReturn {
  processImage: (type: 'crop' | 'special-crop' | 'resize' | 'rotate' | 'flip', imageData: ImageData, options: ProcessImageOptions) => Promise<ImageData[]>;
  isProcessing: boolean;
}

export function useImageProcessor(): UseImageProcessorReturn {
  const workerRef = useRef<Worker | null>(null);
  const isProcessingRef = useRef(false);
  const pendingPromises = useRef<Map<string, { resolve: (value: ImageData[]) => void; reject: (error: Error) => void }>>(new Map());

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<CropResult>) => {
      const { type, images, success, error } = e.data;
      
      if (type === 'crop-result') {
        isProcessingRef.current = false;
        
        // Find and resolve the pending promise
        const promiseKey = 'current'; // Simple key for now
        const promise = pendingPromises.current.get(promiseKey);
        
        if (promise) {
          pendingPromises.current.delete(promiseKey);
          
          if (success) {
            promise.resolve(images);
          } else {
            promise.reject(new Error(error || 'Processing failed'));
          }
        }
      }
    };

    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      isProcessingRef.current = false;
      
      // Reject all pending promises
      pendingPromises.current.forEach(({ reject }) => {
        reject(new Error('Worker error'));
      });
      pendingPromises.current.clear();
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const processImage = useCallback(async (
    type: 'crop' | 'special-crop' | 'resize' | 'rotate' | 'flip',
    imageData: ImageData,
    options: ProcessImageOptions
  ): Promise<ImageData[]> => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    if (isProcessingRef.current) {
      throw new Error('Already processing an image');
    }

    isProcessingRef.current = true;

    return new Promise((resolve, reject) => {
      const promiseKey = 'current';
      pendingPromises.current.set(promiseKey, { resolve, reject });

      const message: ImageProcessingMessage = {
        type,
        imageData,
        options
      };

      workerRef.current!.postMessage(message);

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (pendingPromises.current.has(promiseKey)) {
          pendingPromises.current.delete(promiseKey);
          isProcessingRef.current = false;
          reject(new Error('Processing timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }, []);

  return {
    processImage,
    isProcessing: isProcessingRef.current
  };
}