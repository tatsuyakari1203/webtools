export interface TextFormatterOption {
  name: string;
  action: () => void;
  description: string;
}

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
}