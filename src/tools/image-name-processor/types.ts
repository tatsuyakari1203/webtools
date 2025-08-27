export interface ProcessingOptions {
  removeAccents: boolean;
  toLowerCase: boolean;
  replaceSpaces: boolean;
  removeSpecialChars: boolean;
  removeDuplicates: boolean;
}

export interface ProcessingResult {
  original: string;
  processed: string;
  changes: string[];
}