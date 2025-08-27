import { ImageFile, FileStatistics, FormatOptions, ImageMetadata } from '../types';

/**
 * Format file size to human readable format
 * @param bytes - Size in bytes
 * @param options - Format options
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number, options: FormatOptions = {}): string {
  const { precision = 1, showUnit = true, compact = false } = options;
  
  if (bytes === 0) return showUnit ? '0 B' : '0';
  
  const units = compact 
    ? ['B', 'KB', 'MB', 'GB', 'TB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  
  const formattedSize = i === 0 ? size.toString() : size.toFixed(precision);
  
  return showUnit ? `${formattedSize} ${units[i]}` : formattedSize;
}

/**
 * Format processing time to human readable format
 * @param milliseconds - Time in milliseconds
 * @param options - Format options
 * @returns Formatted time string
 */
export function formatProcessingTime(milliseconds: number, options: FormatOptions = {}): string {
  const { precision = 1, showUnit = true } = options;
  
  if (milliseconds < 1000) {
    return showUnit ? `${milliseconds}ms` : milliseconds.toString();
  }
  
  const seconds = milliseconds / 1000;
  
  if (seconds < 60) {
    const formattedSeconds = seconds.toFixed(precision);
    return showUnit ? `${formattedSeconds}s` : formattedSeconds;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return showUnit ? `${minutes}m ${remainingSeconds}s` : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format compression ratio as percentage
 * @param ratio - Compression ratio (0-100)
 * @param options - Format options
 * @returns Formatted percentage string
 */
export function formatCompressionRatio(ratio: number, options: FormatOptions = {}): string {
  const { precision = 1, showUnit = true } = options;
  
  const formattedRatio = ratio.toFixed(precision);
  return showUnit ? `${formattedRatio}%` : formattedRatio;
}

/**
 * Calculate file statistics from array of ImageFile
 * @param files - Array of ImageFile objects
 * @param actualProcessingTime - Actual elapsed time for batch processing (optional)
 * @returns FileStatistics object
 */
export function calculateFileStatistics(files: ImageFile[], actualProcessingTime?: number): FileStatistics {
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const failedFiles = files.filter(f => f.status === 'error').length;
  const processingFiles = files.filter(f => f.status === 'processing').length;
  
  const completedFilesData = files.filter(f => f.status === 'completed' && f.metadata);
  
  const totalOriginalSize = completedFilesData.reduce((sum, file) => {
    return sum + (file.metadata?.originalSize || file.size);
  }, 0);
  
  const totalConvertedSize = completedFilesData.reduce((sum, file) => {
    return sum + (file.metadata?.convertedSize || file.convertedFile?.size || 0);
  }, 0);
  
  const totalSavedSize = totalOriginalSize - totalConvertedSize;
  
  // Calculate weighted average compression ratio based on total data size
  const averageCompressionRatio = totalOriginalSize > 0 
    ? Math.round((1 - totalConvertedSize / totalOriginalSize) * 100)
    : 0;
  
  const sumOfIndividualTimes = completedFilesData.reduce((sum, file) => {
    return sum + (file.metadata?.processingTime || file.processingTime || 0);
  }, 0);
  
  // Use actual processing time if available, otherwise fall back to sum of individual times
  const totalProcessingTime = actualProcessingTime ?? sumOfIndividualTimes;
  
  // Calculate parallel efficiency if actual processing time is provided
  const parallelEfficiency = actualProcessingTime && sumOfIndividualTimes > 0
    ? Math.round((actualProcessingTime / sumOfIndividualTimes) * 100)
    : undefined;

  return {
    totalFiles,
    completedFiles,
    failedFiles,
    processingFiles,
    totalOriginalSize,
    totalConvertedSize,
    totalSavedSize,
    averageCompressionRatio,
    totalProcessingTime,
    actualProcessingTime,
    parallelEfficiency
  };
}

/**
 * Calculate estimated ZIP file size
 * @param files - Array of completed ImageFile objects
 * @returns Estimated ZIP size in bytes
 */
export function calculateEstimatedZipSize(files: ImageFile[]): number {
  const completedFiles = files.filter(f => f.status === 'completed' && f.convertedFile);
  
  // Estimate ZIP compression ratio (typically 5-15% additional compression)
  const totalConvertedSize = completedFiles.reduce((sum, file) => {
    return sum + (file.convertedFile?.size || 0);
  }, 0);
  
  // ZIP overhead: ~30 bytes per file + central directory
  const zipOverhead = completedFiles.length * 30 + 100;
  
  // Assume 10% additional compression for ZIP
  const estimatedZipSize = Math.round(totalConvertedSize * 0.9 + zipOverhead);
  
  return estimatedZipSize;
}

/**
 * Create ImageMetadata from processing result
 * @param originalFile - Original file
 * @param convertedBlob - Converted blob
 * @param processingTime - Processing time in milliseconds
 * @param originalDimensions - Original image dimensions
 * @param convertedDimensions - Converted image dimensions
 * @param outputFormat - Output format
 * @returns ImageMetadata object
 */
export function createImageMetadata(
  originalFile: File,
  convertedBlob: Blob,
  processingTime: number,
  originalDimensions: { width: number; height: number },
  convertedDimensions: { width: number; height: number },
  outputFormat: string
): ImageMetadata {
  const originalSize = originalFile.size;
  const convertedSize = convertedBlob.size;
  const compressionRatio = Math.round((1 - convertedSize / originalSize) * 100);
  
  return {
    originalFormat: originalFile.type.split('/')[1] || 'unknown',
    convertedFormat: outputFormat,
    originalDimensions,
    convertedDimensions,
    originalSize,
    convertedSize,
    compressionRatio,
    processingTime
  };
}

/**
 * Get file format display name
 * @param mimeType - MIME type or format string
 * @returns Display name for the format
 */
export function getFormatDisplayName(mimeType: string): string {
  const formatMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/avif': 'AVIF',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    'jpeg': 'JPEG',
    'jpg': 'JPEG',
    'png': 'PNG',
    'webp': 'WebP',
    'avif': 'AVIF',
    'bmp': 'BMP',
    'tiff': 'TIFF'
  };
  
  return formatMap[mimeType.toLowerCase()] || mimeType.toUpperCase();
}

/**
 * Get compression quality description
 * @param ratio - Compression ratio percentage
 * @returns Quality description
 */
export function getCompressionQualityDescription(ratio: number): string {
  if (ratio >= 70) return 'Excellent';
  if (ratio >= 50) return 'Very Good';
  if (ratio >= 30) return 'Good';
  if (ratio >= 10) return 'Fair';
  if (ratio >= 0) return 'Minimal';
  return 'Expanded';
}

/**
 * Calculate processing speed (files per second)
 * @param fileCount - Number of files processed
 * @param totalTime - Total processing time in milliseconds
 * @returns Processing speed in files per second
 */
export function calculateProcessingSpeed(fileCount: number, totalTime: number): number {
  if (totalTime === 0) return 0;
  return Math.round((fileCount / (totalTime / 1000)) * 100) / 100;
}