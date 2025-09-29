/**
 * Types and interfaces for the postfix processing system
 */

export interface PostfixContext {
  // Input images information
  inputImages: File[]
  inputImagePreviews: string[]
  mainImageIndex: number
  mainImageSize?: { width: number; height: number }
  
  // Operation context
  operationType: 'edit' | 'compose' | 'style_transfer'
  prompt: string
  
  // Output images (base64 strings from API)
  outputImages: string[]
}

export interface PostfixResult {
  processedImages: string[] // base64 strings
  metadata?: Record<string, unknown>
  errors?: string[]
}

export interface PostfixOperation {
  id: string
  name: string
  description: string
  enabled: boolean
  
  // Process function that takes context and returns processed images
  process(context: PostfixContext): Promise<PostfixResult>
  
  // Validation function to check if operation can be applied
  canApply(context: PostfixContext): boolean
  
  // Configuration options (if any)
  config?: Record<string, unknown>
}

export interface PostfixSettings {
  enabledOperations: string[] // Array of operation IDs
  operationConfigs: Record<string, Record<string, unknown>>
}

export interface ImageDimensions {
  width: number
  height: number
}