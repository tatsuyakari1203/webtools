// Worker Pool utility for managing multiple image processing workers
// This provides load balancing and queue management for parallel processing

import { WorkerMessage, ProcessImagePayload, ProcessResult } from '../workers/imageProcessor.worker';

export interface WorkerTask {
  id: string;
  payload: ProcessImagePayload;
  resolve: (result: ProcessResult) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  currentTaskId?: string;
}

export class WorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private maxWorkers: number;
  private workerScript: string;

  constructor(maxWorkers?: number) {
    // Use hardware concurrency or default to 4 workers
    this.maxWorkers = maxWorkers || Math.min(navigator.hardwareConcurrency || 4, 8);
    this.workerScript = '/src/tools/image-converter/workers/imageProcessor.worker.ts';
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): WorkerInstance {
    try {
      // Create worker from URL
      const worker = new Worker(
        new URL('../workers/imageProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const workerInstance: WorkerInstance = {
        worker,
        busy: false
      };

      // Handle worker messages
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        this.handleWorkerMessage(workerInstance, event.data);
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.handleWorkerError(workerInstance, error);
      };

      this.workers.push(workerInstance);
      return workerInstance;
    } catch (error) {
      console.error('Failed to create worker:', error);
      throw new Error('Failed to initialize worker pool');
    }
  }

  private handleWorkerMessage(workerInstance: WorkerInstance, message: WorkerMessage): void {
    const { type, payload } = message;

    if (type === 'PROGRESS') {
      // Handle progress updates
      if (workerInstance.currentTaskId) {
        const task = this.activeTasks.get(workerInstance.currentTaskId);
        if (task && task.onProgress && payload && 'progress' in payload) {
          task.onProgress(payload.progress);
        }
      }
    } else if (type === 'COMPLETE') {
      // Handle task completion
      if (workerInstance.currentTaskId) {
        const task = this.activeTasks.get(workerInstance.currentTaskId);
        if (task) {
          task.resolve(payload as ProcessResult);
          this.activeTasks.delete(workerInstance.currentTaskId);
        }
      }
      this.releaseWorker(workerInstance);
    } else if (type === 'ERROR') {
      // Handle task error
      if (workerInstance.currentTaskId) {
        const task = this.activeTasks.get(workerInstance.currentTaskId);
        if (task) {
          const errorMessage = (payload && 'error' in payload) ? payload.error : 'Worker processing failed';
          task.reject(new Error(errorMessage || 'Worker processing failed'));
          this.activeTasks.delete(workerInstance.currentTaskId);
        }
      }
      this.releaseWorker(workerInstance);
    }
  }

  private handleWorkerError(workerInstance: WorkerInstance, error: ErrorEvent): void {
    if (workerInstance.currentTaskId) {
      const task = this.activeTasks.get(workerInstance.currentTaskId);
      if (task) {
        task.reject(new Error(`Worker error: ${error.message}`));
        this.activeTasks.delete(workerInstance.currentTaskId);
      }
    }
    this.releaseWorker(workerInstance);
  }

  private releaseWorker(workerInstance: WorkerInstance): void {
    workerInstance.busy = false;
    workerInstance.currentTaskId = undefined;
    
    // Process next task in queue
    this.processNextTask();
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    this.assignTaskToWorker(availableWorker, task);
  }

  private assignTaskToWorker(workerInstance: WorkerInstance, task: WorkerTask): void {
    workerInstance.busy = true;
    workerInstance.currentTaskId = task.id;
    this.activeTasks.set(task.id, task);

    // Send task to worker
    workerInstance.worker.postMessage({
      id: task.id,
      type: 'PROCESS_IMAGE',
      payload: task.payload
    } as WorkerMessage);
  }

  public async processImage(
    file: File,
    options: {
      maxSizeMB?: number;
      maxWidthOrHeight?: number;
      fileType: string;
      initialQuality: number;
      preserveExif: boolean;
    },
    onProgress?: (progress: number) => void
  ): Promise<ProcessResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert File to ArrayBuffer for worker
        const fileData = await file.arrayBuffer();
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const task: WorkerTask = {
          id: taskId,
          payload: {
            fileData,
            fileName: file.name,
            fileType: file.type,
            options: {
              outputFormat: options.fileType.replace('image/', ''),
              quality: options.initialQuality,
              maxWidth: options.maxWidthOrHeight,
              maxHeight: options.maxWidthOrHeight,
              preserveExif: options.preserveExif
            }
          },
          resolve: (result) => {
            // Memory cleanup - revoke any blob URLs if created
            resolve(result);
          },
          reject,
          onProgress
        };

        // Try to assign to available worker immediately
        const availableWorker = this.workers.find(w => !w.busy);
        if (availableWorker) {
          this.assignTaskToWorker(availableWorker, task);
        } else {
          // Add to queue if no workers available
          this.taskQueue.push(task);
        }
      } catch (error) {
        reject(new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  // Batch processing for better performance
  public async processBatch(
    files: File[],
    options: {
      maxSizeMB?: number;
      maxWidthOrHeight?: number;
      fileType: string;
      initialQuality: number;
      preserveExif: boolean;
    },
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<ProcessResult[]> {
    const batchSize = Math.min(files.length, this.workers.length * 2); // Process 2x workers at once
    const results: ProcessResult[] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map((file, batchIndex) => 
        this.processImage(file, options, (progress) => {
          if (onProgress) {
            onProgress(i + batchIndex, progress);
          }
        })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle failed processing
          results.push({
            success: false,
            error: 'Processing failed',
            originalSize: 0,
            compressedSize: 0,
            compressionRatio: 0
          });
        }
      }
    }
    
    return results;
  }

  public getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    queueLength: number;
    activeTasks: number;
  } {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size
    };
  }

  // Memory cleanup utility
  public cleanupMemory(): void {
    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as unknown as { gc: () => void }).gc();
    }
    
    // Memory cleanup - no specific task counters to reset
  }

  public terminate(): void {
    // Terminate all workers
    this.workers.forEach(workerInstance => {
      workerInstance.worker.terminate();
    });
    
    // Clear all data
    this.workers = [];
    this.taskQueue = [];
    this.activeTasks.clear();
    this.cleanupMemory();
  }
}

// Singleton instance for the application
let workerPoolInstance: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool();
  }
  return workerPoolInstance;
}

export function terminateWorkerPool(): void {
  if (workerPoolInstance) {
    workerPoolInstance.terminate();
    workerPoolInstance = null;
  }
}