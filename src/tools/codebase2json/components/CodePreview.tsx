"use client";

import React, { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2,
  FileText,
  Code,
  Search,
  ChevronUp,
  ChevronDown,
  WrapText,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CodePreviewProps {
  file: {
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
  } | null;
  onClose?: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ file, onClose }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [showFileInfo, setShowFileInfo] = useState(false);

  // Get language for syntax highlighting
  const getLanguageForHighlighting = (fileLanguage: string, extension: string): string => {
    // Use the detected language from the file object first
    if (fileLanguage && fileLanguage !== 'unknown') {
      const languageMap: Record<string, string> = {
        'javascript': 'javascript',
        'typescript': 'typescript',
        'python': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'csharp': 'csharp',
        'php': 'php',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'swift': 'swift',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'sass': 'sass',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'markdown': 'markdown',
        'sql': 'sql',
        'bash': 'bash',
        'shell': 'bash',
        'dockerfile': 'dockerfile'
      };
      return languageMap[fileLanguage.toLowerCase()] || fileLanguage.toLowerCase();
    }
    
    // Fallback to extension-based detection
    const extensionMap: Record<string, string> = {
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
      '.bat': 'batch',
      '.dockerfile': 'dockerfile'
    };
    return extensionMap[extension.toLowerCase()] || 'text';
  };

  // Format file size (use the pre-formatted size if available)
  const formatFileSize = (bytes: number, preFormatted?: string): string => {
    if (preFormatted) return preFormatted;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  // Format last modified date
  const formatLastModified = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Search functionality
  const searchMatches = useMemo(() => {
    if (!file || !searchTerm) return [];
    
    const lines = file.content.split('\n');
    const matches: Array<{ lineIndex: number; charIndex: number; length: number }> = [];
    
    lines.forEach((line, lineIndex) => {
      let startIndex = 0;
      while (true) {
        const index = line.toLowerCase().indexOf(searchTerm.toLowerCase(), startIndex);
        if (index === -1) break;
        
        matches.push({
          lineIndex,
          charIndex: index,
          length: searchTerm.length
        });
        
        startIndex = index + 1;
      }
    });
    
    return matches;
  }, [file, searchTerm]);

  // Navigate search results
  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    
    if (direction === 'next') {
      setCurrentSearchIndex((prev) => (prev + 1) % searchMatches.length);
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = async () => {
    if (!file) return;
    
    try {
      await navigator.clipboard.writeText(file.content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Download file
  const downloadFile = () => {
    if (!file) return;
    
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get syntax highlighting style based on theme
  const getSyntaxStyle = () => {
    return theme === 'dark' ? vscDarkPlus : vs;
  };





  if (!file) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Select a file to preview its content</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const language = getLanguageForHighlighting(file.language, file.extension);

  return (
    <TooltipProvider>
      <Card className={`h-full ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {file.name}
              <Badge variant="outline">{language}</Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileInfo(!showFileInfo)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle file information</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>
          
          {/* File Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{file.relativePath}</span>
            <span>•</span>
            <span>{file.lines} lines</span>
            <span>•</span>
            <span>{formatFileSize(file.size, file.sizeFormatted)}</span>
            {file.linesPercentage && (
              <>
                <span>•</span>
                <span>{file.linesPercentage.toFixed(1)}% of total</span>
              </>
            )}
          </div>
          
          {/* Extended File Info */}
          {showFileInfo && (
            <div className="mt-2 p-3 bg-muted rounded-lg space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Full Path:</span>
                  <p className="text-muted-foreground break-all">{file.path}</p>
                </div>
                <div>
                  <span className="font-medium">Directory:</span>
                  <p className="text-muted-foreground">{file.directory}</p>
                </div>
                <div>
                  <span className="font-medium">Language:</span>
                  <p className="text-muted-foreground">{file.language}</p>
                </div>
                <div>
                  <span className="font-medium">Last Modified:</span>
                  <p className="text-muted-foreground">{formatLastModified(file.lastModified)}</p>
                </div>
              </div>
            </div>
          )}
        
          {/* Search and Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in file..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentSearchIndex(0);
                }}
                className="pl-10"
              />
            </div>
            
            {searchMatches.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  {currentSearchIndex + 1} of {searchMatches.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateSearch('prev')}
                  disabled={searchMatches.length === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateSearch('next')}
                  disabled={searchMatches.length === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWrapLines(!wrapLines)}
                >
                  <WrapText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle line wrapping</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                >
                  {showLineNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle line numbers</p>
              </TooltipContent>
            </Tooltip>
            
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-0">
          <ScrollArea className={isExpanded ? 'h-[calc(100vh-200px)]' : 'h-[500px]'}>
            <SyntaxHighlighter
              language={language}
              style={getSyntaxStyle()}
              showLineNumbers={showLineNumbers}
              wrapLines={wrapLines}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '0.875rem'
              }}
              lineNumberStyle={{
                minWidth: '3rem',
                paddingRight: '1rem',
                color: 'var(--muted-foreground)',
                userSelect: 'none'
              }}
            >
              {file.content}
            </SyntaxHighlighter>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default CodePreview;