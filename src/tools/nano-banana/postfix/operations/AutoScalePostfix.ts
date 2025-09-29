import { PostfixOperation, PostfixContext, PostfixResult } from '../types'
import { scaleImageToSize, getImageDimensionsFromBase64, dimensionsEqual } from '../utils/imageUtils'

/**
 * AutoScale Postfix Operation
 * Scales output images to match the dimensions of the main input image
 */
export class AutoScalePostfix implements PostfixOperation {
  id = 'auto-scale'
  name = 'Auto Scale'
  description = 'Scale output images to match the size of the main input image'
  enabled = true
  config = {
    maintainAspectRatio: false, // For exact size matching
    skipIfSameSize: true // Skip processing if already same size
  }

  /**
   * Check if this operation can be applied
   */
  canApply(context: PostfixContext): boolean {
    // Need main image size and at least one output image
    return !!(
      context.mainImageSize && 
      context.outputImages.length > 0 &&
      context.mainImageSize.width > 0 &&
      context.mainImageSize.height > 0
    )
  }

  /**
   * Process the images
   */
  async process(context: PostfixContext): Promise<PostfixResult> {
    if (!context.mainImageSize) {
      return {
        processedImages: context.outputImages,
        errors: ['Main image size not available']
      }
    }

    const targetSize = context.mainImageSize
    const processedImages: string[] = []
    const errors: string[] = []
    let skippedCount = 0
    let scaledCount = 0

    console.log(`AutoScale: Target size ${targetSize.width}x${targetSize.height}`)

    for (let i = 0; i < context.outputImages.length; i++) {
      try {
        const outputImage = context.outputImages[i]
        
        // Get current image dimensions
        const currentDimensions = await getImageDimensionsFromBase64(outputImage)
        
        console.log(`AutoScale: Image ${i + 1} current size ${currentDimensions.width}x${currentDimensions.height}`)
        
        // Skip if already same size and config allows it
        if (this.config.skipIfSameSize && dimensionsEqual(currentDimensions, targetSize)) {
          processedImages.push(outputImage)
          skippedCount++
          console.log(`AutoScale: Image ${i + 1} already correct size, skipping`)
          continue
        }

        // Scale the image
        console.log(`AutoScale: Scaling image ${i + 1} to ${targetSize.width}x${targetSize.height}`)
        const scaledImage = await scaleImageToSize(outputImage, targetSize)
        processedImages.push(scaledImage)
        scaledCount++
        
      } catch (error) {
        console.error(`AutoScale: Error processing image ${i + 1}:`, error)
        errors.push(`Failed to scale image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Keep original image if scaling fails
        processedImages.push(context.outputImages[i])
      }
    }

    const metadata = {
      targetSize,
      totalImages: context.outputImages.length,
      scaledImages: scaledCount,
      skippedImages: skippedCount,
      failedImages: errors.length
    }

    console.log('AutoScale: Processing complete', metadata)

    return {
      processedImages,
      metadata,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig }
  }
}