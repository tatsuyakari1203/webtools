import { PostfixOperation, PostfixContext, PostfixResult, PostfixSettings } from './types'

/**
 * Main processor class for handling postfix operations
 */
export class PostfixProcessor {
  private operations: Map<string, PostfixOperation> = new Map()
  private settings: PostfixSettings = {
    enabledOperations: [],
    operationConfigs: {}
  }

  /**
   * Register a new postfix operation
   */
  registerOperation(operation: PostfixOperation): void {
    this.operations.set(operation.id, operation)
  }

  /**
   * Unregister a postfix operation
   */
  unregisterOperation(operationId: string): void {
    this.operations.delete(operationId)
    this.settings.enabledOperations = this.settings.enabledOperations.filter(id => id !== operationId)
    delete this.settings.operationConfigs[operationId]
  }

  /**
   * Get all registered operations
   */
  getOperations(): PostfixOperation[] {
    return Array.from(this.operations.values())
  }

  /**
   * Get the priority order for operations
   * Lower numbers = higher priority (run first)
   */
  private getOperationPriority(operationId: string): number {
    const priorities: Record<string, number> = {
      'upscale': 1,      // AI upscale runs first
      'auto-scale': 2,   // Auto-scale runs after upscale
    }
    return priorities[operationId] || 999 // Unknown operations run last
  }

  /**
   * Get enabled operations only, sorted by priority
   */
  getEnabledOperations(): PostfixOperation[] {
    return this.settings.enabledOperations
      .map(id => this.operations.get(id))
      .filter((op): op is PostfixOperation => op !== undefined && op.enabled)
      .sort((a, b) => this.getOperationPriority(a.id) - this.getOperationPriority(b.id))
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<PostfixSettings>): void {
    this.settings = { ...this.settings, ...settings }
  }

  /**
   * Get current settings
   */
  getSettings(): PostfixSettings {
    return { ...this.settings }
  }

  /**
   * Enable/disable a specific operation
   */
  setOperationEnabled(operationId: string, enabled: boolean): void {
    const operation = this.operations.get(operationId)
    if (operation) {
      operation.enabled = enabled
      
      if (enabled && !this.settings.enabledOperations.includes(operationId)) {
        this.settings.enabledOperations.push(operationId)
      } else if (!enabled) {
        this.settings.enabledOperations = this.settings.enabledOperations.filter(id => id !== operationId)
      }
    }
  }

  /**
   * Update configuration for a specific operation
   */
  updateOperationConfig(operationId: string, config: Record<string, unknown>): void {
    if (this.operations.has(operationId)) {
      this.settings.operationConfigs[operationId] = {
        ...this.settings.operationConfigs[operationId],
        ...config
      }
      
      const operation = this.operations.get(operationId)!
      operation.config = { ...operation.config, ...config }
    }
  }

  /**
   * Process images through all enabled postfix operations
   */
  async processImages(context: PostfixContext): Promise<PostfixResult> {
    const enabledOps = this.getEnabledOperations()
    
    if (enabledOps.length === 0) {
      return {
        processedImages: context.outputImages,
        metadata: { message: 'No postfix operations enabled' }
      }
    }

    let currentImages = [...context.outputImages]
    const allMetadata: Record<string, unknown> = {}
    const allErrors: string[] = []

    // Process through each enabled operation sequentially
    for (const operation of enabledOps) {
      try {
        // Check if operation can be applied
        if (!operation.canApply(context)) {
          console.warn(`Postfix operation '${operation.name}' cannot be applied, skipping...`)
          continue
        }

        console.log(`Applying postfix operation: ${operation.name}`)
        
        // Update context with current images
        const updatedContext: PostfixContext = {
          ...context,
          outputImages: currentImages
        }

        // Apply the operation
        const result = await operation.process(updatedContext)
        
        // Update current images with processed results
        currentImages = result.processedImages
        
        // Collect metadata and errors
        if (result.metadata) {
          allMetadata[operation.id] = result.metadata
        }
        if (result.errors) {
          allErrors.push(...result.errors.map(err => `${operation.name}: ${err}`))
        }

      } catch (error) {
        const errorMessage = `Error in postfix operation '${operation.name}': ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMessage)
        allErrors.push(errorMessage)
        
        // Continue with other operations even if one fails
        continue
      }
    }

    return {
      processedImages: currentImages,
      metadata: {
        appliedOperations: enabledOps.map(op => op.id),
        operationResults: allMetadata,
        totalOperations: enabledOps.length
      },
      errors: allErrors.length > 0 ? allErrors : undefined
    }
  }

  /**
   * Validate if any enabled operations can be applied to the context
   */
  canProcessImages(context: PostfixContext): boolean {
    const enabledOps = this.getEnabledOperations()
    return enabledOps.some(op => op.canApply(context))
  }
}