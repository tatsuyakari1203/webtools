import { unified } from 'unified';
import rehypeDomParse from 'rehype-dom-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { toMdast } from 'hast-util-to-mdast';
import { visit } from 'unist-util-visit';
import type { Root as HastRoot, Element as HastElement, Comment as HastComment } from 'hast';
import type { Root as MdastRoot, Heading as MdastHeading, Text as MdastText } from 'mdast';
import type { 
  ConversionResult, 
  ConversionOptions, 
  SliceClipData} from '../types';
import { DEFAULT_OPTIONS } from '../types';

// Google Docs specific patterns for cleaning
const GOOGLE_DOCS_PATTERNS = {
  comments: /<!--[\s\S]*?-->/g,
  startFragment: /<!--StartFragment-->/g,
  endFragment: /<!--EndFragment-->/g,
  // Remove excessive empty HTML comments
  excessiveComments: /<!---->+/g,
  // Remove all empty HTML comments
  emptyComments: /<!--\s*-->/g,
  suggestions: /<span[^>]*suggestion[^>]*>[\s\S]*?<\/span>/g,
  emptyElements: /<(\w+)[^>]*>\s*<\/\1>/g,
  googleAttributes: /\s*(id|class)="[^"]*"/g,
  inlineStyles: /\s*style="[^"]*"/g,
  emptyParagraphs: /<p[^>]*><\/p>/g,
  redundantSpans: /<span[^>]*>([^<]*)<\/span>/g,
  // Remove incomplete code blocks or fragments
  incompleteCodeBlocks: /```\s*$/gm,
  // Remove orphaned closing tags
  orphanedClosingTags: /<\/[^>]+>\s*$/gm,
  whitespace: /\s+/g,
  // Remove multiple line breaks
  multipleBreaks: /\n{3,}/g,
  // Remove trailing whitespace in lines
  trailingWhitespace: /[ \t]+$/gm
};

// Parse Google Docs slice clip data
function parseGdocsSliceClip(sliceData: unknown): SliceClipData | null {
  try {
    if (typeof sliceData === 'string') {
      // Handle base64 encoded data if present
      let jsonData = sliceData;
      if (sliceData.startsWith('data:')) {
        const base64Data = sliceData.split(',')[1];
        jsonData = atob(base64Data);
      }
      
      const parsed = JSON.parse(jsonData);
      return parsed as SliceClipData;
    }
    return sliceData as SliceClipData;
  } catch (error) {
    console.warn('Failed to parse slice clip data:', error);
    return null;
  }
}

// Note: extractFormattingFromSliceClip function removed as it's not currently used
// TODO: Implement formatting application in future versions

// Extract comments and suggestions
function extractCommentsAndSuggestions(sliceData: SliceClipData): {
  comments: string[];
  suggestions: string[];
} {
  const comments: string[] = [];
  const suggestions: string[] = [];
  
  // Extract suggestions
  if (sliceData.dsl_suggestedchanges) {
    sliceData.dsl_suggestedchanges.forEach(change => {
      if (change.text && change.author) {
        suggestions.push(`[${change.author}]: ${change.text}`);
      }
    });
  }
  
  // Extract entity-based comments
  if (sliceData.dsl_entitymap) {
    Object.values(sliceData.dsl_entitymap).forEach(entity => {
      if (entity.entity_type === 'COMMENT' && entity.entity_properties?.text && typeof entity.entity_properties.text === 'string') {
        comments.push(entity.entity_properties.text);
      }
    });
  }
  
  return { comments, suggestions };
}

export function combineGoogleDocFormats(htmlData: string, sliceData: unknown): string {
  let html = htmlData;
  
  if (sliceData) {
    const parsedSliceData = parseGdocsSliceClip(sliceData);
    if (parsedSliceData) {
      // Extract formatting and enhance HTML
      html = updateHtmlWithSliceClip(html, parsedSliceData);
    }
  }
  
  return html;
}

function updateHtmlWithSliceClip(html: string, sliceData: SliceClipData): string {
  // Extract formatting information (TODO: implement formatting application)
  // const formattingMap = extractFormattingFromSliceClip(sliceData);
  const { comments, suggestions } = extractCommentsAndSuggestions(sliceData);
  
  // Apply formatting enhancements to HTML
  let enhancedHtml = html;
  
  // Add comments as HTML comments for later processing
  if (comments.length > 0) {
    const commentsHtml = comments.map(comment => 
      `<!-- GDOC_COMMENT: ${comment.replace(/--/g, '&#45;&#45;')} -->`
    ).join('\n');
    enhancedHtml = commentsHtml + '\n' + enhancedHtml;
  }
  
  // Add suggestions as data attributes
  if (suggestions.length > 0) {
    const suggestionsHtml = suggestions.map(suggestion => 
      `<!-- GDOC_SUGGESTION: ${suggestion.replace(/--/g, '&#45;&#45;')} -->`
    ).join('\n');
    enhancedHtml = suggestionsHtml + '\n' + enhancedHtml;
  }
  
  return enhancedHtml;
}

// Clean Google HTML with advanced pattern matching
export function cleanGoogleHtml(html: string, options: ConversionOptions = DEFAULT_OPTIONS): string {
  let cleaned = html;
  
  // Apply cleaning patterns in order
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.startFragment, '');
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.endFragment, '');
  
  // Remove excessive empty HTML comments (the main issue!)
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.excessiveComments, '');
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.emptyComments, '');
  
  // Handle suggestions based on options
  if (!options.suggestions) {
    cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.suggestions, '');
  }
  
  // Remove Google-specific attributes but preserve semantic ones
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.googleAttributes, '');
  
  // Remove inline styles unless they contain important formatting
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.inlineStyles, (match) => {
    // Preserve styles that might be important for tables or specific formatting
    if (options.tableFormatting && (match.includes('border') || match.includes('width') || match.includes('text-align'))) {
      return match;
    }
    return '';
  });
  
  // Clean up redundant spans but preserve those with meaningful content
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.redundantSpans, (match, content) => {
    // If the span contains only text and no formatting, unwrap it
    if (content && !match.includes('style=') && !match.includes('class=')) {
      return content;
    }
    return match;
  });
  
  // Remove empty elements
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.emptyElements, '');
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.emptyParagraphs, '');
  
  // Fix incomplete code blocks and orphaned tags
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.incompleteCodeBlocks, '');
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.orphanedClosingTags, '');
  
  // Remove trailing whitespace from lines
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.trailingWhitespace, '');
  
  // Normalize whitespace
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.whitespace, ' ');
  
  // Clean up multiple consecutive line breaks
  cleaned = cleaned.replace(GOOGLE_DOCS_PATTERNS.multipleBreaks, '\n\n');
  
  return cleaned.trim();
}

// Main conversion function with options support
export async function convertDocsHtmlToMarkdown(
  html: string,
  options: ConversionOptions = DEFAULT_OPTIONS
): Promise<ConversionResult> {
  const warnings: string[] = [];
  const metadata = {
    hasImages: false,
    hasComments: false,
    hasTables: false
  };
  
  try {
    // Analyze content before cleaning
    metadata.hasImages = /<img[^>]*>/i.test(html);
    metadata.hasComments = /<!-- GDOC_COMMENT:/.test(html);
    metadata.hasTables = /<table[^>]*>/i.test(html);
    
    // Clean HTML with options
    const cleanedHtml = cleanGoogleHtml(html, options);
    
    // Configure processor based on options
    const processor = unified()
      .use(rehypeDomParse, { fragment: true })
      .use(() => (tree: HastRoot) => {
        // Custom processing based on options
        if (options.preserveComments) {
          // Process comments before conversion
          processCommentsInTree(tree);
        }
        
        if (options.codeBlocks) {
          // Enhance code block detection
          enhanceCodeBlocks(tree);
        }
        
        const mdast = toMdast(tree) as MdastRoot;
        
        if (options.headingIds) {
          // Add heading IDs
          addHeadingIds(mdast);
        }
        
        return mdast;
      })
      .use(remarkGfm)
      .use(remarkStringify, {
        bullet: '-',
        fences: true,
        incrementListMarker: false
      });

    const result = await processor.process(cleanedHtml);
    let markdown = String(result);
    
    // Post-process markdown based on options
    if (options.preserveComments) {
      markdown = processMarkdownComments(markdown);
    }
    
    // Apply final post-processing to clean up artifacts
    markdown = postProcessMarkdown(markdown);
    
    if (metadata.hasImages && !options.imageHandling) {
      warnings.push('Images detected but image handling is disabled');
    }
    
    return {
      markdown,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata
    };
  } catch (error) {
    return {
      markdown: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata
    };
  }
}

// Helper functions for processing
function processCommentsInTree(tree: HastRoot): void {
  // Process HTML comments and convert them to markdown comments
  visit(tree, 'comment', (node: HastComment) => {
    if (node.value && node.value.includes('GDOC_COMMENT:')) {
      const commentText = node.value.replace(/GDOC_COMMENT:\s*/, '');
      // Convert comment to a visible element that will be processed later
      const commentElement = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['gdoc-comment'] },
        children: [{ type: 'text', value: `Comment: ${commentText}` }]
      };
      Object.assign(node, commentElement);
    }
  });
}

function enhanceCodeBlocks(tree: HastRoot): void {
  // Enhance detection and formatting of code blocks
  visit(tree, 'element', (node: HastElement) => {
    if (node.tagName === 'span' && node.properties?.style) {
      const style = node.properties.style;
      // Detect monospace fonts that indicate code
      if (typeof style === 'string' && 
          (style.includes('monospace') || 
           style.includes('Courier') || 
           style.includes('Monaco') ||
           style.includes('Consolas'))) {
        // Convert to code element
        node.tagName = 'code';
        delete node.properties.style;
      }
    }
    
    // Detect pre-formatted text blocks
    if (node.tagName === 'div' && node.properties?.style) {
      const style = node.properties.style;
      if (typeof style === 'string' && 
          (style.includes('white-space: pre') || 
           style.includes('font-family: monospace'))) {
        node.tagName = 'pre';
        delete node.properties.style;
      }
    }
  });
}

function addHeadingIds(tree: MdastRoot): void {
  // Add IDs to headings for better navigation
  visit(tree, 'heading', (node: MdastHeading) => {
    if (node.children && node.children.length > 0) {
      // Extract text content from heading
      const textContent = node.children
        .filter((child): child is MdastText => child.type === 'text')
        .map((child: MdastText) => child.value)
        .join(' ');
      
      if (textContent) {
        // Generate ID from text content
        const id = textContent
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        
        // Add ID as data attribute (will be converted to markdown)
        node.data = node.data || {};
        const nodeData = node.data as { hProperties?: { id?: string } };
        nodeData.hProperties = nodeData.hProperties || {};
        nodeData.hProperties.id = id;
      }
    }
  });
}

function processMarkdownComments(markdown: string): string {
  // Convert HTML comments to markdown comments
  return markdown.replace(/<!-- GDOC_COMMENT: (.*?) -->/g, '\n> **Comment:** $1\n');
}

function postProcessMarkdown(markdown: string): string {
  let processed = markdown;
  
  // Remove excessive empty lines
  processed = processed.replace(/\n{4,}/g, '\n\n\n');
  
  // Fix incomplete code blocks
  processed = processed.replace(/```\s*$/gm, '');
  
  // Remove orphaned markdown syntax
  processed = processed.replace(/^\s*[*_`]+\s*$/gm, '');
  
  // Clean up malformed lists
  processed = processed.replace(/^\s*[-*+]\s*$/gm, '');
  
  // Remove trailing spaces from lines
  processed = processed.replace(/[ \t]+$/gm, '');
  
  // Normalize line endings
  processed = processed.replace(/\r\n/g, '\n');
  
  // Remove excessive whitespace at start/end
  processed = processed.trim();
  
  // Ensure proper spacing around headings
  processed = processed.replace(/\n(#{1,6}\s)/g, '\n\n$1');
  processed = processed.replace(/(#{1,6}.*)\n([^\n#])/g, '$1\n\n$2');
  
  return processed;
}

export function processClipboardData(
  htmlData: string, 
  sliceData: unknown, 
  options: ConversionOptions = DEFAULT_OPTIONS
): Promise<ConversionResult> {
  const html = combineGoogleDocFormats(htmlData, sliceData);
  return convertDocsHtmlToMarkdown(html, options);
}