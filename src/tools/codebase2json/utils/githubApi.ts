/**
 * GitHub API integration utilities
 */

import { GitHubRepoInfo } from './validation';

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url?: string;
  content?: string;
  encoding?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTree {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface FetchOptions {
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

// Rate limiting
const RATE_LIMIT_DELAY = 100; // ms between requests
const MAX_CONCURRENT_REQUESTS = 5;

/**
 * GitHub API client with rate limiting and error handling
 */
export class GitHubApiClient {
  private baseUrl = 'https://api.github.com';
  private requestQueue: Array<() => Promise<unknown>> = [];
  private activeRequests = 0;
  private lastRequestTime = 0;

  /**
   * Make a rate-limited request to GitHub API
   */
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    console.log('[GitHubApiClient] Making request:', { url, method: options.method || 'GET', activeRequests: this.activeRequests });
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Rate limiting
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
            console.log('[GitHubApiClient] Rate limiting delay:', RATE_LIMIT_DELAY - timeSinceLastRequest, 'ms');
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
          }

          this.activeRequests++;
          this.lastRequestTime = Date.now();

          const response = await fetch(url, {
            ...options,
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Codebase2Json-Tool',
              ...options.headers
            }
          });

          console.log('[GitHubApiClient] Response received:', { url, status: response.status, statusText: response.statusText });

          if (!response.ok) {
            if (response.status === 403) {
              const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
              console.log('[GitHubApiClient] Rate limit info:', { remaining: rateLimitRemaining, resetTime: response.headers.get('X-RateLimit-Reset') });
              if (rateLimitRemaining === '0') {
                throw new Error('GitHub API rate limit exceeded. Please try again later.');
              }
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('[GitHubApiClient] Request successful:', { url, dataKeys: data && typeof data === 'object' ? Object.keys(data) : null });
          resolve(data);
        } catch (error) {
          console.error('[GitHubApiClient] Request failed:', { url, error: error instanceof Error ? error.message : error });
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the request queue with concurrency control
   */
  private processQueue() {
    if (this.activeRequests >= MAX_CONCURRENT_REQUESTS || this.requestQueue.length === 0) {
      return;
    }

    const request = this.requestQueue.shift();
    if (request) {
      request();
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;
    return this.makeRequest(url);
  }

  /**
   * Get repository tree (file structure)
   */
  async getTree(owner: string, repo: string, sha: string = 'HEAD', recursive: boolean = true): Promise<GitHubTree> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${sha}${recursive ? '?recursive=1' : ''}`;
    return this.makeRequest<GitHubTree>(url);
  }

  /**
   * Get file content
   */
  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<GitHubFile> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${ref ? `?ref=${ref}` : ''}`;
    return this.makeRequest<GitHubFile>(url);
  }

  /**
   * Get multiple file contents in batch
   */
  async getFileContentsBatch(
    owner: string,
    repo: string,
    paths: string[],
    options: FetchOptions = {}
  ): Promise<Array<{ path: string; content: string; error?: string }>> {
    const results: Array<{ path: string; content: string; error?: string }> = [];
    const total = paths.length;
    let completed = 0;

    options.onProgress?.(0, 'Starting file download...');

    // Process files in chunks to avoid overwhelming the API
    const chunkSize = 10;
    for (let i = 0; i < paths.length; i += chunkSize) {
      const chunk = paths.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (path) => {
        try {
          const file = await this.getFileContent(owner, repo, path);
          
          if (file.content && file.encoding === 'base64') {
            const content = atob(file.content.replace(/\s/g, ''));
            results.push({ path, content });
          } else if (file.download_url) {
            // Fallback to download URL for large files
            const response = await fetch(file.download_url);
            const content = await response.text();
            results.push({ path, content });
          } else {
            results.push({ path, content: '', error: 'No content available' });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ path, content: '', error: errorMessage });
          options.onError?.(`Failed to fetch ${path}: ${errorMessage}`);
        }

        completed++;
        const progress = Math.round((completed / total) * 100);
        options.onProgress?.(progress, `Downloaded ${completed}/${total} files`);
      });

      await Promise.all(chunkPromises);
    }

    return results;
  }

  /**
   * Get default branch for repository
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const repoInfo = await this.getRepository(owner, repo) as { default_branch?: string };
      return repoInfo.default_branch || 'main';
    } catch {
      return 'main'; // Fallback
    }
  }
}

/**
 * Fetch repository contents with intelligent filtering
 */
export async function fetchRepositoryContents(
  repoInfo: GitHubRepoInfo,
  options: FetchOptions = {}
): Promise<Array<{ path: string; content: string; size: number; error?: string }>> {
  console.log('[fetchRepositoryContents] Starting fetch:', { repoInfo, maxFiles: options.maxFiles, maxFileSize: options.maxFileSize });
  const client = new GitHubApiClient();
  const { owner, repo, branch = 'main' } = repoInfo;
  const { maxFiles = 1000, maxFileSize = 10 * 1024 * 1024 } = options;

  try {
    options.onProgress?.(10, 'Fetching repository structure...');

    // Get repository tree
    console.log('[fetchRepositoryContents] Getting repository tree...');
    const tree = await client.getTree(owner, repo, branch, true);
    
    console.log('[fetchRepositoryContents] Tree received:', { itemCount: tree.tree.length, truncated: tree.truncated });
    if (tree.truncated) {
      console.warn('[fetchRepositoryContents] Tree is truncated');
      options.onError?.('Repository is too large. Some files may be missing.');
    }

    // Filter for source files only
    console.log('[fetchRepositoryContents] Filtering source files...');
    const sourceFiles = tree.tree.filter(item => {
      if (item.type !== 'blob') return false;
      if (!item.size || item.size > maxFileSize) return false;
      
      return isSourceFile(item.path);
    });
    console.log('[fetchRepositoryContents] Source files found:', { count: sourceFiles.length, totalItems: tree.tree.length });

    if (sourceFiles.length === 0) {
      console.error('[fetchRepositoryContents] No source files found');
      throw new Error('No source files found in repository');
    }

    // Limit number of files
    const filesToProcess = sourceFiles.slice(0, maxFiles);
    console.log('[fetchRepositoryContents] Files to process:', { count: filesToProcess.length, limited: sourceFiles.length > maxFiles });
    
    if (sourceFiles.length > maxFiles) {
      console.warn('[fetchRepositoryContents] Limiting files:', { total: sourceFiles.length, processing: maxFiles });
      options.onError?.(`Repository contains ${sourceFiles.length} source files. Processing first ${maxFiles}.`);
    }

    options.onProgress?.(20, `Found ${filesToProcess.length} source files`);

    // Fetch file contents
    const filePaths = filesToProcess.map(file => file.path);
    console.log('[fetchRepositoryContents] Starting batch file content fetch:', { pathCount: filePaths.length });
    const fileContents = await client.getFileContentsBatch(owner, repo, filePaths, {
      onProgress: (progress, message) => {
        // Map progress from 0-100 to 20-90
        const mappedProgress = 20 + (progress * 0.7);
        console.log('[fetchRepositoryContents] Batch progress:', { progress, mappedProgress, message });
        options.onProgress?.(mappedProgress, message);
      },
      onError: options.onError
    });

    // Combine with size information
    console.log('[fetchRepositoryContents] Combining results with size info...');
    const results = fileContents.map(file => {
      const treeItem = filesToProcess.find(item => item.path === file.path);
      return {
        ...file,
        size: treeItem?.size || file.content.length
      };
    });
    console.log('[fetchRepositoryContents] Final results:', { count: results.length, totalSize: results.reduce((sum, f) => sum + f.size, 0) });

    options.onProgress?.(100, 'Repository download complete');
    return results;

  } catch (error) {
    console.error('[fetchRepositoryContents] Failed to fetch repository:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch repository: ${errorMessage}`);
  }
}

/**
 * Check if a file path represents a source code file
 */
function isSourceFile(path: string): boolean {
  // Skip common non-source directories
  const excludedDirs = [
    'node_modules', '.git', '.svn', '.hg',
    'vendor', 'build', 'dist', 'out', 'target',
    '.next', '.nuxt', '.vuepress',
    'coverage', '.nyc_output',
    '__pycache__', '.pytest_cache',
    '.idea', '.vscode', '.vs',
    'bin', 'obj', 'packages'
  ];

  const pathParts = path.split('/');
  if (pathParts.some(part => excludedDirs.includes(part))) {
    return false;
  }

  // Check file extension
  const sourceExtensions = [
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
    '.md', '.mdx', '.rst', '.txt',
    '.sql', '.graphql', '.gql', '.proto',
    '.dockerfile', '.makefile', '.cmake'
  ];

  const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
  if (sourceExtensions.includes(extension)) {
    return true;
  }

  // Check for files without extensions that are commonly source files
  const fileName = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
  const commonSourceFiles = [
    'dockerfile', 'makefile', 'rakefile', 'gemfile',
    'procfile', 'vagrantfile', 'gruntfile', 'gulpfile',
    '.gitignore', '.gitattributes', '.editorconfig',
    '.eslintrc', '.prettierrc', '.babelrc'
  ];

  return commonSourceFiles.includes(fileName) || fileName.startsWith('.env');
}

/**
 * Extract repository information from various GitHub URL formats
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  const patterns = [
    /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/tree\/([\w.-]+))?\/?$/,
    /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\.git$/,
    /^git@github\.com:([\w.-]+)\/([\w.-]+)\.git$/
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      const [, owner, repo, branch] = match;
      return {
        owner,
        repo: repo.replace(/\.git$/, ''),
        branch: branch || 'main'
      };
    }
  }

  return null;
}