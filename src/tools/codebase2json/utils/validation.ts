/**
 * Validation utilities for ZIP files and GitHub repositories
 */

// Supported file extensions for source code
const SOURCE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
  '.py', '.rb', '.php', '.java', '.kt', '.scala',
  '.go', '.rs', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.vb', '.fs', '.ml', '.hs', '.elm',
  '.swift', '.m', '.mm', '.dart', '.lua',
  '.r', '.jl', '.clj', '.cljs', '.ex', '.exs',
  '.sh', '.bash', '.zsh', '.fish', '.ps1',
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  '.xml', '.xsl', '.xslt', '.json', '.yaml', '.yml',
  '.toml', '.ini', '.cfg', '.conf', '.env',
  '.md', '.mdx', '.rst', '.txt', '.log',
  '.sql', '.graphql', '.gql', '.proto',
  '.dockerfile', '.makefile', '.cmake',
  '.gitignore', '.gitattributes', '.editorconfig'
]);

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum ZIP file size (100MB)
const MAX_ZIP_SIZE = 100 * 1024 * 1024;

// GitHub URL patterns
const GITHUB_URL_PATTERNS = [
  /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w.-]+))?\/?$/,
  /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\.git$/,
  /^git@github\.com:([\w.-]+)\/([\w.-]+)\.git$/
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

/**
 * Validate ZIP file integrity and size
 */
export async function validateZipFile(file: File): Promise<ValidationResult> {
  const warnings: string[] = [];

  // Check file type
  if (!file.type.includes('zip') && !file.name.toLowerCase().endsWith('.zip')) {
    return {
      isValid: false,
      error: 'File must be a ZIP archive'
    };
  }

  // Check file size
  if (file.size > MAX_ZIP_SIZE) {
    return {
      isValid: false,
      error: `ZIP file is too large. Maximum size is ${formatFileSize(MAX_ZIP_SIZE)}`
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'ZIP file is empty'
    };
  }

  // Basic ZIP file structure validation
  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);
    
    // Check for ZIP file signature (PK)
    if (view.getUint16(0, true) !== 0x4b50) {
      return {
        isValid: false,
        error: 'Invalid ZIP file format'
      };
    }

    // Check for minimum ZIP structure
    if (buffer.byteLength < 22) {
      return {
        isValid: false,
        error: 'ZIP file appears to be corrupted'
      };
    }

    // Warn about large files
    if (file.size > 50 * 1024 * 1024) {
      warnings.push('Large ZIP file detected. Processing may take longer.');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch {
    return {
      isValid: false,
      error: 'Failed to validate ZIP file structure'
    };
  }
}

/**
 * Validate GitHub repository URL and extract repository information
 */
export function validateGitHubUrl(url: string): ValidationResult & { repoInfo?: GitHubRepoInfo } {
  console.log('[validateGitHubUrl] Starting validation:', { url, type: typeof url });
  
  if (!url || typeof url !== 'string') {
    console.log('[validateGitHubUrl] URL validation failed: not a string or empty');
    return {
      isValid: false,
      error: 'URL is required'
    };
  }

  const trimmedUrl = url.trim();
  console.log('[validateGitHubUrl] Trimmed URL:', { trimmedUrl, length: trimmedUrl.length });
  
  if (!trimmedUrl) {
    console.log('[validateGitHubUrl] URL validation failed: empty after trim');
    return {
      isValid: false,
      error: 'URL cannot be empty'
    };
  }

  // Check if URL matches GitHub patterns
  console.log('[validateGitHubUrl] Testing against GitHub patterns:', GITHUB_URL_PATTERNS.length);
  for (const pattern of GITHUB_URL_PATTERNS) {
    console.log('[validateGitHubUrl] Testing pattern:', pattern.source);
    const match = trimmedUrl.match(pattern);
    if (match) {
      console.log('[validateGitHubUrl] Pattern matched:', { match });
      const [, owner, repo, branch] = match;
      console.log('[validateGitHubUrl] Extracted components:', { owner, repo, branch });
      
      // Validate owner and repo names
      const ownerValid = isValidGitHubName(owner);
      console.log('[validateGitHubUrl] Owner validation:', { owner, valid: ownerValid });
      if (!ownerValid) {
        console.log('[validateGitHubUrl] URL validation failed: invalid owner name');
        return {
          isValid: false,
          error: 'Invalid GitHub username/organization name'
        };
      }
      
      const cleanRepo = repo.replace(/\.git$/, '');
      const repoValid = isValidGitHubName(cleanRepo);
      console.log('[validateGitHubUrl] Repo validation:', { repo, cleanRepo, valid: repoValid });
      if (!repoValid) {
        console.log('[validateGitHubUrl] URL validation failed: invalid repo name');
        return {
          isValid: false,
          error: 'Invalid GitHub repository name'
        };
      }

      const result = {
        isValid: true,
        repoInfo: {
          owner,
          repo: cleanRepo,
          branch: branch || 'main'
        }
      };
      console.log('[validateGitHubUrl] URL validation successful:', result);
      return result;
    }
  }

  console.log('[validateGitHubUrl] URL validation failed: no pattern matched');
  return {
    isValid: false,
    error: 'Invalid GitHub repository URL. Please provide a valid GitHub repository URL.'
  };
}

/**
 * Check if GitHub repository is accessible
 */
export async function validateGitHubAccess(repoInfo: GitHubRepoInfo): Promise<ValidationResult> {
  try {
    const { owner, repo, branch = 'main' } = repoInfo;
    
    // Check if repository exists and is accessible
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'HEAD'
    });

    if (repoResponse.status === 404) {
      return {
        isValid: false,
        error: 'Repository not found or is private'
      };
    }

    if (repoResponse.status === 403) {
      return {
        isValid: false,
        error: 'Access denied. Repository may be private or rate limit exceeded.'
      };
    }

    if (!repoResponse.ok) {
      return {
        isValid: false,
        error: `Failed to access repository (HTTP ${repoResponse.status})`
      };
    }

    // Check if branch exists
    const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
      method: 'HEAD'
    });

    if (branchResponse.status === 404) {
      return {
        isValid: false,
        error: `Branch '${branch}' not found. Repository may use 'master' instead of 'main'.`
      };
    }

    return {
      isValid: true
    };
  } catch {
    return {
      isValid: false,
      error: 'Failed to validate repository access. Please check your internet connection.'
    };
  }
}

/**
 * Validate individual file for processing
 */
export function validateSourceFile(fileName: string, fileSize: number): ValidationResult {
  const warnings: string[] = [];

  // Check file extension
  const extension = getFileExtension(fileName);
  if (!SOURCE_EXTENSIONS.has(extension)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${extension}`
    };
  }

  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File is too large: ${formatFileSize(fileSize)}. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  // Warn about large files
  if (fileSize > 1024 * 1024) {
    warnings.push(`Large file detected: ${formatFileSize(fileSize)}`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Check if a name is valid for GitHub (username or repository)
 */
function isValidGitHubName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (name.length > 39) return false;
  if (name.startsWith('-') || name.endsWith('-')) return false;
  if (name.startsWith('.') || name.endsWith('.')) return false;
  
  // Only alphanumeric characters, hyphens, and dots
  return /^[a-zA-Z0-9.-]+$/.test(name);
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return '';
  }
  return fileName.substring(lastDot).toLowerCase();
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
 * Validate batch of files for processing
 */
export function validateFilesBatch(files: Array<{ name: string; size: number }>): ValidationResult {
  const warnings: string[] = [];
  let validFiles = 0;
  let totalSize = 0;

  for (const file of files) {
    const validation = validateSourceFile(file.name, file.size);
    if (validation.isValid) {
      validFiles++;
      totalSize += file.size;
    }
    if (validation.warnings) {
      warnings.push(...validation.warnings);
    }
  }

  if (validFiles === 0) {
    return {
      isValid: false,
      error: 'No valid source files found in the archive'
    };
  }

  // Warn about large total size
  if (totalSize > 50 * 1024 * 1024) {
    warnings.push(`Large total file size: ${formatFileSize(totalSize)}. Processing may take longer.`);
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

export { SOURCE_EXTENSIONS, MAX_FILE_SIZE, MAX_ZIP_SIZE };