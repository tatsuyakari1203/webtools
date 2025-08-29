import { GoogleGenAI } from '@google/genai';
import { AskGeminiRequest, AskGeminiResponse, PromptType } from './types';
import { selectModel, getModelConfig } from './model-router';
import { 
  getSafetySettings, 
  convertToGeminiSafetySettings, 
  isSafetyBlocked, 
  createSafetyBlockedMessage,
  SafetySettings 
} from './safety-config';

// Cấu hình generation mặc định
const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxTokens: 1000,
};

export class GeminiService {
  private genAI: GoogleGenAI;
  private safetySettings: SafetySettings;

  constructor(apiKey: string, environment: 'production' | 'development' | 'strict' | 'relaxed' = 'production') {
    if (!apiKey) {
      throw new Error('Google API Key is required');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.safetySettings = getSafetySettings(environment);
  }

  /**
   * Tạo prompt hoàn chỉnh từ request
   */
  private buildPrompt(request: AskGeminiRequest): string {
    let fullPrompt = request.prompt;
    
    if (request.context) {
      fullPrompt = `Context: ${request.context}\n\nQuestion: ${request.prompt}`;
    }
    
    return fullPrompt;
  }

  /**
   * Tạo response không streaming
   */
  async generateContent(request: AskGeminiRequest): Promise<AskGeminiResponse> {
    const startTime = Date.now();
    const modelName = selectModel(request.type);
    
    try {
      // Tạo prompt
      const prompt = this.buildPrompt(request);
      
      // Gọi API với streaming và collect tất cả chunks
      const stream = await this.genAI.models.generateContentStream({
        model: `models/${modelName}`,
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      let generatedText = '';
      
      // Collect all chunks from the stream
      for await (const chunk of stream) {
        if (chunk.text) {
          generatedText += chunk.text;
        }
      }
      
      generatedText = generatedText.trim();
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        response: generatedText,
        processingTime,
        model: modelName,
        isStreaming: false
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Kiểm tra nếu lỗi do safety filter
      if (isSafetyBlocked(error)) {
        return {
          success: false,
          error: createSafetyBlockedMessage(),
          processingTime,
          model: modelName,
          isStreaming: false
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime,
        model: modelName,
        isStreaming: false
      };
    }
  }

  /**
   * Tạo streaming response
   */
  async generateContentStream(request: AskGeminiRequest): Promise<ReadableStream<Uint8Array>> {
    const modelName = selectModel(request.type);
    
    // Tạo prompt
    const prompt = this.buildPrompt(request);
    
    // Tạo streaming response
    const stream = await this.genAI.models.generateContentStream({
         model: `models/${modelName}`,
         contents: [{
           role: 'user',
           parts: [{ text: prompt }]
         }]
       });
    
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              // Format as Server-Sent Events
              const data = JSON.stringify({ 
                content: chunk.text,
                model: modelName,
                timestamp: new Date().toISOString()
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          // Kiểm tra nếu lỗi do safety filter
          const errorMessage = isSafetyBlocked(error) 
            ? createSafetyBlockedMessage()
            : (error instanceof Error ? error.message : 'Unknown error occurred');
            
          const errorData = JSON.stringify({
            error: errorMessage,
            timestamp: new Date().toISOString()
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      }
    });
  }

  /**
   * Kiểm tra health của service
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Test với một prompt đơn giản
      const stream = await this.genAI.models.generateContentStream({
           model: 'models/gemini-2.5-flash',
           contents: [{
             role: 'user',
             parts: [{ text: 'Hello' }]
           }]
         });
      
      let hasResponse = false;
      for await (const chunk of stream) {
        if (chunk.text) {
          hasResponse = true;
          break; // Chỉ cần kiểm tra chunk đầu tiên
        }
      }
      
      if (hasResponse) {
        return { healthy: true };
      } else {
        return { healthy: false, message: 'No response from Gemini API' };
      }
    } catch (error) {
      return { 
        healthy: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Lấy thông tin model được sử dụng
   */
  getModelInfo(promptType?: PromptType) {
    const modelName = selectModel(promptType);
    const config = getModelConfig(modelName);
    
    return {
      name: modelName,
      config: config || null
    };
  }
}