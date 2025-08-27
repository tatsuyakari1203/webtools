// Web Worker for image processing
// This worker handles image compression and conversion in a separate thread
// to avoid blocking the main UI thread

import imageCompression from 'browser-image-compression';

export interface WorkerMessage {
  id: string;
  type: 'PROCESS_IMAGE' | 'PROGRESS' | 'COMPLETE' | 'ERROR';
  payload?: ProcessImagePayload | ProcessResult | { progress: number } | { error: string };
}

export interface ProcessImagePayload {
  fileData: ArrayBuffer;
  fileName: string;
  fileType: string;
  options: {
    outputFormat: string;
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
    preserveExif: boolean;
  };
}

export interface ProcessResult {
  success: boolean;
  file?: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime?: number;
  error?: string;
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  if (type === 'PROCESS_IMAGE') {
    try {
      const result = await processImage(payload as ProcessImagePayload);
      
      // Send completion message
      self.postMessage({
        id,
        type: 'COMPLETE',
        payload: result
      } as WorkerMessage);
    } catch (error) {
      // Send error message
      self.postMessage({
        id,
        type: 'ERROR',
        payload: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalSize: payload.fileData.byteLength,
          compressedSize: 0,
          compressionRatio: 0
        }
      } as WorkerMessage);
    }
  }
};

// Note: Image dimensions are now handled in the main thread
// to avoid DOM API limitations in Web Workers

// Process image function
async function processImage(payload: ProcessImagePayload): Promise<ProcessResult> {
  const startTime = performance.now();
  const { fileData, fileName, fileType, options } = payload;
  
  // Convert ArrayBuffer back to File
  const originalFile = new File([fileData], fileName, { type: fileType });
  
  // Send progress update
  self.postMessage({
    id: 'progress',
    type: 'PROGRESS',
    payload: { progress: 10 }
  } as WorkerMessage);
  
  // Configure compression options
  const compressionOptions = {
    maxSizeMB: 10, // Allow larger intermediate size for better quality
    maxWidthOrHeight: options.maxWidth || options.maxHeight || undefined,
    useWebWorker: false, // We're already in a worker
    fileType: `image/${options.outputFormat}` as 'image/jpeg' | 'image/png' | 'image/webp',
    initialQuality: options.quality,
    preserveExif: options.preserveExif,
    onProgress: (progress: number) => {
      // Send progress updates
      self.postMessage({
        id: 'progress',
        type: 'PROGRESS',
        payload: { progress: 10 + (progress * 0.8) } // Scale to 10-90%
      } as WorkerMessage);
    }
  };
  
  try {
    // Compress the image
    const compressedFile = await imageCompression(originalFile, compressionOptions);
    
    // Calculate processing time
    const processingTime = performance.now() - startTime;
    
    // Send final progress
    self.postMessage({
      id: 'progress',
      type: 'PROGRESS',
      payload: { progress: 100 }
    } as WorkerMessage);
    
    return {
      success: true,
      file: compressedFile,
      originalSize: originalFile.size,
      compressedSize: compressedFile.size,
      compressionRatio: Math.round((1 - compressedFile.size / originalFile.size) * 100),
      processingTime
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export for TypeScript
export {};