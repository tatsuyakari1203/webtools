export interface CodebaseFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
  lines: number;
}

export interface CodebaseStructure {
  files: CodebaseFile[];
  directories: string[];
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>;
  metadata: {
    timestamp: string;
    version: string;
    generator: string;
  };
}

export interface ConversionOptions {
  includeContent: boolean;
  includeMetadata: boolean;
  filterExtensions: string[];
  excludeDirectories: string[];
  maxFileSize: number;
}

export interface ConversionResult {
  success: boolean;
  data?: CodebaseStructure;
  error?: string;
  processingTime: number;
}

export type SupportedLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'html'
  | 'css'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'other';

export interface LanguageStats {
  language: SupportedLanguage;
  fileCount: number;
  lineCount: number;
  percentage: number;
}