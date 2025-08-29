// Interface cho request gửi đến askGemini API
export interface AskGeminiRequest {
  prompt: string;           // Câu hỏi hoặc yêu cầu chính
  type?: PromptType;        // Loại prompt để chọn model phù hợp
  context?: string;         // Ngữ cảnh bổ sung (tùy chọn)
  maxTokens?: number;       // Số token tối đa (mặc định: 1000)
  temperature?: number;     // Độ sáng tạo (0-1, mặc định: 0.7)
  stream?: boolean;         // Có sử dụng streaming response không (mặc định: false)
}

// Interface cho response từ askGemini API
export interface AskGeminiResponse {
  success: boolean;         // Trạng thái thành công
  response?: string;        // Nội dung phản hồi từ AI
  error?: string;          // Thông báo lỗi (nếu có)
  processingTime?: number; // Thời gian xử lý (ms)
  model?: string;          // Model được sử dụng
  isStreaming?: boolean;   // Có phải streaming response không
}

// Interface cho health check response
export interface AskGeminiHealthResponse {
  status: 'healthy' | 'error';
  service: string;
  timestamp: string;
  version?: string;
  description?: string;
  message?: string;
  error?: string;
}

// Enum cho các loại prompt phổ biến
export enum PromptType {
  QUOTE_GENERATION = 'quote_generation',
  TASK_MOTIVATION = 'task_motivation',
  GENERAL_QUESTION = 'general_question',
  CREATIVE_WRITING = 'creative_writing',
  SUMMARIZATION = 'summarization',
  TRANSLATION = 'translation'
}

// Helper function để tạo prompt cho việc tạo quotes
export function createQuotePrompt(taskName?: string, mood?: string): string {
  let prompt = 'Generate an inspiring and motivational quote';
  
  if (taskName) {
    prompt += ` related to working on "${taskName}"`;
  }
  
  if (mood) {
    prompt += ` with a ${mood} tone`;
  }
  
  prompt += '. The quote should be concise, meaningful, and encouraging. Return only the quote without any additional text or quotation marks.';
  
  return prompt;
}

// Helper function để tạo prompt cho động lực làm việc
export function createMotivationPrompt(taskName: string, timeRemaining?: number): string {
  let prompt = `Generate a short motivational message for someone working on "${taskName}"`;
  
  if (timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60);
    prompt += ` with ${minutes} minutes remaining`;
  }
  
  prompt += '. The message should be encouraging, focused, and help maintain productivity. Keep it under 50 words.';
  
  return prompt;
}

// Utility function để validate request
export function validateAskGeminiRequest(request: Partial<AskGeminiRequest>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!request.prompt || request.prompt.trim().length === 0) {
    errors.push('Prompt is required and cannot be empty');
  }
  
  if (request.prompt && request.prompt.length > 10000) {
    errors.push('Prompt cannot exceed 10,000 characters');
  }
  
  if (request.maxTokens && (request.maxTokens < 1 || request.maxTokens > 4000)) {
    errors.push('maxTokens must be between 1 and 4000');
  }
  
  if (request.temperature && (request.temperature < 0 || request.temperature > 1)) {
    errors.push('temperature must be between 0 and 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
