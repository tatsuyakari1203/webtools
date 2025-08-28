export interface ProcessedFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
  lines: number;
  language: string;
  lastModified?: number;
}

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  lines?: number;
  children?: FileNode[];
  content?: string;
}

export interface ProcessingResult {
  files: Array<{
    path: string;
    name: string;
    extension: string;
    content: string;
    size: number;
    lines: number;
    language: string;
    lastModified?: number;
    relativePath: string;
    directory: string;
    sizeFormatted: string;
    linesPercentage: number;
  }>;
  directories: string[];
  totalFiles: number;
  totalLines: number;
  languages: Array<{
    language: string;
    fileCount: number;
    lineCount: number;
    percentage: number;
  }>;
  metadata: {
    timestamp: string;
    version: string;
    generator: string;
  };
}

export interface WorkerResult {
  files: Array<{
    path: string;
    name: string;
    extension: string;
    content: string;
    size: number;
    lines: number;
    language: string;
    lastModified?: number;
    relativePath: string;
    directory: string;
    sizeFormatted: string;
    linesPercentage: number;
  }>;
  directories: {
    list: string[];
  };
  summary: {
    totalFiles: number;
    totalLines: number;
  };
  languages: Array<{
    language: string;
    fileCount: number;
    lineCount: number;
    linePercentage: number;
  }>;
  metadata: {
    timestamp: string;
    version: string;
    generator: string;
  };
}