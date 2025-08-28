"use client";

import React, { useState, useCallback } from 'react';
import { Upload, Github, FileArchive, Link, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface InputSectionProps {
  onZipUpload: (file: File) => void;
  onGitHubSubmit: (url: string) => void;
  isProcessing: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;
}

const InputSection: React.FC<InputSectionProps> = ({
  onZipUpload,
  onGitHubSubmit,
  isProcessing,
  progress,
  progressMessage,
  error
}) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlError, setUrlError] = useState('');

  // Validate GitHub URL
  const validateGitHubUrl = (url: string): boolean => {
    const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubPattern.test(url.trim());
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const zipFile = files.find(file => 
      file.type === 'application/zip' || 
      file.type === 'application/x-zip-compressed' ||
      file.name.toLowerCase().endsWith('.zip')
    );

    if (zipFile) {
      setSelectedFile(zipFile);
      if (!isProcessing) {
        onZipUpload(zipFile);
      }
    }
  }, [isProcessing, onZipUpload]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[InputSection] ZIP file selected:', { fileName: file?.name, fileSize: file?.size, fileType: file?.type });
    if (file && (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip'))) {
      setSelectedFile(file);
      if (!isProcessing) {
        onZipUpload(file);
      }
    }
  };

  // Handle GitHub URL submission
  const handleGitHubSubmit = () => {
    const trimmedUrl = githubUrl.trim();
    console.log('[InputSection] GitHub URL submitted:', { url: trimmedUrl });
    
    if (!trimmedUrl) {
      setUrlError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateGitHubUrl(trimmedUrl)) {
      setUrlError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setUrlError('');
    onGitHubSubmit(trimmedUrl);
  };

  // Handle GitHub URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('[InputSection] GitHub URL changed:', { url: value, length: value.length });
    setGithubUrl(value);
    
    if (urlError && value.trim()) {
      console.log('[InputSection] URL validation result:', { isValid: true, error: null });
      setUrlError('');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Processing...</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{progressMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Tabs */}
      <Tabs defaultValue="zip" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="zip" className="flex items-center gap-2">
            <FileArchive className="h-4 w-4" />
            ZIP Upload
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Repository
          </TabsTrigger>
        </TabsList>

        {/* ZIP Upload Tab */}
        <TabsContent value="zip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload ZIP File
              </CardTitle>
              <CardDescription>
                Upload a ZIP file containing your codebase. Supported formats: .zip
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {selectedFile ? 'File Selected' : 'Drop your ZIP file here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile 
                        ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                        : 'or click to browse files'
                      }
                    </p>
                  </div>
                  
                  {!selectedFile && (
                    <Button variant="outline" disabled={isProcessing}>
                      Choose File
                    </Button>
                  )}
                </div>
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileArchive className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => selectedFile && onZipUpload(selectedFile)}
                      disabled={isProcessing}
                    >
                      Process File
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GitHub Repository Tab */}
        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Repository
              </CardTitle>
              <CardDescription>
                Enter a GitHub repository URL to fetch and process the codebase directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      value={githubUrl}
                      onChange={handleUrlChange}
                      className="pl-10"
                      disabled={isProcessing}
                    />
                  </div>
                  <Button 
                    onClick={handleGitHubSubmit}
                    disabled={isProcessing || !githubUrl.trim()}
                  >
                    Process Repository
                  </Button>
                </div>
                
                {urlError && (
                  <p className="text-sm text-destructive">{urlError}</p>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Supported URL formats:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• https://github.com/owner/repository</li>
                  <li>• https://github.com/owner/repository.git</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Public Repositories Only
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Currently, only public GitHub repositories are supported. 
                      Private repositories require authentication which is not yet implemented.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InputSection;