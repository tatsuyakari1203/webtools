"use client";

import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  FileText, 
  BarChart3, 
  Code2, 
  FolderTree,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { countTokens, formatTokenCount } from '../utils/tokenCounter';
import { getLanguageBackgroundStyle } from '../utils/languageColors';

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

interface ResultsDisplayProps {
  result: ProcessingResult;
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onReset }) => {
  const [showFullJson, setShowFullJson] = useState(true);
  const [llmOptimized, setLlmOptimized] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Calculate total size
  const totalSize = result.files.reduce((sum, file) => sum + file.size, 0);

  // Calculate total tokens
  const totalTokens = result.files.reduce((sum, file) => sum + countTokens(file.content), 0);

  // Get language color using GitHub's official colors from colors.json
  const getLanguageColor = (language: string) => {
    return getLanguageBackgroundStyle(language);
  };

  // Generate JSON output
  const generateJson = (includeContent: boolean = true, llmOptimized: boolean = false) => {
    if (llmOptimized) {
      // LLM-optimized format with minimal metadata
      const output = {
        files: result.files.map(file => ({
          path: file.path,
          name: file.name,
          extension: file.extension,
          content: includeContent ? file.content : undefined,
          language: file.language
        })).filter(file => includeContent || file.content === undefined)
      };
      return JSON.stringify(output, null, 2);
    }
    
    // Standard format with full metadata
    const output = {
      ...result,
      files: result.files.map(file => ({
        ...file,
        content: includeContent ? file.content : undefined
      }))
    };
    return JSON.stringify(output, null, 2);
  };

  // Copy to clipboard
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Download JSON file
  const downloadJson = (includeContent: boolean = true, llmOptimized: boolean = false) => {
    const jsonContent = generateJson(includeContent, llmOptimized);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = llmOptimized ? 'llm-optimized' : (includeContent ? 'full' : 'metadata');
    a.download = `codebase-${suffix}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Success Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Processing Complete</h2>
                <p className="text-muted-foreground">
                  Successfully processed {result.totalFiles} files from your codebase
                </p>
              </div>
            </div>
            <Button onClick={onReset} variant="outline">
              Process Another
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{result.totalFiles}</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Code2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatTokenCount(totalTokens)}</p>
                <p className="text-sm text-muted-foreground">Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FolderTree className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{result.directories.length}</p>
                <p className="text-sm text-muted-foreground">Directories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                <p className="text-sm text-muted-foreground">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="languages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="directories">Directories</TabsTrigger>
          <TabsTrigger value="json">JSON Output</TabsTrigger>
        </TabsList>

        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Language Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.languages
                .sort((a, b) => b.percentage - a.percentage)
                .map((lang) => {
                  const langTokens = result.files
                    .filter(file => file.language === lang.language)
                    .reduce((sum, file) => sum + countTokens(file.content), 0);
                  return (
                    <div key={lang.language} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-3 h-3 rounded-full ${
                              typeof getLanguageColor(lang.language) === 'string' 
                                ? getLanguageColor(lang.language) 
                                : ''
                            }`}
                            style={typeof getLanguageColor(lang.language) === 'object' 
                              ? getLanguageColor(lang.language) as React.CSSProperties
                              : {}
                            }
                          />
                          <span className="font-medium capitalize">{lang.language}</span>
                          <Badge variant="secondary">{lang.fileCount} files</Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{((langTokens / totalTokens) * 100).toFixed(1)}%</span>
                          <p className="text-sm text-muted-foreground">
                            {formatTokenCount(langTokens)} tokens
                          </p>
                        </div>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className="h-full transition-all rounded-full"
                          style={{
                            width: `${(langTokens / totalTokens) * 100}%`,
                            ...(typeof getLanguageColor(lang.language) === 'object' 
                              ? getLanguageColor(lang.language) as React.CSSProperties
                              : {})
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {result.files
                    .sort((a, b) => a.path.localeCompare(b.path))
                    .map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{file.path}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{formatTokenCount(countTokens(file.content))} tokens</p>
                          <p>{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Directories Tab */}
        <TabsContent value="directories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Directory Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {result.directories
                    .sort((a, b) => a.localeCompare(b))
                    .map((dir, index) => {
                      const depth = dir.split('/').length - 1;
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 py-1"
                          style={{ paddingLeft: `${depth * 16}px` }}
                        >
                          <FolderTree className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{dir.split('/').pop() || dir}</span>
                        </div>
                      );
                    })
                  }
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JSON Output Tab */}
        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                JSON Output
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullJson(!showFullJson)}
                >
                  {showFullJson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showFullJson ? 'Hide' : 'Show'} Content
                </Button>
                <Button
                  variant={llmOptimized ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLlmOptimized(!llmOptimized)}
                >
                  LLM Mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateJson(showFullJson, llmOptimized))}
                >
                  <Copy className="h-4 w-4" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateJson(showFullJson, true))}
                >
                  <Copy className="h-4 w-4" />
                  Copy LLM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadJson(false)}
                >
                  <Download className="h-4 w-4" />
                  Metadata Only
                </Button>
                <Button
                   onClick={() => downloadJson(true, true)}
                   size="sm"
                 >
                   <Download className="h-4 w-4" />
                   LLM Optimized
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => downloadJson(true)}
                 >
                   <Download className="h-4 w-4" />
                   Full JSON
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <pre className="text-sm bg-muted/50 p-4 rounded overflow-x-auto">
                  <code>{generateJson(showFullJson, llmOptimized)}</code>
                </pre>
              </ScrollArea>
              {llmOptimized && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>LLM Optimized:</strong> This format removes unnecessary metadata and statistics, 
                    keeping only essential file information (path, name, extension, language, content) 
                    for better LLM processing and reduced token usage.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Generated: {new Date(result.metadata.timestamp).toLocaleString()}</span>
              <span>•</span>
              <span>Version: {result.metadata.version}</span>
              <span>•</span>
              <span>{result.metadata.generator}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;