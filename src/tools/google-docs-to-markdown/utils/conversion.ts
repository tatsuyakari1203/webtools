import { unified } from 'unified';
import rehypeDomParse from 'rehype-dom-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { toMdast } from 'hast-util-to-mdast';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import type { ConversionResult } from '../types';



// Parse Google Docs slice clip data
function parseGdocsSliceClip(sliceData: unknown): unknown {
  try {
    if (typeof sliceData === 'string') {
      return JSON.parse(sliceData);
    }
    return sliceData;
  } catch (error) {
    console.warn('Failed to parse slice clip data:', error);
    return null;
  }
}

export function combineGoogleDocFormats(htmlData: string, sliceData: unknown): string {
  let html = htmlData;
  
  if (sliceData) {
    const parsedSliceData = parseGdocsSliceClip(sliceData);
    if (parsedSliceData) {
      // Process slice clip data to enhance HTML
      // This is a simplified version - the full implementation would be more complex
      html = updateHtmlWithSliceClip(html);
    }
  }
  
  return html;
}

function updateHtmlWithSliceClip(html: string): string {
  // Simplified implementation - in reality this would be much more complex
  // based on the slice clip data structure
  return html;
}

// Clean Google HTML (simplified version)
export function cleanGoogleHtml(html: string): string {
  // Remove Google Docs specific attributes and clean up HTML
  const cleaned = html
    .replace(/<!--StartFragment-->/g, '') // Remove StartFragment comments
    .replace(/<!--EndFragment-->/g, '') // Remove EndFragment comments
    .replace(/\s*style="[^"]*"/g, '') // Remove inline styles
    .replace(/\s*class="[^"]*"/g, '') // Remove classes
    .replace(/\s*id="[^"]*"/g, '') // Remove IDs
    .replace(/<span[^>]*>([^<]*)<\/span>/g, '$1') // Unwrap simple spans
    .replace(/<p[^>]*><\/p>/g, '') // Remove empty paragraphs
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return cleaned;
}

// Main conversion function
export async function convertDocsHtmlToMarkdown(
  html: string
): Promise<ConversionResult> {
  try {
    const cleanedHtml = cleanGoogleHtml(html);
    
    const processor = unified()
      .use(rehypeDomParse, { fragment: true })
      .use(() => (tree: HastRoot) => {
        const mdast = toMdast(tree) as MdastRoot;
        return mdast;
      })
      .use(remarkGfm)
      .use(remarkStringify);

    const result = await processor.process(cleanedHtml);
    
    return {
      markdown: String(result)
    };
  } catch (error) {
    return {
      markdown: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export function processClipboardData(htmlData: string, sliceData: unknown): Promise<ConversionResult> {
  const html = combineGoogleDocFormats(htmlData, sliceData);
  return convertDocsHtmlToMarkdown(html);
}