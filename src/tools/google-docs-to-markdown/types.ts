export interface ConversionOptions {
  codeBlocks: boolean;
  headingIds: boolean;
  suggestions: boolean;
}

export interface ConversionResult {
  markdown: string;
  error?: string;
}

export interface GoogleDocsSliceClip {
  data: string;
  type: string;
}

export interface ClipboardData {
  html?: string;
  sliceClip?: GoogleDocsSliceClip;
}

export const DEFAULT_OPTIONS: ConversionOptions = {
  codeBlocks: true,
  headingIds: true,
  suggestions: false,
};

export const SLICE_CLIP_MEDIA_TYPE = 'application/x-vnd.google-docs-document-slice-clip+wrapped';