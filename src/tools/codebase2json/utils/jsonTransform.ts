/**
 * JSON transformation utilities for codebase processing
 */

export interface TransformOptions {
  includeContent?: boolean;
  includeMetadata?: boolean;
  includeStatistics?: boolean;
  minifyOutput?: boolean;
  sortBy?: 'path' | 'size' | 'lines' | 'language';
  filterLanguages?: string[];
  maxFileSize?: number;
  excludeEmptyFiles?: boolean;
}

export interface CodebaseJSON {
  metadata: {
    timestamp: string;
    version: string;
    generator: string;
    processingTime: number;
    source: string;
    options?: TransformOptions;
  };
  summary: {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    averageFileSize: number;
    medianFileSize: number;
    largestFile: number;
    smallestFile: number;
    uniqueLanguages: number;
    uniqueExtensions: number;
    directoryCount: number;
  };
  languages: Array<{
    language: string;
    fileCount: number;
    lineCount: number;
    totalSize: number;
    linePercentage: number;
    sizePercentage: number;
  }>;
  extensions: Array<{
    extension: string;
    count: number;
  }>;
  directories: {
    list: string[];
    tree: Record<string, string[]>;
    stats: Array<{
      directory: string;
      fileCount: number;
      totalSize: number;
    }>;
  };
  files: Array<{
    path: string;
    name: string;
    extension: string;
    language: string;
    size: number;
    lines: number;
    content?: string;
    relativePath: string;
    directory: string;
    sizeFormatted: string;
    linesPercentage: number;
    lastModified?: number;
  }>;
}

/**
 * Transform processed files into structured JSON format
 */
export function transformToCodebaseJSON(
  data: Partial<CodebaseJSON>,
  options: TransformOptions = {}
): CodebaseJSON {
  const {
    includeContent = true,
    includeMetadata = true,
    includeStatistics = true,
    sortBy = 'path',
    filterLanguages = [],
    maxFileSize,
    excludeEmptyFiles = false
  } = options;

  // Filter files based on options
  let filteredFiles = data.files || [];

  if (filterLanguages.length > 0) {
    filteredFiles = filteredFiles.filter((file) => 
      filterLanguages.includes(file.language)
    );
  }

  if (maxFileSize) {
    filteredFiles = filteredFiles.filter((file) => 
      file.size <= maxFileSize
    );
  }

  if (excludeEmptyFiles) {
    filteredFiles = filteredFiles.filter((file) => 
      file.lines > 0 && file.size > 0
    );
  }

  // Sort files
  filteredFiles.sort((a, b) => {
    switch (sortBy) {
      case 'size':
        return b.size - a.size;
      case 'lines':
        return b.lines - a.lines;
      case 'language':
        return a.language.localeCompare(b.language);
      case 'path':
      default:
        return a.path.localeCompare(b.path);
    }
  });

  // Process files for output
  const processedFiles: CodebaseJSON['files'] = filteredFiles.map((file) => {
    const processedFile: CodebaseJSON['files'][0] = {
      path: file.path,
      name: file.name,
      extension: file.extension,
      language: file.language,
      size: file.size,
      lines: file.lines,
      relativePath: file.relativePath || file.path,
      directory: file.directory || '',
      sizeFormatted: file.sizeFormatted || formatFileSize(file.size),
      linesPercentage: file.linesPercentage || 0
    };

    if (includeContent) {
      processedFile.content = file.content;
    }

    if (file.lastModified) {
      processedFile.lastModified = file.lastModified;
    }

    return processedFile;
  });

  // Recalculate statistics for filtered data
  const recalculatedStats = calculateStatistics(processedFiles);

  const result: CodebaseJSON = {
    metadata: {
      timestamp: data.metadata?.timestamp || new Date().toISOString(),
      version: data.metadata?.version || '1.0.0',
      generator: data.metadata?.generator || 'codebase2json',
      processingTime: data.metadata?.processingTime || 0,
      source: data.metadata?.source || 'unknown',
      ...(includeMetadata && { options })
    },
    summary: includeStatistics ? recalculatedStats.summary : (data.summary || {
      totalFiles: 0,
      totalLines: 0,
      totalSize: 0,
      averageFileSize: 0,
      medianFileSize: 0,
      largestFile: 0,
      smallestFile: 0,
      uniqueLanguages: 0,
      uniqueExtensions: 0,
      directoryCount: 0
    }),
    languages: includeStatistics ? recalculatedStats.languages : (data.languages || []),
    extensions: includeStatistics ? recalculatedStats.extensions : (data.extensions || []),
    directories: includeStatistics ? recalculatedStats.directories : (data.directories || {
      list: [],
      tree: {},
      stats: []
    }),
    files: processedFiles
  };

  return result;
}

/**
 * Recalculate statistics for filtered files
 */
function calculateStatistics(files: CodebaseJSON['files']) {
  const languageStats: Record<string, { fileCount: number; lineCount: number; totalSize: number }> = {};
  const extensionStats: Record<string, number> = {};
  const directoryStats: Record<string, { fileCount: number; totalSize: number }> = {};
  
  let totalSize = 0;
  let totalLines = 0;
  const fileSizes: number[] = [];
  const directories = new Set<string>();
  
  files.forEach(file => {
    const language = file.language;
    const extension = file.extension;
    const directory = file.directory;
    
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
    
    // Directory tracking
    if (directory) {
      const pathParts = directory.split('/').filter((part: string) => part.length > 0);
      for (let i = 0; i < pathParts.length; i++) {
        directories.add(pathParts.slice(0, i + 1).join('/'));
      }
    }
  });
  
  // Calculate file size statistics
  fileSizes.sort((a, b) => a - b);
  const averageFileSize = files.length > 0 ? totalSize / files.length : 0;
  const medianFileSize = fileSizes.length > 0 ? 
    fileSizes.length % 2 === 0 ? 
      (fileSizes[fileSizes.length / 2 - 1] + fileSizes[fileSizes.length / 2]) / 2 :
      fileSizes[Math.floor(fileSizes.length / 2)] : 0;
  
  // Process language statistics
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
  
  // Process extension statistics
  const extensions = Object.entries(extensionStats)
    .map(([ext, count]) => ({ extension: ext, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Process directory statistics
  const directoryStatsList = Object.entries(directoryStats)
    .map(([dir, stats]) => ({ 
      directory: dir || '(root)', 
      fileCount: stats.fileCount, 
      totalSize: stats.totalSize 
    }))
    .sort((a, b) => b.fileCount - a.fileCount)
    .slice(0, 10);
  
  return {
    summary: {
      totalFiles: files.length,
      totalLines,
      totalSize,
      averageFileSize: Math.round(averageFileSize),
      medianFileSize: Math.round(medianFileSize),
      largestFile: fileSizes.length > 0 ? Math.max(...fileSizes) : 0,
      smallestFile: fileSizes.length > 0 ? Math.min(...fileSizes) : 0,
      uniqueLanguages: languages.length,
      uniqueExtensions: Object.keys(extensionStats).length,
      directoryCount: directories.size
    },
    languages,
    extensions,
    directories: {
      list: Array.from(directories).sort(),
      tree: {}, // Would need to rebuild tree structure
      stats: directoryStatsList
    }
  };
}

/**
 * Create different export formats
 */
export function createExportFormats(data: CodebaseJSON) {
  return {
    // Full JSON with all data
    full: JSON.stringify(data, null, 2),
    
    // Minified JSON
    minified: JSON.stringify(data),
    
    // Statistics only
    statsOnly: JSON.stringify({
      metadata: data.metadata,
      summary: data.summary,
      languages: data.languages,
      extensions: data.extensions,
      directories: data.directories
    }, null, 2),
    
    // Files only (no content)
    filesOnly: JSON.stringify({
      metadata: data.metadata,
      files: data.files.map(file => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content: _content, ...fileWithoutContent } = file;
        return fileWithoutContent;
      })
    }, null, 2),
    
    // Content only
    contentOnly: JSON.stringify({
      metadata: data.metadata,
      files: data.files.map(file => ({
        path: file.path,
        language: file.language,
        content: file.content
      }))
    }, null, 2)
  };
}

/**
 * Generate download filename based on options
 */
export function generateFilename(
  data: CodebaseJSON,
  format: 'full' | 'minified' | 'stats' | 'files' | 'content' = 'full'
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const source = data.metadata.source || 'codebase';
  const totalFiles = data.summary.totalFiles;
  
  const formatSuffix = format === 'full' ? '' : `-${format}`;
  
  return `${source}-${totalFiles}files-${timestamp}${formatSuffix}.json`;
}

/**
 * Validate JSON structure
 */
export function validateCodebaseJSON(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Type guard to check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { isValid: false, errors };
  }
  
  const dataObj = data as Record<string, unknown>;
  
  // Check required top-level properties
  const requiredProps = ['metadata', 'summary', 'languages', 'extensions', 'directories', 'files'];
  for (const prop of requiredProps) {
    if (!dataObj[prop]) {
      errors.push(`Missing required property: ${prop}`);
    }
  }
  
  // Check metadata structure
  if (dataObj.metadata && typeof dataObj.metadata === 'object') {
    const metadata = dataObj.metadata as Record<string, unknown>;
    const requiredMetadata = ['timestamp', 'version', 'generator'];
    for (const prop of requiredMetadata) {
      if (!metadata[prop]) {
        errors.push(`Missing required metadata property: ${prop}`);
      }
    }
  }
  
  // Check files array
  if (dataObj.files && Array.isArray(dataObj.files)) {
    dataObj.files.forEach((file: unknown, index: number) => {
      if (file && typeof file === 'object') {
        const fileObj = file as Record<string, unknown>;
        const requiredFileProps = ['path', 'name', 'extension', 'language', 'size', 'lines'];
        for (const prop of requiredFileProps) {
          if (fileObj[prop] === undefined || fileObj[prop] === null) {
            errors.push(`File ${index}: Missing required property: ${prop}`);
          }
        }
      } else {
        errors.push(`File ${index}: Must be an object`);
      }
    });
  } else if (dataObj.files) {
    errors.push('Files property must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Create summary report in markdown format
 */
export function createMarkdownSummary(data: CodebaseJSON): string {
  const { summary, languages, extensions, directories } = data;
  
  let markdown = `# Codebase Analysis Report\n\n`;
  
  // Summary section
  markdown += `## Summary\n\n`;
  markdown += `- **Total Files:** ${summary.totalFiles.toLocaleString()}\n`;
  markdown += `- **Total Lines:** ${summary.totalLines.toLocaleString()}\n`;
  markdown += `- **Total Size:** ${formatFileSize(summary.totalSize)}\n`;
  markdown += `- **Average File Size:** ${formatFileSize(summary.averageFileSize)}\n`;
  markdown += `- **Languages:** ${summary.uniqueLanguages}\n`;
  markdown += `- **Extensions:** ${summary.uniqueExtensions}\n`;
  markdown += `- **Directories:** ${summary.directoryCount}\n\n`;
  
  // Languages section
  if (languages.length > 0) {
    markdown += `## Languages\n\n`;
    markdown += `| Language | Files | Lines | Size | % Lines |\n`;
    markdown += `|----------|-------|-------|------|---------|\n`;
    
    languages.slice(0, 10).forEach(lang => {
      markdown += `| ${lang.language} | ${lang.fileCount} | ${lang.lineCount.toLocaleString()} | ${formatFileSize(lang.totalSize)} | ${lang.linePercentage.toFixed(1)}% |\n`;
    });
    markdown += `\n`;
  }
  
  // Extensions section
  if (extensions.length > 0) {
    markdown += `## File Extensions\n\n`;
    markdown += `| Extension | Count |\n`;
    markdown += `|-----------|-------|\n`;
    
    extensions.slice(0, 10).forEach(ext => {
      markdown += `| ${ext.extension || '(no extension)'} | ${ext.count} |\n`;
    });
    markdown += `\n`;
  }
  
  // Directories section
  if (directories.stats.length > 0) {
    markdown += `## Top Directories\n\n`;
    markdown += `| Directory | Files | Size |\n`;
    markdown += `|-----------|-------|------|\n`;
    
    directories.stats.slice(0, 10).forEach(dir => {
      markdown += `| ${dir.directory} | ${dir.fileCount} | ${formatFileSize(dir.totalSize)} |\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `*Generated by ${data.metadata.generator} on ${new Date(data.metadata.timestamp).toLocaleString()}*\n`;
  
  return markdown;
}