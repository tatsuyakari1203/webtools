// Main exports for the postfix system
export { PostfixProcessor } from './PostfixProcessor'
export type { 
  PostfixOperation, 
  PostfixContext, 
  PostfixResult, 
  PostfixSettings,
  ImageDimensions 
} from './types'

// Operations
export { AutoScalePostfix } from './operations/AutoScalePostfix'
export { UpscalePostfix } from './operations/UpscalePostfix'

// Utils
export * from './utils/imageUtils'

import { PostfixProcessor } from './PostfixProcessor'
import { AutoScalePostfix } from './operations/AutoScalePostfix'
import { UpscalePostfix } from './operations/UpscalePostfix'

// Create a default processor instance with AutoScale and Upscale operations
export function createDefaultPostfixProcessor(): PostfixProcessor {
  const processor = new PostfixProcessor()
  
  // Register default operations
  const autoScale = new AutoScalePostfix()
  const upscale = new UpscalePostfix()
  processor.registerOperation(autoScale)
  processor.registerOperation(upscale)
  
  // Enable auto-scale by default
  processor.setOperationEnabled('auto-scale', true)
  
  return processor
}