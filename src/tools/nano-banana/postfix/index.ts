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

// Utils
export * from './utils/imageUtils'

import { PostfixProcessor } from './PostfixProcessor'
import { AutoScalePostfix } from './operations/AutoScalePostfix'

// Create a default processor instance with AutoScale operation
export function createDefaultPostfixProcessor(): PostfixProcessor {
  const processor = new PostfixProcessor()
  
  // Register default operations
  const autoScale = new AutoScalePostfix()
  processor.registerOperation(autoScale)
  
  // Enable auto-scale by default
  processor.setOperationEnabled('auto-scale', true)
  
  return processor
}