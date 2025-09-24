'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { toast } from 'sonner';
import { Copy, Download, Settings, FileText, Code, Clipboard, Github } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { ConversionOptions } from './types';
import { DEFAULT_OPTIONS } from './types';
import { settings } from './utils/settings';
import { processClipboardData, convertDocsHtmlToMarkdown } from './utils/conversion';
import {
  extractClipboardData,
  copyToClipboard,
  downloadAsFile
} from './utils/clipboard';

// Function to sanitize HTML by removing color-related CSS properties
const sanitizeHtmlColors = (html: string): string => {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Function to remove color-related styles from an element
  const removeColorStyles = (element: Element) => {
    if (element instanceof HTMLElement && element.style) {
      // Remove color-related CSS properties
      element.style.removeProperty('color');
      element.style.removeProperty('background-color');
      element.style.removeProperty('background');
      element.style.removeProperty('border-color');
      element.style.removeProperty('text-shadow');
      element.style.removeProperty('box-shadow');
      
      // Also remove from style attribute if it contains color properties
      const styleAttr = element.getAttribute('style');
      if (styleAttr) {
        const cleanedStyle = styleAttr
          .replace(/color\s*:[^;]+;?/gi, '')
          .replace(/background(-color)?\s*:[^;]+;?/gi, '')
          .replace(/border-color\s*:[^;]+;?/gi, '')
          .replace(/text-shadow\s*:[^;]+;?/gi, '')
          .replace(/box-shadow\s*:[^;]+;?/gi, '')
          .replace(/;\s*;/g, ';')
          .replace(/^\s*;|;\s*$/g, '')
          .trim();
        
        if (cleanedStyle) {
          element.setAttribute('style', cleanedStyle);
        } else {
          element.removeAttribute('style');
        }
      }
    }
    
    // Recursively process child elements
    Array.from(element.children).forEach(removeColorStyles);
  };
  
  // Process all elements
  Array.from(tempDiv.children).forEach(removeColorStyles);
  
  return tempDiv.innerHTML;
};

export default function GoogleDocsToMarkdown() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<{
    hasImages: boolean;
    hasComments: boolean;
    hasTables: boolean;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    settings.load();
    setOptions(settings.getAll());
  }, []);

  // Update settings when options change
  const updateOption = useCallback((key: keyof ConversionOptions, value: boolean) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    settings.set(key, value);
  }, [options]);

  // Handle paste event
  const handlePaste = useCallback(async (event: React.ClipboardEvent) => {
    event.preventDefault();
    
    try {
      setIsConverting(true);
      setError(null);
      
      const clipboardData = await extractClipboardData(event.nativeEvent);
      
      if (!clipboardData.html && !clipboardData.sliceClip) {
        // Fallback to plain text
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
          setInput(plainText);
          const result = await convertDocsHtmlToMarkdown(plainText, options);
          setOutput(result.markdown);
          setWarnings(result.warnings || []);
          setMetadata(result.metadata || null);
          if (result.error) {
            setError(result.error);
          }
        }
        return;
      }
      
      // Set input to show what was pasted (HTML for rendering)
      if (clipboardData.html) {
        const sanitizedHtml = sanitizeHtmlColors(clipboardData.html);
        setInput(sanitizedHtml);
        // Update the contentEditable div immediately
        const target = event.target as HTMLElement;
        if (target && target.contentEditable === 'true') {
          target.innerHTML = sanitizedHtml;
        }
      }
      
      // Process the clipboard data
      const result = await processClipboardData(clipboardData.html || '', clipboardData.sliceClip?.data, options);
      setOutput(result.markdown);
      setWarnings(result.warnings || []);
      setMetadata(result.metadata || null);
      
      if (result.error) {
        setError(result.error);
        toast.error('Conversion failed: ' + result.error);
      } else {
        toast.success('Successfully converted Google Docs content!');
        if (result.warnings && result.warnings.length > 0) {
          toast.warning(`Conversion completed with ${result.warnings.length} warning(s)`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to process clipboard data: ' + errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, []);

  // Manual conversion
  const handleConvert = useCallback(async () => {
    if (!input.trim()) {
      toast.error('Please paste some content first');
      return;
    }
    
    try {
      setIsConverting(true);
      setError(null);
      
      const result = await convertDocsHtmlToMarkdown(input, options);
      setOutput(result.markdown);
      setWarnings(result.warnings || []);
      setMetadata(result.metadata || null);
      
      if (result.error) {
        setError(result.error);
        toast.error('Conversion failed: ' + result.error);
      } else {
        toast.success('Content converted successfully!');
        if (result.warnings && result.warnings.length > 0) {
          toast.warning(`Conversion completed with ${result.warnings.length} warning(s)`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Conversion failed: ' + errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, [input]);

  // Copy output to clipboard
  const handleCopy = useCallback(async () => {
    if (!output) {
      toast.error('No content to copy');
      return;
    }
    
    const success = await copyToClipboard(output);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  }, [output]);

  // Download as file
  const handleDownload = useCallback(() => {
    if (!output) {
      toast.error('No content to download');
      return;
    }
    
    downloadAsFile(output, 'converted.md');
    toast.success('File downloaded!');
  }, [output]);

  // Clear all content
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    // Also clear the contentEditable div
    const contentEditableDiv = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (contentEditableDiv) {
      contentEditableDiv.innerHTML = '<p class="text-muted-foreground">Paste your Google Docs content here...</p>';
    }
    toast.success('Content cleared');
  }, []);

  // Paste from clipboard
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      setIsConverting(true);
      setError(null);
      
      // Check if Clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast.error('Clipboard API not supported in this browser');
        return;
      }
      
      // Read from clipboard
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        // Try to get HTML content first
        if (clipboardItem.types.includes('text/html')) {
          const htmlBlob = await clipboardItem.getType('text/html');
          const htmlText = await htmlBlob.text();
          
          if (htmlText) {
            const sanitizedHtml = sanitizeHtmlColors(htmlText);
            setInput(sanitizedHtml);
            // Update the contentEditable div
            const contentEditableDiv = document.querySelector('[contenteditable="true"]') as HTMLElement;
            if (contentEditableDiv) {
              contentEditableDiv.innerHTML = sanitizedHtml;
            }
            
            // Convert to markdown
            const result = await convertDocsHtmlToMarkdown(htmlText);
            setOutput(result.markdown);
            
            if (result.error) {
              setError(result.error);
              toast.error('Conversion failed: ' + result.error);
            } else {
              toast.success('Successfully pasted and converted content!');
            }
            return;
          }
        }
        
        // Fallback to plain text
        if (clipboardItem.types.includes('text/plain')) {
          const textBlob = await clipboardItem.getType('text/plain');
          const plainText = await textBlob.text();
          
          if (plainText) {
            setInput(plainText);
            // Update the contentEditable div
            const contentEditableDiv = document.querySelector('[contenteditable="true"]') as HTMLElement;
            if (contentEditableDiv) {
              contentEditableDiv.innerHTML = plainText;
            }
            
            const result = await convertDocsHtmlToMarkdown(plainText);
            setOutput(result.markdown);
            
            if (result.error) {
              setError(result.error);
              toast.error('Conversion failed: ' + result.error);
            } else {
              toast.success('Successfully pasted and converted content!');
            }
            return;
          }
        }
      }
      
      toast.error('No supported content found in clipboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to read from clipboard: ' + errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Google Docs to Markdown</h1>
          <a 
            href="https://github.com/mr0grog/google-docs-to-markdown" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            title="View source on GitHub"
            aria-label="View mr0grog's google-docs-to-markdown repository on GitHub"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">mr0grog</span>
          </a>
        </div>
        <p className="text-muted-foreground">
          Convert Google Docs content to Markdown format. Simply paste your content from Google Docs.
        </p>
      </div>

      {/* Settings Panel */}
      <Card className="mb-6">
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Conversion Settings
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="codeBlocks"
                    checked={options.codeBlocks}
                    onCheckedChange={(checked) => updateOption('codeBlocks', checked)}
                  />
                  <Label htmlFor="codeBlocks" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code Blocks
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="headingIds"
                    checked={options.headingIds}
                    onCheckedChange={(checked) => updateOption('headingIds', checked)}
                  />
                  <Label htmlFor="headingIds" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Heading IDs
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="suggestions"
                    checked={options.suggestions}
                    onCheckedChange={(checked) => updateOption('suggestions', checked)}
                  />
                  <Label htmlFor="suggestions">
                    Include Suggestions
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="preserveComments"
                    checked={options.preserveComments}
                    onCheckedChange={(checked) => updateOption('preserveComments', checked)}
                  />
                  <Label htmlFor="preserveComments">
                    Preserve Comments
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tableFormatting"
                    checked={options.tableFormatting}
                    onCheckedChange={(checked) => updateOption('tableFormatting', checked)}
                  />
                  <Label htmlFor="tableFormatting">
                    Table Formatting
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imageHandling"
                    checked={options.imageHandling}
                    onCheckedChange={(checked) => updateOption('imageHandling', checked)}
                  />
                  <Label htmlFor="imageHandling">
                    Image Handling
                  </Label>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Input (Google Docs Content)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste content from Google Docs here - content will be displayed as preview
            </p>
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleConvert} disabled={isConverting || !input.trim()}>
                {isConverting ? 'Converting...' : 'Convert'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePasteFromClipboard}
                disabled={isConverting}
                className="flex items-center gap-2"
              >
                <Clipboard className="h-4 w-4" />
                Paste from Clipboard
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Rendered HTML Preview */}
              <div
                className="min-h-[400px] p-4 border rounded-md bg-background overflow-auto prose prose-sm max-w-none"
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                onInput={(e) => setInput(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{
                  __html: input ? sanitizeHtmlColors(input) : '<p class="text-muted-foreground">Paste your Google Docs content here...</p>'
                }}
                style={{
                  minHeight: '400px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) - 2px)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Output (Markdown)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Converted Markdown content
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                disabled={!output}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!output}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Converted Markdown will appear here..."
              value={output}
              readOnly
              className="min-h-[400px] text-sm"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                border: 'none',
                boxShadow: 'none'
              }}
            />
            {error && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            {warnings.length > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {metadata && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Content Analysis:</h4>
                <div className="flex flex-wrap gap-4 text-sm text-blue-700">
                  <div className="flex items-center gap-1">
                    <span className={metadata.hasImages ? "text-green-600" : "text-gray-400"}>
                      {metadata.hasImages ? "✓" : "✗"}
                    </span>
                    Images detected
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={metadata.hasComments ? "text-green-600" : "text-gray-400"}>
                      {metadata.hasComments ? "✓" : "✗"}
                    </span>
                    Comments found
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={metadata.hasTables ? "text-green-600" : "text-gray-400"}>
                      {metadata.hasTables ? "✓" : "✗"}
                    </span>
                    Tables present
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Copy content from Google Docs (Ctrl+C or Cmd+C)</p>
            <p>2. Paste it into the input area above (Ctrl+V or Cmd+V)</p>
            <p>3. The content will be automatically converted to Markdown</p>
            <p>4. Use the Copy button to copy the result or Download to save as a file</p>
            <p>5. Adjust conversion settings as needed using the settings panel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}