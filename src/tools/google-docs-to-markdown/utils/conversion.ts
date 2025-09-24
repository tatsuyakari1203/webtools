import { unified } from 'unified';
import rehypeDomParse from 'rehype-dom-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { toMdast } from 'hast-util-to-mdast';
import { visit } from 'unist-util-visit';
import type { Root as HastRoot } from 'hast';
import type { Root as MdastRoot } from 'mdast';
import type { 
  ConversionResult, 
  ConversionOptions, 
  SliceClipData, 
  FormattingInfo
} from '../types';
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
  trailingWhitespace: /[ \t]+$/gm,
  // Code block detection patterns
  codeBlockMarkers: /^(HTML|JavaScript|CSS|Python|Java|C\+\+|TypeScript|JSON|XML|SQL|PHP|Ruby|Go|Rust|Swift|Kotlin|Dart|Shell|Bash|PowerShell|YAML|Dockerfile|Markdown)$/i,
  preformattedText: /<div[^>]*style="[^"]*(?:white-space:\s*pre|font-family:\s*[^"]*monospace)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
  monospaceSpans: /<span[^>]*style="[^"]*font-family:\s*[^"]*monospace[^"]*"[^>]*>(.*?)<\/span>/gi
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

// Extract formatting information from slice clip data
function extractFormattingFromSliceClip(sliceData: SliceClipData): Map<number, FormattingInfo> {
  const formattingMap = new Map<number, FormattingInfo>();
  
  if (!sliceData.dsl_styleslices) {
    return formattingMap;
  }
  
  sliceData.dsl_styleslices.forEach((slice, index) => {
    if (slice.stsl_styles) {
      const formatting: FormattingInfo = {};
      
      // Extract common formatting
      if (slice.stsl_styles.bold) formatting.bold = true;
      if (slice.stsl_styles.italic) formatting.italic = true;
      if (slice.stsl_styles.underline) formatting.underline = true;
      if (slice.stsl_styles.strikethrough) formatting.strikethrough = true;
      
      // Extract font properties
      if (slice.stsl_styles.fontSize) formatting.fontSize = slice.stsl_styles.fontSize;
      if (slice.stsl_styles.fontFamily) formatting.fontFamily = slice.stsl_styles.fontFamily;
      if (slice.stsl_styles.color) formatting.color = slice.stsl_styles.color;
      if (slice.stsl_styles.backgroundColor) formatting.backgroundColor = slice.stsl_styles.backgroundColor;
      
      // Extract links
      if (slice.stsl_styles.link) formatting.link = slice.stsl_styles.link;
      
      formattingMap.set(slice.stsl_opindex || index, formatting);
    }
  });
  
  return formattingMap;
}

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
      if (entity.entity_type === 'COMMENT' && entity.entity_properties?.text) {
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
  // Extract formatting information
  const formattingMap = extractFormattingFromSliceClip(sliceData);
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
    
    // Preprocess code blocks before cleaning
    const preprocessedHtml = preprocessCodeBlocks(html);
    
    // Clean HTML with options
    const cleanedHtml = cleanGoogleHtml(preprocessedHtml, options);
    
    // Configure processor based on options
    const processor = unified()
      .use(rehypeDomParse, { fragment: true })
      .use(() => (tree: HastRoot) => {
        // Custom processing based on options
        if (options.preserveComments) {
          // Process comments before conversion
          processCommentsInTree(tree, warnings);
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
function processCommentsInTree(tree: HastRoot, warnings: string[]): void {
  // Process HTML comments and convert them to markdown comments
  visit(tree, 'comment', (node: any) => {
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
  visit(tree, 'element', (node: any) => {
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
  
  // Post-process to detect code blocks with language markers
  visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
    if (!parent || !parent.children || index === undefined) return;
    
    const text = node.value;
    if (GOOGLE_DOCS_PATTERNS.codeBlockMarkers.test(text.trim())) {
      // This is a language marker, check if next sibling is code content
      const nextSibling = parent.children[index + 1];
      if (nextSibling && (nextSibling.tagName === 'pre' || 
          (nextSibling.type === 'text' && nextSibling.value.includes('\n')))) {
        
        // Mark this as a code block with language
        const language = text.trim().toLowerCase();
        node.value = `\`\`\`${language}\n`;
        
        // If next sibling is text, wrap it in a code block
        if (nextSibling.type === 'text') {
          nextSibling.value = nextSibling.value + '\n```';
        }
      }
    }
  });
}

function addHeadingIds(tree: MdastRoot): void {
  // Add IDs to headings for better navigation
  visit(tree, 'heading', (node: any) => {
    if (node.children && node.children.length > 0) {
      // Extract text content from heading
      const textContent = node.children
        .filter((child: any) => child.type === 'text')
        .map((child: any) => child.value)
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
        node.data.hProperties = node.data.hProperties || {};
        node.data.hProperties.id = id;
      }
    }
  });
}

function processMarkdownComments(markdown: string): string {
  // Convert HTML comments to markdown comments
  return markdown.replace(/<!-- GDOC_COMMENT: (.*?) -->/g, '\n> **Comment:** $1\n');
}

function preprocessCodeBlocks(html: string): string {
  let processed = html;
  
  // Pattern to detect language markers followed by code content
  const codeBlockPattern = /(<p[^>]*>)?\s*(HTML|JavaScript|CSS|Python|Java|C\+\+|TypeScript|JSON|XML|SQL|PHP|Ruby|Go|Rust|Swift|Kotlin|Dart|Shell|Bash|PowerShell|YAML|Dockerfile|Markdown)\s*(<\/p>)?\s*\n\s*(<p[^>]*>)?([\s\S]*?)(<\/p>)?(?=\n\s*(?:<p|<h\d|$))/gi;
  
  processed = processed.replace(codeBlockPattern, (match, openP1, language, closeP1, openP2, content, closeP2) => {
    const cleanContent = content
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .trim();
    
    return `<pre><code class="language-${language.toLowerCase()}">${cleanContent}</code></pre>`;
  });
  
  return processed;
}

function postProcessMarkdown(markdown: string): string {
  let processed = markdown;
  
  // Fix code blocks that weren't properly detected
  processed = processed.replace(/^(HTML|JavaScript|CSS|Python|Java|C\+\+|TypeScript|JSON|XML|SQL|PHP|Ruby|Go|Rust|Swift|Kotlin|Dart|Shell|Bash|PowerShell|YAML|Dockerfile|Markdown)\s*\n\n([\s\S]*?)(?=\n\n|\n#|\n\*|$)/gmi, (match, language, content) => {
    const cleanContent = content.trim();
    return `\`\`\`${language.toLowerCase()}\n${cleanContent}\n\`\`\`\n`;
  });
  
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
  
  // Ensure proper spacing around code blocks
  processed = processed.replace(/\n(```)/g, '\n\n$1');
  processed = processed.replace(/(```\n)\n+/g, '$1\n');
  
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