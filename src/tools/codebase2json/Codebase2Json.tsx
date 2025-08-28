"use client";

import React, { useState, useEffect } from 'react';
import InputSection from './components/InputSection';
import FileExplorer from './components/FileExplorer';
import CodePreview from './components/CodePreview';
import ResultsDisplay from './components/ResultsDisplay';
import { getWorkerManager, terminateWorkerManager } from './utils/workerManager';

interface ProcessingResult {
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

interface WorkerResult {
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

type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';

const Codebase2Json: React.FC = () => {
  const [state, setState] = useState<ProcessingState>('idle');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<ProcessingResult['files'][0] | null>(null);

  // Cleanup worker on unmount
  useEffect(() => {
    console.log('[Codebase2Json] Component mounted, setting up cleanup');
    return () => {
      console.log('[Codebase2Json] Component unmounting, cleaning up worker');
      terminateWorkerManager();
    };
  }, []);

  // Handle ZIP file upload
  const handleZipUpload = async (file: File) => {
    console.log('[Codebase2Json] Starting ZIP upload:', { fileName: file.name, fileSize: file.size });
    setState('processing');
    setError(null);
    setProgress(0);
    setProgressMessage('Initializing...');
    setResult(null);
    setSelectedFile(null);
    console.log('[Codebase2Json] State updated for ZIP upload start');

    try {
      const workerManager = getWorkerManager();
      
      const processingResult = await workerManager.processZipFile(file, {
        onProgress: (progress, message) => {
          console.log('[Codebase2Json] ZIP Progress update:', { progress, message });
          setProgress(progress);
          setProgressMessage(message);
        },
        onError: (error) => {
          console.error('[Codebase2Json] ZIP Error callback:', error);
          setError(error);
        }
      });

      // The worker returns the data object directly, not wrapped in a ProcessingResult
      console.log('[Codebase2Json] Processing result received:', { resultKeys: Object.keys(processingResult) });
      
      // Type the result as WorkerResult since it comes directly from the worker
      const workerResult = processingResult as unknown as WorkerResult;
      
      if (workerResult && workerResult.files && workerResult.files.length > 0) {
        console.log('[Codebase2Json] ZIP processing result:', { fileCount: workerResult.files.length });
        const transformedResult: ProcessingResult = {
          files: workerResult.files,
          directories: workerResult.directories?.list || [],
          totalFiles: workerResult.summary?.totalFiles || workerResult.files.length,
          totalLines: workerResult.summary?.totalLines || workerResult.files.reduce((sum: number, f) => sum + f.lines, 0),
          languages: workerResult.languages?.map((lang) => ({
            language: lang.language,
            fileCount: lang.fileCount,
            lineCount: lang.lineCount,
            percentage: lang.linePercentage || 0
          })) || [],
          metadata: {
            timestamp: workerResult.metadata?.timestamp || new Date().toISOString(),
            version: workerResult.metadata?.version || '1.0.0',
            generator: workerResult.metadata?.generator || 'codebase2json'
          }
        };
        console.log('[Codebase2Json] Setting result and state to completed:', { fileCount: transformedResult.files.length });
        setResult(transformedResult);
        setState('completed');
        setProgress(100);
        setProgressMessage('Processing complete!');
      } else {
        console.error('[Codebase2Json] Processing failed or no data:', workerResult);
        setResult(null);
        setError('Processing failed - no files were processed');
        setState('error');
      }
    } catch (err) {
      console.error('[Codebase2Json] ZIP processing failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process ZIP file';
      setError(errorMessage);
      setState('error');
    }
  };

  // Handle GitHub repository URL
  const handleGitHubSubmit = async (url: string) => {
    console.log('[Codebase2Json] Starting GitHub import:', { url });
    setState('processing');
    setError(null);
    setProgress(0);
    setProgressMessage('Initializing...');
    setResult(null);
    setSelectedFile(null);
    console.log('[Codebase2Json] State updated for GitHub import start');

    try {
      const workerManager = getWorkerManager();
      
      const processingResult = await workerManager.processGitHubRepo(url, {
        onProgress: (progress, message) => {
          console.log('[Codebase2Json] GitHub Progress update:', { progress, message });
          setProgress(progress);
          setProgressMessage(message);
        },
        onError: (error) => {
          console.error('[Codebase2Json] GitHub Error callback:', error);
          setError(error);
        }
      });

      // The worker returns the data object directly, not wrapped in a ProcessingResult
      console.log('[Codebase2Json] GitHub processing result received:', { resultKeys: Object.keys(processingResult) });
      
      // Type the result as WorkerResult since it comes directly from the worker
      const workerResult = processingResult as unknown as WorkerResult;
      
      if (workerResult && workerResult.files && workerResult.files.length > 0) {
        console.log('[Codebase2Json] GitHub import result:', { fileCount: workerResult.files.length });
        const transformedResult: ProcessingResult = {
          files: workerResult.files,
          directories: workerResult.directories?.list || [],
          totalFiles: workerResult.summary?.totalFiles || workerResult.files.length,
          totalLines: workerResult.summary?.totalLines || workerResult.files.reduce((sum: number, f) => sum + f.lines, 0),
          languages: workerResult.languages?.map((lang) => ({
            language: lang.language,
            fileCount: lang.fileCount,
            lineCount: lang.lineCount,
            percentage: lang.linePercentage || 0
          })) || [],
          metadata: {
            timestamp: workerResult.metadata?.timestamp || new Date().toISOString(),
            version: workerResult.metadata?.version || '1.0.0',
            generator: workerResult.metadata?.generator || 'codebase2json'
          }
        };
        console.log('[Codebase2Json] Setting GitHub result and state to completed:', { fileCount: transformedResult.files.length });
        setResult(transformedResult);
        setState('completed');
        setProgress(100);
        setProgressMessage('Processing complete!');
      } else {
        console.error('[Codebase2Json] GitHub processing failed or no data:', workerResult);
        setResult(null);
        setError('GitHub processing failed - no files were processed');
        setState('error');
      }
    } catch (err) {
      console.error('[Codebase2Json] GitHub import failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process GitHub repository';
      setError(errorMessage);
      setState('error');
    }
  };

  // Handle file selection in explorer
  const handleFileSelect = (file: ProcessingResult['files'][0]) => {
    setSelectedFile(file);
  };

  // Reset to initial state
  const handleReset = () => {
    console.log('[Codebase2Json] Resetting component state');
    setState('idle');
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setSelectedFile(null);
  };

  // Render based on current state
  const renderContent = () => {
    switch (state) {
      case 'idle':
      case 'processing':
      case 'error':
        return (
          <InputSection
            onZipUpload={handleZipUpload}
            onGitHubSubmit={handleGitHubSubmit}
            isProcessing={state === 'processing'}
            progress={progress}
            progressMessage={progressMessage}
            error={error}
          />
        );
      
      case 'completed':
        if (!result) return null;
        
        return (
          <div className="space-y-6">
            <ResultsDisplay result={result} onReset={handleReset} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileExplorer
                files={result.files}
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile?.path || null}
              />
              
              <CodePreview
                file={selectedFile}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Codebase to JSON Converter</h1>
        <p className="text-muted-foreground">
          Convert your codebase files into structured JSON format with intelligent file filtering, 
          interactive exploration, and syntax-highlighted preview. Supports ZIP uploads and GitHub repositories.
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default Codebase2Json;