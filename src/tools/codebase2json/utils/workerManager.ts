// Worker Manager for handling web worker communication
// Provides a clean interface for interacting with the file processor worker

interface ProcessedFile {
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
}

interface WorkerMessage {
  type: string;
  payload: unknown;
  id: string;
  progress?: number;
}

interface ProcessingOptions {
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: string) => void;
}

interface ProcessingResult {
  success: boolean;
  data?: {
    metadata: {
      timestamp: string;
      version: string;
      generator: string;
      processingTime: number;
      source: string;
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
    files: ProcessedFile[];
  };
  error?: string;
  progress?: number;
}

export class WorkerManager {
  private worker: Worker | null = null;
  private pendingTasks = new Map<string, {
    resolve: (result: ProcessingResult) => void;
    reject: (error: Error) => void;
    options?: ProcessingOptions;
  }>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Create worker from the TypeScript file
      // In production, this would be compiled to JavaScript
      this.worker = new Worker(
        new URL('../workers/fileProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.rejectAllPendingTasks(new Error('Worker encountered an error'));
      };

    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }
  }

  private handleWorkerMessage(message: WorkerMessage) {
    const { type, payload, id, progress } = message;
    console.log('[WorkerManager] Received message:', { type, id, progress, payloadKeys: payload ? Object.keys(payload) : null });
    
    const task = this.pendingTasks.get(id);

    if (!task) {
      console.warn('[WorkerManager] Received message for unknown task:', id, 'Available tasks:', Array.from(this.pendingTasks.keys()));
      return;
    }

    switch (type) {
      case 'PROGRESS':
        if (task.options?.onProgress && progress !== undefined) {
          const progressData = payload as { message: string };
          console.log('[WorkerManager] Progress update:', { id, progress, message: progressData.message });
          task.options.onProgress(progress, progressData.message);
        }
        break;

      case 'SUCCESS':
        console.log('[WorkerManager] Task completed successfully:', id);
        this.pendingTasks.delete(id);
        task.resolve(payload as ProcessingResult);
        break;

      case 'ERROR':
        this.pendingTasks.delete(id);
        const errorData = payload as { error: string };
        console.error('[WorkerManager] Task failed:', id, errorData.error);
        const error = new Error(errorData.error);
        if (task.options?.onError) {
          task.options.onError(errorData.error);
        }
        task.reject(error);
        break;

      case 'FILTERING_STATS':
        // Handle filtering statistics message (optional progress info)
        console.log('[WorkerManager] Filtering stats:', { id, progress, payload });
        if (task.options?.onProgress) {
          const statsData = payload as { message: string };
          task.options.onProgress(progress || 0, statsData.message || 'Processing files...');
        }
        break;

      default:
        console.warn('[WorkerManager] Unknown message type:', type, 'Full message:', message);
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private rejectAllPendingTasks(error: Error) {
    for (const task of this.pendingTasks.values()) {
      task.reject(error);
    }
    this.pendingTasks.clear();
  }

  async processZipFile(file: File, options?: ProcessingOptions): Promise<ProcessingResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const taskId = this.generateTaskId();

    return new Promise<ProcessingResult>((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve, reject, options });

      this.worker!.postMessage({
        type: 'PROCESS_ZIP',
        payload: { file },
        id: taskId
      });
    });
  }

  async processGitHubRepo(url: string, options?: ProcessingOptions): Promise<ProcessingResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const taskId = this.generateTaskId();

    return new Promise<ProcessingResult>((resolve, reject) => {
      this.pendingTasks.set(taskId, { resolve, reject, options });

      this.worker!.postMessage({
        type: 'PROCESS_GITHUB',
        payload: { url },
        id: taskId
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.rejectAllPendingTasks(new Error('Worker terminated'));
  }

  isReady(): boolean {
    return this.worker !== null;
  }

  getPendingTaskCount(): number {
    return this.pendingTasks.size;
  }
}

// Singleton instance for global use
let workerManagerInstance: WorkerManager | null = null;

export function getWorkerManager(): WorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new WorkerManager();
  }
  return workerManagerInstance;
}

export function terminateWorkerManager() {
  if (workerManagerInstance) {
    workerManagerInstance.terminate();
    workerManagerInstance = null;
  }
}