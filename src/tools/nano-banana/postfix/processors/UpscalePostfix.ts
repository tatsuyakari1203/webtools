import { PostfixOperation, PostfixContext, PostfixResult } from '../types'

export interface UpscaleConfig {
  upscaleFactor: number
  seed?: number
  enabled: boolean
}

export class UpscalePostfix implements PostfixOperation {
  id = 'upscale'
  name = 'Image Upscaling'
  description = 'Upscale images using SeedVR2 AI model'
  enabled = false
  
  config: Record<string, unknown> = {
    upscaleFactor: 2,
    seed: undefined,
    enabled: false
  }

  private getUpscaleConfig(): UpscaleConfig {
    return {
      upscaleFactor: (this.config.upscaleFactor as number) || 2,
      seed: this.config.seed as number | undefined,
      enabled: (this.config.enabled as boolean) || false
    }
  }

  async process(context: PostfixContext): Promise<PostfixResult> {
    const config = this.getUpscaleConfig()
    
    if (!this.enabled || !config.enabled) {
      return {
        processedImages: context.outputImages,
        metadata: { upscale: { skipped: true, reason: 'disabled' } }
      }
    }

    try {
      const processedImages: string[] = []
      const errors: string[] = []
      
      console.log(`Starting upscale process for ${context.outputImages.length} images with factor ${config.upscaleFactor}`)

      // Process each image
      const usedSeeds: number[] = []
      
      for (let i = 0; i < context.outputImages.length; i++) {
        const image = context.outputImages[i]
        
        try {
          console.log(`Upscaling image ${i + 1}/${context.outputImages.length}`)
          
          // Generate a unique random seed for each image to ensure variety
          const uniqueSeed = Math.floor(Date.now() * Math.random()) % 1000000
          usedSeeds.push(uniqueSeed)
          
          // Call our SeedVR2 API
          const response = await fetch('/api/seedvr2/upscale', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: image, // base64 image
              upscale_factor: config.upscaleFactor,
              seed: uniqueSeed
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(`API Error: ${errorData.error || response.statusText}`)
          }

          const result = await response.json()
          
          if (!result.image?.url) {
            throw new Error('No upscaled image URL received from API')
          }

          // Convert the result URL to base64
          const imageResponse = await fetch(result.image.url)
          if (!imageResponse.ok) {
            throw new Error('Failed to fetch upscaled image')
          }

          const imageBlob = await imageResponse.blob()
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Return full data URL for proper image display
              resolve(result)
            }
            reader.onerror = reject
            reader.readAsDataURL(imageBlob)
          })

          processedImages.push(base64)
          console.log(`Successfully upscaled image ${i + 1}`)
          
        } catch (error) {
          console.error(`Failed to upscale image ${i + 1}:`, error)
          errors.push(`Image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          // Use original image as fallback
          processedImages.push(image)
        }
      }

      const metadata = {
        upscale: {
          factor: config.upscaleFactor,
          seeds: usedSeeds,
          processedCount: processedImages.length,
          errorCount: errors.length,
          timestamp: new Date().toISOString()
        }
      }

      console.log('Upscale process completed:', metadata)

      return {
        processedImages,
        metadata,
        errors: errors.length > 0 ? errors : undefined
      }
      
    } catch (error) {
      console.error('Upscale process failed:', error)
      return {
        processedImages: context.outputImages, // Return original images as fallback
        metadata: { 
          upscale: { 
            failed: true, 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          } 
        },
        errors: [`Upscale failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  canApply(context: PostfixContext): boolean {
    const config = this.getUpscaleConfig()
    return (
      this.enabled && 
      config.enabled &&
      context.outputImages.length > 0 &&
      config.upscaleFactor > 1 &&
      config.upscaleFactor <= 10
    )
  }

  updateConfig(newConfig: Partial<UpscaleConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Upscale config updated:', this.config)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.config = { ...this.config, enabled }
    console.log(`Upscale processor ${enabled ? 'enabled' : 'disabled'}`)
  }
}