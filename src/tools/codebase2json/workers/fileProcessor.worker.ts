// Web Worker for processing files in background
// This prevents UI blocking during heavy file operations

import { shouldProcessFile, filterSourceFiles, getFilteringStats, detectLanguage } from '../utils/fileFilter';
import { fetchRepositoryContents, parseGitHubUrl } from '../utils/githubApi';

interface ZipPayload {
  file: File;
}

interface GitHubPayload {
  url: string;
}

interface FileProcessorMessage {
  type: 'PROCESS_ZIP' | 'PROCESS_GITHUB' | 'FILTER_FILES' | 'TRANSFORM_TO_JSON';
  payload: ZipPayload | GitHubPayload;
  id: string;
}

interface ProcessedFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
  lines: number;
  language: string;
  lastModified?: number;
}



// Supported source file extensions
const SOURCE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
  '.py', '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.php', '.rb', '.go', '.rs', '.swift',
  '.html', '.css', '.scss', '.sass', '.less',
  '.json', '.xml', '.yaml', '.yml', '.toml',
  '.md', '.txt', '.sql', '.sh', '.bat',
  '.dockerfile', '.gitignore', '.env'
]);

// Binary and non-source file extensions to exclude
const EXCLUDED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico',
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.mp3', '.wav', '.flac', '.aac', '.ogg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.lock', '.log', '.tmp', '.cache'
]);

// Directories to exclude
const EXCLUDED_DIRECTORIES = new Set([
  'node_modules', '.git', '.svn', '.hg',
  'dist', 'build', 'out', 'target',
  '.next', '.nuxt', '.vscode', '.idea',
  'coverage', '.nyc_output', 'logs',
  '__pycache__', '.pytest_cache',
  'vendor', 'packages'
]);

class FileProcessor {
  private postMessage(type: string, payload: unknown, id: string, progress?: number) {
    console.log('[FileProcessor] Sending message:', { type, id, progress, payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : null });
    self.postMessage({
      type,
      payload,
      id,
      progress
    });
  }

  private isSourceFile(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return SOURCE_EXTENSIONS.has(ext) && !EXCLUDED_EXTENSIONS.has(ext);
  }

  private isExcludedDirectory(path: string): boolean {
    const pathParts = path.split('/');
    return pathParts.some(part => EXCLUDED_DIRECTORIES.has(part));
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  private detectLanguage(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bat': 'batch'
    };
    return languageMap[ext] || 'text';
  }

  private countLines(content: string): number {
    return content.split('\n').length;
  }

  async processZipFile(zipFile: File, id: string): Promise<void> {
    try {
      // Validate ZIP file
      this.postMessage('PROGRESS', { message: 'Validating ZIP file...' }, id, 5);
      
      // Basic file validation
      if (zipFile.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('ZIP file is too large (max 100MB)');
      }
      
      // Dynamic import of JSZip
      const JSZip = (await import('jszip')).default;
      
      this.postMessage('PROGRESS', { message: 'Reading ZIP file...' }, id, 15);
      
      const zip = new JSZip();
      const zipData = await zip.loadAsync(zipFile);
      
      this.postMessage('PROGRESS', { message: 'Extracting files...' }, id, 30);
      
      // Collect all files for filtering
      const allFiles: Array<{ path: string; size: number; content: string; zipEntry: import('jszip').JSZipObject }> = [];
      
      for (const [path, zipEntry] of Object.entries(zipData.files)) {
        if (zipEntry.dir) continue; // Skip directories
        
        try {
          const content = await zipEntry.async('text');
          const fileSize = content.length;
          
          allFiles.push({
            path,
            size: fileSize,
            content,
            zipEntry
          });
        } catch {
          // Skip files that can't be read as text
          continue;
        }
      }
      
      // Apply intelligent filtering
      const { processed: filteredFiles, excluded: excludedFiles } = filterSourceFiles(allFiles);
      
      // Get filtering statistics
      const stats = getFilteringStats(allFiles, filteredFiles);
      
      // Send filtering stats
      this.postMessage('FILTERING_STATS', stats, id);
      
      const files: ProcessedFile[] = [];
      let processedCount = 0;
      
      for (const file of filteredFiles) {
        try {
          // Additional content-based filtering
          const contentFilter = shouldProcessFile(file.path, file.size, file.content);
          if (!contentFilter.shouldProcess) {
            console.warn(`Skipping ${file.path}: ${contentFilter.reason}`);
            continue;
          }
          
          const filename = file.path.split('/').pop() || '';
          const processedFile: ProcessedFile = {
            path: file.path,
            name: filename,
            extension: this.getFileExtension(filename),
            content: file.content,
            size: file.size,
            lines: this.countLines(file.content),
            language: detectLanguage(file.path),
            lastModified: file.zipEntry.date?.getTime()
          };
          
          files.push(processedFile);
        } catch (error) {
          console.warn(`Failed to process file ${file.path}:`, error);
        }
        
        processedCount++;
        const progress = 30 + (processedCount / filteredFiles.length) * 50;
        this.postMessage('PROGRESS', { 
          message: `Processing files... (${processedCount}/${filteredFiles.length})`,
          excluded: excludedFiles.length
        }, id, progress);
      }
      
      this.postMessage('PROGRESS', { message: 'Generating JSON...' }, id, 90);
      
      const result = this.transformToJSON(files);
      
      this.postMessage('SUCCESS', result, id, 100);
      
    } catch (error) {
      this.postMessage('ERROR', { 
        error: error instanceof Error ? error.message : 'Failed to process ZIP file' 
      }, id);
    }
  }

  async processGitHubRepo(repoUrl: string, id: string): Promise<void> {
    console.log('[FileProcessor] Starting GitHub repo processing:', { repoUrl, id });
    try {
      // Parse and validate GitHub URL
      this.postMessage('PROGRESS', { message: 'Validating GitHub URL...' }, id, 5);
      
      const repoInfo = parseGitHubUrl(repoUrl);
      console.log('[FileProcessor] Parsed repo info:', repoInfo);
      if (!repoInfo) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      // Fetch repository contents using the sophisticated GitHub API client
      console.log('[FileProcessor] Fetching repository contents...');
      const fileContents = await fetchRepositoryContents(repoInfo, {
        onProgress: (progress, message) => {
          // Map progress from 0-100 to 10-90
          const mappedProgress = 10 + (progress * 0.8);
          console.log('[FileProcessor] GitHub API progress:', { progress, mappedProgress, message });
          this.postMessage('PROGRESS', { message }, id, mappedProgress);
        },
        onError: (error) => {
          console.warn('[FileProcessor] GitHub API warning:', error);
        },
        maxFiles: 1000,
        maxFileSize: 10 * 1024 * 1024 // 10MB
      });
      
      console.log('[FileProcessor] Fetched file contents:', { count: fileContents.length });
      if (fileContents.length === 0) {
        throw new Error('No source files found in repository');
      }
      
      // Convert to ProcessedFile format
      console.log('[FileProcessor] Converting to ProcessedFile format...');
      const files: ProcessedFile[] = fileContents.map(file => ({
        path: file.path,
        name: file.path.split('/').pop() || file.path,
        extension: this.getFileExtension(file.path),
        content: file.content,
        size: file.size,
        lines: this.countLines(file.content),
        language: detectLanguage(file.path)
      }));
      console.log('[FileProcessor] Converted files:', { count: files.length });
      
      this.postMessage('PROGRESS', { message: 'Generating JSON...' }, id, 95);
      
      console.log('[FileProcessor] Transforming to JSON...');
      const result = this.transformToJSON(files);
      console.log('[FileProcessor] JSON transformation complete:', { resultKeys: Object.keys(result) });
      
      this.postMessage('SUCCESS', result, id, 100);
      
    } catch (error) {
      console.error('[FileProcessor] GitHub repo processing failed:', error);
      this.postMessage('ERROR', { 
        error: error instanceof Error ? error.message : 'Failed to process GitHub repository' 
      }, id);
    }
  }



  private transformToJSON(files: ProcessedFile[]) {
    // Calculate comprehensive statistics
    const languageStats: Record<string, { fileCount: number; lineCount: number; totalSize: number }> = {};
    const extensionStats: Record<string, number> = {};
    const directoryStats: Record<string, { fileCount: number; totalSize: number }> = {};
    
    let totalSize = 0;
    let totalLines = 0;
    const fileSizes: number[] = [];
    
    files.forEach(file => {
      const language = file.language || this.detectLanguage(file.name);
      const extension = file.extension || this.getFileExtension(file.name);
      const directory = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
      
      // Language statistics
      if (!languageStats[language]) {
        languageStats[language] = { fileCount: 0, lineCount: 0, totalSize: 0 };
      }
      languageStats[language].fileCount++;
      languageStats[language].lineCount += file.lines;
      languageStats[language].totalSize += file.size;
      
      // Extension statistics
      extensionStats[extension] = (extensionStats[extension] || 0) + 1;
      
      // Directory statistics
      if (!directoryStats[directory]) {
        directoryStats[directory] = { fileCount: 0, totalSize: 0 };
      }
      directoryStats[directory].fileCount++;
      directoryStats[directory].totalSize += file.size;
      
      // Overall statistics
      totalSize += file.size;
      totalLines += file.lines;
      fileSizes.push(file.size);
    });
    
    // Calculate percentages and sort languages by line count
    const languages = Object.entries(languageStats)
      .map(([language, stats]) => ({
        language,
        fileCount: stats.fileCount,
        lineCount: stats.lineCount,
        totalSize: stats.totalSize,
        linePercentage: totalLines > 0 ? (stats.lineCount / totalLines) * 100 : 0,
        sizePercentage: totalSize > 0 ? (stats.totalSize / totalSize) * 100 : 0
      }))
      .sort((a, b) => b.lineCount - a.lineCount);
    
    // Extract and organize directory structure
    const directories = new Set<string>();
    const directoryTree: Record<string, string[]> = {};
    
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(part => part.length > 0);
      
      // Build directory hierarchy
      for (let i = 0; i < pathParts.length - 1; i++) {
        const currentPath = pathParts.slice(0, i + 1).join('/');
        directories.add(currentPath);
        
        const parentPath = i > 0 ? pathParts.slice(0, i).join('/') : '';
        if (!directoryTree[parentPath]) {
          directoryTree[parentPath] = [];
        }
        if (!directoryTree[parentPath].includes(pathParts[i])) {
          directoryTree[parentPath].push(pathParts[i]);
        }
      }
    });
    
    // Calculate file size statistics
    fileSizes.sort((a, b) => a - b);
    const averageFileSize = totalSize / files.length;
    const medianFileSize = fileSizes.length > 0 ? 
      fileSizes.length % 2 === 0 ? 
        (fileSizes[fileSizes.length / 2 - 1] + fileSizes[fileSizes.length / 2]) / 2 :
        fileSizes[Math.floor(fileSizes.length / 2)] : 0;
    
    // Top extensions by file count
    const topExtensions = Object.entries(extensionStats)
      .map(([ext, count]) => ({ extension: ext, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Top directories by file count
    const topDirectories = Object.entries(directoryStats)
      .map(([dir, stats]) => ({ 
        directory: dir || '(root)', 
        fileCount: stats.fileCount, 
        totalSize: stats.totalSize 
      }))
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, 10);
    
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        generator: 'WebTools Codebase2JSON',
        processingTime: Date.now(),
        source: 'file-upload' // This will be updated based on the source
      },
      summary: {
        totalFiles: files.length,
        totalLines,
        totalSize,
        averageFileSize: Math.round(averageFileSize),
        medianFileSize: Math.round(medianFileSize),
        largestFile: Math.max(...fileSizes),
        smallestFile: Math.min(...fileSizes),
        uniqueLanguages: languages.length,
        uniqueExtensions: Object.keys(extensionStats).length,
        directoryCount: directories.size
      },
      languages,
      extensions: topExtensions,
      directories: {
        list: Array.from(directories).sort(),
        tree: directoryTree,
        stats: topDirectories
      },
      files: files.map(file => ({
        ...file,
        // Add relative path for better organization
        relativePath: file.path,
        directory: file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '',
        // Add file size in human readable format
        sizeFormatted: this.formatFileSize(file.size),
        // Add percentage of total lines
        linesPercentage: totalLines > 0 ? (file.lines / totalLines) * 100 : 0
      }))
    };
  }
  
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

const processor = new FileProcessor();

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<FileProcessorMessage>) => {
  const { type, payload, id } = event.data;
  
  switch (type) {
    case 'PROCESS_ZIP':
      if ('file' in payload) {
        await processor.processZipFile(payload.file, id);
      }
      break;
      
    case 'PROCESS_GITHUB':
      if ('url' in payload) {
        await processor.processGitHubRepo(payload.url, id);
      }
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        payload: { error: `Unknown message type: ${type}` },
        id
      });
  }
};

// Export for TypeScript
export {};