import { PromptType } from './types';

// Cấu hình model cho từng loại prompt
export interface ModelConfig {
  name: string;
  description: string;
  costEfficient: boolean;
  bestFor: string[];
  maxTokens: number;
}

/**
 * Các model Gemini có sẵn (Gemini 2.5 series)
 */
export const AVAILABLE_MODELS = {
  FLASH_LITE: 'gemini-2.5-flash-lite',
  FLASH: 'gemini-2.5-flash', 
  PRO: 'gemini-2.5-pro',
  FLASH_IMAGE: 'gemini-2.5-flash-image'
} as const;

/**
 * Thông tin chi tiết về từng model
 */
export const MODEL_CONFIGS: Record<keyof typeof AVAILABLE_MODELS, ModelConfig> = {
  FLASH_LITE: {
    name: AVAILABLE_MODELS.FLASH_LITE,
    maxTokens: 8192,
    costEfficient: true,
    bestFor: ['simple questions', 'quick responses', 'basic tasks'],
    description: 'Smallest and most cost effective model for at scale usage. Input: $0.10/Output: $0.40'
  },
  FLASH: {
    name: AVAILABLE_MODELS.FLASH,
    maxTokens: 1000000,
    costEfficient: true,
    bestFor: ['general questions', 'reasoning tasks', 'complex prompts'],
    description: 'Hybrid reasoning model with 1M token context window. Input: $0.30/Output: $2.50'
  },
  PRO: {
    name: AVAILABLE_MODELS.PRO,
    maxTokens: 200000,
    costEfficient: false,
    bestFor: ['complex reasoning', 'coding tasks', 'detailed analysis'],
    description: 'Most powerful reasoning model for coding and complex tasks. Input: $1.25-2.50/Output: $10.00-15.00'
  },
  FLASH_IMAGE: {
    name: AVAILABLE_MODELS.FLASH_IMAGE,
    maxTokens: 8192,
    costEfficient: false,
    bestFor: ['image generation', 'image editing', 'visual tasks'],
    description: 'State-of-the-art image generation and editing model. Input: $0.30/Output: $2.50'
  }
};

// Danh sách các model Gemini có sẵn (backward compatibility)
export const GEMINI_MODELS: Record<string, ModelConfig> = {
  [AVAILABLE_MODELS.FLASH_LITE]: MODEL_CONFIGS.FLASH_LITE,
  [AVAILABLE_MODELS.FLASH]: MODEL_CONFIGS.FLASH,
  [AVAILABLE_MODELS.PRO]: MODEL_CONFIGS.PRO,
  [AVAILABLE_MODELS.FLASH_IMAGE]: MODEL_CONFIGS.FLASH_IMAGE
};

/**
 * Ánh xạ PromptType với model phù hợp
 */
const PROMPT_TYPE_TO_MODEL: Record<PromptType, keyof typeof AVAILABLE_MODELS> = {
  [PromptType.QUOTE_GENERATION]: 'FLASH_LITE',
  [PromptType.TASK_MOTIVATION]: 'FLASH_LITE', 
  [PromptType.GENERAL_QUESTION]: 'FLASH',
  [PromptType.CREATIVE_WRITING]: 'PRO',
  [PromptType.SUMMARIZATION]: 'FLASH',
  [PromptType.TRANSLATION]: 'FLASH'
};

/**
 * Chọn model Gemini phù hợp dựa trên loại prompt
 * @param promptType - Loại prompt từ enum PromptType
 * @param forceModel - Tên model cụ thể để override logic tự động (tùy chọn)
 * @returns Tên model Gemini phù hợp
 */
export function selectModel(promptType?: PromptType, forceModel?: string): string {
  // Nếu có forceModel và model đó tồn tại, sử dụng nó
  if (forceModel && GEMINI_MODELS[forceModel]) {
    return forceModel;
  }
  
  // Nếu không có promptType, sử dụng model mặc định
  if (!promptType) {
    return AVAILABLE_MODELS.FLASH;
  }
  
  // Chọn model dựa trên promptType
  const modelKey = PROMPT_TYPE_TO_MODEL[promptType] || 'FLASH';
  return AVAILABLE_MODELS[modelKey];
}

/**
 * Lấy thông tin cấu hình của model
 * @param modelName - Tên model
 * @returns Cấu hình model hoặc undefined nếu không tìm thấy
 */
export function getModelConfig(modelName: string): ModelConfig | undefined {
  return GEMINI_MODELS[modelName];
}

/**
 * Kiểm tra xem model có phải là cost-efficient không
 * @param modelName - Tên model
 * @returns true nếu model cost-efficient, false nếu ngược lại
 */
export function isCostEfficientModel(modelName: string): boolean {
  const config = getModelConfig(modelName);
  return config?.costEfficient ?? false;
}

/**
 * Lấy danh sách tất cả model có sẵn
 * @returns Mảng tên các model
 */
export function getAvailableModels(): string[] {
  return Object.keys(GEMINI_MODELS);
}

/**
 * Gợi ý model tốt nhất cho một tác vụ cụ thể
 * @param taskDescription - Mô tả tác vụ
 * @returns Tên model được gợi ý
 */
export function suggestModelForTask(taskDescription: string): string {
  const lowerTask = taskDescription.toLowerCase();
  
  // Kiểm tra các từ khóa để gợi ý model
  const complexKeywords = ['analyze', 'analysis', 'complex', 'detailed', 'creative', 'write', 'explain', 'technical', 'code', 'coding'];
  const simpleKeywords = ['quick', 'simple', 'basic', 'quote', 'motivation', 'short'];
  const imageKeywords = ['image', 'picture', 'visual', 'generate', 'create', 'draw'];
  
  const hasComplexKeywords = complexKeywords.some(keyword => lowerTask.includes(keyword));
  const hasSimpleKeywords = simpleKeywords.some(keyword => lowerTask.includes(keyword));
  const hasImageKeywords = imageKeywords.some(keyword => lowerTask.includes(keyword));
  
  if (hasImageKeywords) {
    return AVAILABLE_MODELS.FLASH_IMAGE;
  }
  
  if (hasComplexKeywords && !hasSimpleKeywords) {
    return AVAILABLE_MODELS.PRO;
  }
  
  if (hasSimpleKeywords) {
    return AVAILABLE_MODELS.FLASH_LITE;
  }
  
  return AVAILABLE_MODELS.FLASH;
}