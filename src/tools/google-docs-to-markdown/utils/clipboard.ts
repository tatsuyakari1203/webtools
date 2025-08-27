import type { ClipboardData } from '../types';
import { SLICE_CLIP_MEDIA_TYPE } from '../types';

// Extract clipboard data from paste event
export async function extractClipboardData(event: ClipboardEvent): Promise<ClipboardData> {
  const clipboardData: ClipboardData = {};
  
  if (!event.clipboardData) {
    return clipboardData;
  }
  
  // Get HTML data
  const htmlData = event.clipboardData.getData('text/html');
  if (htmlData) {
    clipboardData.html = htmlData;
  }
  
  // Get Google Docs slice clip data
  const sliceClipData = event.clipboardData.getData(SLICE_CLIP_MEDIA_TYPE);
  if (sliceClipData) {
    clipboardData.sliceClip = {
      data: sliceClipData,
      type: SLICE_CLIP_MEDIA_TYPE
    };
  }
  
  return clipboardData;
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Download text as file
export function downloadAsFile(content: string, filename: string = 'converted.md'): void {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Failed to download file:', error);
  }
}

// Check if clipboard contains Google Docs data
export function hasGoogleDocsData(event: ClipboardEvent): boolean {
  if (!event.clipboardData) {
    return false;
  }
  
  const types = Array.from(event.clipboardData.types);
  return types.includes('text/html') || types.includes(SLICE_CLIP_MEDIA_TYPE);
}

// Get clipboard data types for debugging
export function getClipboardTypes(event: ClipboardEvent): string[] {
  if (!event.clipboardData) {
    return [];
  }
  
  return Array.from(event.clipboardData.types);
}