export interface OCRRequest {
  image: File;
  language?: string;
  accuracy?: 'standard' | 'high';
}

export interface OCRResponse {
  success: boolean;
  text: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

export interface OCRSettings {
  language: string;
  accuracy: 'standard' | 'high';
}

export interface OCRResult {
  extractedText: string;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

export const SUPPORTED_LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
] as const;

export const ACCURACY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];