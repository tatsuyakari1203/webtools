// Re-export types and interfaces from models
export type { SeedreamRequest, SeedreamResponse } from './models/seedream/route';
export type { FluxKontextRequest, FluxKontextResponse } from './models/flux-kontext/route';

// Common types for image generation
export interface ImageGenerationModel {
  name: string;
  displayName: string;
  description: string;
  apiPath: string;
  capabilities: string[];
}

// Available models
export const AVAILABLE_MODELS: ImageGenerationModel[] = [
  {
    name: 'seedream',
    displayName: 'Seedream',
    description: 'Image editing model by ByteDance',
    apiPath: '/api/ai-image-generation/models/seedream',
    capabilities: ['image-editing', 'style-transfer']
  },
  {
    name: 'flux-kontext',
    displayName: 'Flux Kontext',
    description: 'Image context model by Fal.ai',
    apiPath: '/api/ai-image-generation/models/flux-kontext',
    capabilities: ['image-to-image', 'object-addition']
  }
];

// Helper function to get model by name
export function getModelByName(name: string): ImageGenerationModel | undefined {
  return AVAILABLE_MODELS.find(model => model.name === name);
}

// Helper function to get models by capability
export function getModelsByCapability(capability: string): ImageGenerationModel[] {
  return AVAILABLE_MODELS.filter(model => 
    model.capabilities.includes(capability)
  );
}