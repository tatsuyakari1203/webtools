/**
 * Safety configuration for Gemini AI
 * Cấu hình an toàn cho Gemini AI
 */

export interface SafetySettings {
  /** Ngưỡng chặn nội dung quấy rối */
  harassment: SafetyThreshold;
  /** Ngưỡng chặn nội dung thù địch */
  hateSpeech: SafetyThreshold;
  /** Ngưỡng chặn nội dung tình dục */
  sexuallyExplicit: SafetyThreshold;
  /** Ngưỡng chặn nội dung nguy hiểm */
  dangerousContent: SafetyThreshold;
}

export enum SafetyThreshold {
  /** Chặn khi có xác suất thấp */
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  /** Chặn khi có xác suất trung bình */
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  /** Chỉ chặn khi có xác suất cao */
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  /** Không chặn */
  BLOCK_NONE = 'BLOCK_NONE'
}

export enum SafetyCategory {
  HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
}

/**
 * Cấu hình an toàn mặc định - Strict
 * Chặn hầu hết nội dung có thể gây hại
 */
export const DEFAULT_SAFETY_SETTINGS: SafetySettings = {
  harassment: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE,
  hateSpeech: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE,
  sexuallyExplicit: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE,
  dangerousContent: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE
};

/**
 * Cấu hình an toàn nghiêm ngặt
 * Chặn ngay cả nội dung có xác suất thấp gây hại
 */
export const STRICT_SAFETY_SETTINGS: SafetySettings = {
  harassment: SafetyThreshold.BLOCK_LOW_AND_ABOVE,
  hateSpeech: SafetyThreshold.BLOCK_LOW_AND_ABOVE,
  sexuallyExplicit: SafetyThreshold.BLOCK_LOW_AND_ABOVE,
  dangerousContent: SafetyThreshold.BLOCK_LOW_AND_ABOVE
};

/**
 * Cấu hình an toàn thoải mái
 * Chỉ chặn nội dung có xác suất cao gây hại
 */
export const RELAXED_SAFETY_SETTINGS: SafetySettings = {
  harassment: SafetyThreshold.BLOCK_ONLY_HIGH,
  hateSpeech: SafetyThreshold.BLOCK_ONLY_HIGH,
  sexuallyExplicit: SafetyThreshold.BLOCK_ONLY_HIGH,
  dangerousContent: SafetyThreshold.BLOCK_ONLY_HIGH
};

/**
 * Cấu hình an toàn cho môi trường phát triển
 * Ít hạn chế hơn để test
 */
export const DEV_SAFETY_SETTINGS: SafetySettings = {
  harassment: SafetyThreshold.BLOCK_ONLY_HIGH,
  hateSpeech: SafetyThreshold.BLOCK_ONLY_HIGH,
  sexuallyExplicit: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE,
  dangerousContent: SafetyThreshold.BLOCK_ONLY_HIGH
};

/**
 * Chuyển đổi SafetySettings thành format mà Gemini API hiểu
 */
export function convertToGeminiSafetySettings(settings: SafetySettings) {
  return [
    {
      category: SafetyCategory.HARASSMENT,
      threshold: settings.harassment
    },
    {
      category: SafetyCategory.HATE_SPEECH,
      threshold: settings.hateSpeech
    },
    {
      category: SafetyCategory.SEXUALLY_EXPLICIT,
      threshold: settings.sexuallyExplicit
    },
    {
      category: SafetyCategory.DANGEROUS_CONTENT,
      threshold: settings.dangerousContent
    }
  ];
}

/**
 * Lấy cấu hình an toàn dựa trên môi trường
 */
export function getSafetySettings(environment: 'production' | 'development' | 'strict' | 'relaxed' = 'production'): SafetySettings {
  switch (environment) {
    case 'development':
      return DEV_SAFETY_SETTINGS;
    case 'strict':
      return STRICT_SAFETY_SETTINGS;
    case 'relaxed':
      return RELAXED_SAFETY_SETTINGS;
    case 'production':
    default:
      return DEFAULT_SAFETY_SETTINGS;
  }
}

/**
 * Kiểm tra xem response có bị chặn bởi safety filter không
 */
export function isSafetyBlocked(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorObj = error as Record<string, unknown>;
  const errorMessage = (typeof errorObj.message === 'string' ? errorObj.message : '') || '';
  const errorCode = (typeof errorObj.code === 'string' ? errorObj.code : '') || '';
  
  // Kiểm tra các pattern thường gặp khi bị safety filter chặn
  const safetyPatterns = [
    'safety',
    'blocked',
    'policy',
    'harmful',
    'inappropriate',
    'SAFETY',
    'BLOCKED_REASON_SAFETY'
  ];
  
  return safetyPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
    errorCode.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Tạo thông báo lỗi thân thiện khi bị safety filter chặn
 */
export function createSafetyBlockedMessage(): string {
  return 'Yêu cầu của bạn đã bị từ chối do vi phạm chính sách an toàn. Vui lòng thử lại với nội dung phù hợp hơn.';
}

/**
 * Validate safety settings
 */
export function validateSafetySettings(settings: Partial<SafetySettings>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const validThresholds = Object.values(SafetyThreshold);
  
  if (settings.harassment && !validThresholds.includes(settings.harassment)) {
    errors.push('Invalid harassment threshold');
  }
  
  if (settings.hateSpeech && !validThresholds.includes(settings.hateSpeech)) {
    errors.push('Invalid hate speech threshold');
  }
  
  if (settings.sexuallyExplicit && !validThresholds.includes(settings.sexuallyExplicit)) {
    errors.push('Invalid sexually explicit threshold');
  }
  
  if (settings.dangerousContent && !validThresholds.includes(settings.dangerousContent)) {
    errors.push('Invalid dangerous content threshold');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}