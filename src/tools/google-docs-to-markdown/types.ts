export interface ConversionOptions {
  codeBlocks: boolean;
  headingIds: boolean;
  suggestions: boolean;
  preserveComments: boolean;
  tableFormatting: boolean;
  imageHandling: boolean;
}

export interface ConversionResult {
  markdown: string;
  error?: string;
  warnings?: string[];
  metadata?: {
    hasImages: boolean;
    hasComments: boolean;
    hasTables: boolean;
  };
}

export interface GoogleDocsSliceClip {
  data: string;
  type: string;
}

export interface ClipboardData {
  html?: string;
  sliceClip?: GoogleDocsSliceClip;
}

// Google Docs Slice Clip Data Structures
export interface SliceClipData {
  dsl_spacers?: string;
  dsl_styleslices?: StyleSlice[];
  dsl_entitymap?: Record<string, EntityData>;
  dsl_suggestedchanges?: SuggestedChange[];
  resolved_suggestions_list?: ResolvedSuggestion[];
}

export interface StyleSlice {
  stsl_type?: string;
  stsl_styles?: Record<string, any>;
  stsl_opindex?: number;
}

export interface EntityData {
  entity_type?: string;
  entity_properties?: Record<string, any>;
  mutability?: string;
}

export interface SuggestedChange {
  suggestion_id?: string;
  suggestion_type?: string;
  author?: string;
  timestamp?: number;
  text?: string;
}

export interface ResolvedSuggestion {
  suggestion_id?: string;
  resolution?: 'accepted' | 'rejected';
  resolver?: string;
}

// Enhanced formatting structures
export interface FormattingInfo {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  link?: string;
  comment?: string;
}

export const DEFAULT_OPTIONS: ConversionOptions = {
  codeBlocks: true,
  headingIds: true,
  suggestions: false,
  preserveComments: false,
  tableFormatting: true,
  imageHandling: true,
};

export const SLICE_CLIP_MEDIA_TYPE = 'application/x-vnd.google-docs-document-slice-clip+wrapped';