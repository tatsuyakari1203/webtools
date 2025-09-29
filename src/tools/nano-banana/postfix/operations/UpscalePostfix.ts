import type { PostfixOperation, PostfixContext, PostfixResult } from '../types'

interface UpscaleConfig {
  upscaleFactor: number
  seed?: number
  enabled: boolean
}

interface UpscaleRequest {
  image: string
  upscale_factor: number
  seed?: number
}

interface UpscaleResponse {
  image: {
    url: string
    content_type: string
  }
}

export class UpscalePostfix implements PostfixOperation {
  readonly id = 'upscale'
  readonly name = 'AI Upscale'
  readonly description = 'Enhance image quality and resolution using SeedVR2 AI upscaling'
  enabled = false
  readonly config: Record<string, unknown> = {
    upscaleFactor: 2,
    seed: undefined
  }

  private getUpscaleConfig(): UpscaleConfig {
    return {
      upscaleFactor: (this.config.upscaleFactor as number) || 2,
      seed: this.config.seed as number | undefined,
      enabled: this.enabled
    }
  }

  canApply(context: PostfixContext): boolean {
    return this.enabled && context.outputImages.length > 0
  }

  async process(context: PostfixContext): Promise<PostfixResult> {
    const config = this.getUpscaleConfig()
    
    if (!config.enabled) {
      return {
        processedImages: context.outputImages,
        metadata: { operation: this.id, skipped: true }
      }
    }

    try {
      const processedImages: string[] = []
      
      for (const image of context.outputImages) {
        // Prepare request payload
        const requestPayload: UpscaleRequest = {
          image: image,
          upscale_factor: config.upscaleFactor
        }

        if (config.seed !== undefined) {
          requestPayload.seed = config.seed
        }

        // Call the SeedVR2 upscale API
        const response = await fetch('/api/seedvr2/upscale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upscale API error: ${response.status} - ${errorText}`)
        }

        const result: UpscaleResponse = await response.json()
        
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
            // Remove data URL prefix to get just the base64 part
            const base64Data = result.split(',')[1]
            resolve(base64Data)
          }
          reader.onerror = reject
          reader.readAsDataURL(imageBlob)
        })

        processedImages.push(base64)
      }

      return {
        processedImages: processedImages,
        metadata: {
          operation: this.id,
          upscaleFactor: config.upscaleFactor,
          seed: config.seed,
          processedCount: processedImages.length,
          originalCount: context.outputImages.length
        }
      }
    } catch (error) {
      console.error('Upscale processing failed:', error)
      
      // Return original images on error
      return {
        processedImages: context.outputImages,
        metadata: {
          operation: this.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackToOriginal: true
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}