/**
 * Intelligent file filtering utilities to exclude non-source files
 */

// Source code file extensions
export const SOURCE_EXTENSIONS = new Set([
  // JavaScript/TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Web technologies
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.styl',
  '.vue', '.svelte', '.astro',
  // Python
  '.py', '.pyx', '.pyi', '.pyw',
  // Ruby
  '.rb', '.rbw', '.rake', '.gemspec',
  // PHP
  '.php', '.php3', '.php4', '.php5', '.phtml',
  // Java/JVM languages
  '.java', '.kt', '.kts', '.scala', '.groovy', '.clj', '.cljs',
  // C/C++
  '.c', '.cpp', '.cxx', '.cc', '.c++', '.h', '.hpp', '.hxx', '.hh', '.h++',
  // C#/.NET
  '.cs', '.vb', '.fs', '.fsx',
  // Go
  '.go',
  // Rust
  '.rs',
  // Swift
  '.swift',
  // Objective-C
  '.m', '.mm',
  // Dart
  '.dart',
  // Lua
  '.lua',
  // R
  '.r', '.R',
  // Julia
  '.jl',
  // Haskell
  '.hs', '.lhs',
  // Elm
  '.elm',
  // Erlang/Elixir
  '.erl', '.hrl', '.ex', '.exs',
  // Shell scripts
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
  // Configuration files
  '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.env',
  '.xml', '.xsl', '.xslt',
  // Documentation
  '.md', '.mdx', '.rst', '.txt', '.adoc', '.asciidoc',
  // Database
  '.sql', '.graphql', '.gql',
  // Protocol buffers
  '.proto',
  // Build files
  '.dockerfile', '.makefile', '.cmake', '.gradle', '.sbt',
  // Version control
  '.gitignore', '.gitattributes', '.gitmodules',
  // Editor config
  '.editorconfig',
  // Linting/formatting
  '.eslintrc', '.prettierrc', '.stylelintrc',
  // Package management
  '.npmrc', '.yarnrc'
]);

// Binary and non-source file extensions
export const BINARY_EXTENSIONS = new Set([
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp',
  '.svg', '.ico', '.icns', '.psd', '.ai', '.eps',
  // Videos
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v',
  // Audio
  '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a',
  // Archives
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.lz4',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.odt', '.ods', '.odp', '.rtf',
  // Executables
  '.exe', '.dll', '.so', '.dylib', '.app', '.deb', '.rpm',
  '.msi', '.dmg', '.pkg', '.bin',
  // Fonts
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  // Database files
  '.db', '.sqlite', '.sqlite3', '.mdb',
  // Compiled files
  '.class', '.jar', '.war', '.ear', '.pyc', '.pyo', '.o', '.obj',
  // Temporary files
  '.tmp', '.temp', '.cache', '.log'
]);

// Directories to exclude (common build/dependency directories)
export const EXCLUDED_DIRECTORIES = new Set([
  // Node.js
  'node_modules',
  // Python
  '__pycache__', '.pytest_cache', 'venv', 'env', '.venv', '.env',
  'site-packages', 'dist-packages',
  // Java/Maven/Gradle
  'target', 'build', 'out', 'bin', 'classes',
  '.gradle', '.m2',
  // .NET
  'obj', 'packages',
  // Ruby
  'vendor', '.bundle',
  // PHP
  'vendor',
  // Go
  'vendor',
  // Rust
  'target',
  // Build outputs
  'dist', 'build', 'out', 'output', 'release', 'debug',
  // IDE/Editor directories
  '.idea', '.vscode', '.vs', '.eclipse', '.settings',
  '.atom', '.sublime-project', '.sublime-workspace',
  // Version control
  '.git', '.svn', '.hg', '.bzr',
  // OS specific
  '.DS_Store', 'Thumbs.db', 'Desktop.ini',
  // Coverage/testing
  'coverage', '.nyc_output', '.coverage',
  // Documentation builds
  '_site', '.jekyll-cache', '.next', '.nuxt', '.vuepress',
  // Logs
  'logs', 'log',
  // Temporary
  'tmp', 'temp', '.tmp', '.temp',
  // Cache
  '.cache', 'cache'
]);

// Files to exclude by exact name
export const EXCLUDED_FILES = new Set([
  // OS files
  '.DS_Store', 'Thumbs.db', 'Desktop.ini',
  // Editor files
  '.swp', '.swo', '.tmp', '~',
  // Lock files (usually binary or generated)
  'package-lock.json', 'yarn.lock', 'composer.lock', 'Pipfile.lock',
  'poetry.lock', 'Cargo.lock', 'go.sum',
  // Large generated files
  'bundle.js', 'bundle.min.js', 'vendor.js', 'vendor.min.js'
]);

// Maximum file size for processing (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum line count for a single file
export const MAX_LINE_COUNT = 50000;

/**
 * Check if a file should be processed based on its path and extension
 */
export function isSourceFile(filePath: string): boolean {
  const fileName = getFileName(filePath);
  const extension = getFileExtension(filePath);
  
  // Check if file is explicitly excluded
  if (EXCLUDED_FILES.has(fileName)) {
    return false;
  }
  
  // Check if extension is binary
  if (BINARY_EXTENSIONS.has(extension)) {
    return false;
  }
  
  // Check if extension is a known source extension
  if (SOURCE_EXTENSIONS.has(extension)) {
    return true;
  }
  
  // Special cases for files without extensions
  if (!extension) {
    return isSpecialSourceFile(fileName);
  }
  
  return false;
}

/**
 * Check if a directory should be excluded from processing
 */
export function isExcludedDirectory(dirPath: string): boolean {
  const pathParts = dirPath.split('/').filter(part => part.length > 0);
  
  // Check each part of the path
  for (const part of pathParts) {
    if (EXCLUDED_DIRECTORIES.has(part)) {
      return true;
    }
    
    // Check for hidden directories (starting with .)
    if (part.startsWith('.') && !isAllowedHiddenDirectory(part)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a file size is acceptable for processing
 */
export function isAcceptableFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Check if a file's line count is acceptable for processing
 */
export function isAcceptableLineCount(content: string): boolean {
  const lineCount = content.split('\n').length;
  return lineCount <= MAX_LINE_COUNT;
}

/**
 * Comprehensive file filter that checks all criteria
 */
export function shouldProcessFile(
  filePath: string,
  size: number,
  content?: string
): { shouldProcess: boolean; reason?: string } {
  // Check if directory is excluded
  if (isExcludedDirectory(filePath)) {
    return {
      shouldProcess: false,
      reason: 'File is in an excluded directory'
    };
  }
  
  // Check if file is a source file
  if (!isSourceFile(filePath)) {
    return {
      shouldProcess: false,
      reason: 'File is not a recognized source file type'
    };
  }
  
  // Check file size
  if (!isAcceptableFileSize(size)) {
    return {
      shouldProcess: false,
      reason: `File size (${formatFileSize(size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
    };
  }
  
  // Check line count if content is provided
  if (content && !isAcceptableLineCount(content)) {
    const lineCount = content.split('\n').length;
    return {
      shouldProcess: false,
      reason: `File has too many lines (${lineCount}). Maximum allowed: ${MAX_LINE_COUNT}`
    };
  }
  
  return { shouldProcess: true };
}

/**
 * Filter an array of files based on processing criteria
 */
export function filterSourceFiles<T extends { path: string; size: number; content?: string }>(
  files: T[]
): { processed: T[]; excluded: Array<T & { excludeReason: string }> } {
  const processed: T[] = [];
  const excluded: Array<T & { excludeReason: string }> = [];
  
  for (const file of files) {
    const result = shouldProcessFile(file.path, file.size, file.content);
    
    if (result.shouldProcess) {
      processed.push(file);
    } else {
      excluded.push({
        ...file,
        excludeReason: result.reason || 'Unknown reason'
      });
    }
  }
  
  return { processed, excluded };
}

/**
 * Get statistics about filtered files
 */
export function getFilteringStats<T extends { path: string; size: number }>(
  originalFiles: T[],
  processedFiles: T[]
): {
  totalFiles: number;
  processedFiles: number;
  excludedFiles: number;
  totalSize: number;
  processedSize: number;
  excludedSize: number;
  exclusionRate: number;
} {
  const totalFiles = originalFiles.length;
  const processedFilesCount = processedFiles.length;
  const excludedFiles = totalFiles - processedFilesCount;
  
  const totalSize = originalFiles.reduce((sum, file) => sum + file.size, 0);
  const processedSize = processedFiles.reduce((sum, file) => sum + file.size, 0);
  const excludedSize = totalSize - processedSize;
  
  const exclusionRate = totalFiles > 0 ? (excludedFiles / totalFiles) * 100 : 0;
  
  return {
    totalFiles,
    processedFiles: processedFilesCount,
    excludedFiles,
    totalSize,
    processedSize,
    excludedSize,
    exclusionRate
  };
}

// Helper functions

/**
 * Get file name from path
 */
function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

/**
 * Get file extension from path
 */
function getFileExtension(filePath: string): string {
  const fileName = getFileName(filePath);
  const lastDot = fileName.lastIndexOf('.');
  
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }
  
  return fileName.substring(lastDot).toLowerCase();
}

/**
 * Check if a file without extension is a special source file
 */
function isSpecialSourceFile(fileName: string): boolean {
  const specialFiles = new Set([
    // Build files
    'dockerfile', 'makefile', 'rakefile', 'gemfile', 'procfile',
    'vagrantfile', 'gruntfile', 'gulpfile', 'webpack.config',
    'rollup.config', 'vite.config', 'jest.config', 'babel.config',
    // Config files
    'tsconfig', 'jsconfig', 'tslint', 'eslintrc', 'prettierrc',
    'stylelintrc', 'babelrc', 'postcss.config', 'tailwind.config',
    // Version control
    'gitignore', 'gitattributes', 'gitmodules',
    // Editor config
    'editorconfig',
    // Package files
    'package', 'composer', 'requirements', 'pipfile', 'cargo',
    'go.mod', 'build.gradle', 'pom'
  ]);
  
  const lowerFileName = fileName.toLowerCase();
  
  // Check exact matches
  if (specialFiles.has(lowerFileName)) {
    return true;
  }
  
  // Check patterns
  if (lowerFileName.startsWith('.env')) {
    return true;
  }
  
  if (lowerFileName.endsWith('.config') || lowerFileName.endsWith('.conf')) {
    return true;
  }
  
  return false;
}

/**
 * Check if a hidden directory is allowed
 */
function isAllowedHiddenDirectory(dirName: string): boolean {
  const allowedHiddenDirs = new Set([
    '.github', '.gitlab', '.circleci', '.travis',
    '.vscode', '.idea' // These are handled separately in EXCLUDED_DIRECTORIES
  ]);
  
  return allowedHiddenDirs.has(dirName);
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filePath: string): string {
  const extension = getFileExtension(filePath);
  const fileName = getFileName(filePath).toLowerCase();
  
  // Language mapping
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.mjs': 'JavaScript',
    '.cjs': 'JavaScript',
    
    // Web
    '.html': 'HTML',
    '.htm': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'Sass',
    '.less': 'Less',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    
    // Python
    '.py': 'Python',
    '.pyx': 'Python',
    '.pyi': 'Python',
    
    // Java/JVM
    '.java': 'Java',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.groovy': 'Groovy',
    '.clj': 'Clojure',
    '.cljs': 'ClojureScript',
    
    // C/C++
    '.c': 'C',
    '.cpp': 'C++',
    '.cxx': 'C++',
    '.cc': 'C++',
    '.h': 'C/C++',
    '.hpp': 'C++',
    '.hxx': 'C++',
    
    // Other languages
    '.cs': 'C#',
    '.vb': 'Visual Basic',
    '.fs': 'F#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.swift': 'Swift',
    '.m': 'Objective-C',
    '.mm': 'Objective-C++',
    '.dart': 'Dart',
    '.lua': 'Lua',
    '.r': 'R',
    '.jl': 'Julia',
    '.hs': 'Haskell',
    '.elm': 'Elm',
    '.ex': 'Elixir',
    '.exs': 'Elixir',
    '.erl': 'Erlang',
    
    // Shell
    '.sh': 'Shell',
    '.bash': 'Bash',
    '.zsh': 'Zsh',
    '.fish': 'Fish',
    '.ps1': 'PowerShell',
    '.bat': 'Batch',
    '.cmd': 'Batch',
    
    // Config/Data
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.toml': 'TOML',
    '.xml': 'XML',
    '.sql': 'SQL',
    '.graphql': 'GraphQL',
    '.gql': 'GraphQL',
    
    // Documentation
    '.md': 'Markdown',
    '.mdx': 'MDX',
    '.rst': 'reStructuredText',
    '.txt': 'Text'
  };
  
  // Check extension mapping
  if (languageMap[extension]) {
    return languageMap[extension];
  }
  
  // Check special files
  if (fileName === 'dockerfile') return 'Dockerfile';
  if (fileName === 'makefile') return 'Makefile';
  if (fileName.startsWith('.env')) return 'Environment';
  if (fileName.endsWith('rc') || fileName.endsWith('.conf')) return 'Configuration';
  
  return 'Unknown';
}