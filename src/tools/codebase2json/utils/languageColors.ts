/**
 * Language color utilities for codebase2json tool
 * Uses GitHub's language colors from colors.json
 */

import languageColorsData from '../workers/colors-optimized.json';

// Optimized colors map: language name -> hex color
type LanguageColorsMap = Record<string, string>;

// Type assertion for the imported JSON data
const languageColors = languageColorsData as LanguageColorsMap;

/**
 * Get the hex color for a programming language
 * @param language - The programming language name
 * @returns Hex color string or null if not found
 */
export function getLanguageHexColor(language: string): string | null {
  if (!language) return null;
  
  // Try exact match first
  const exactMatch = languageColors[language];
  if (exactMatch) {
    return exactMatch;
  }
  
  // Try case-insensitive match
  const languageKey = Object.keys(languageColors).find(
    key => key.toLowerCase() === language.toLowerCase()
  );
  
  if (languageKey && languageColors[languageKey]) {
    return languageColors[languageKey];
  }
  
  // Try common variations and mappings
  const languageMappings: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'csharp': 'C#',
    'html': 'HTML',
    'css': 'CSS',
    'json': 'JSON',
    'markdown': 'Markdown',
    'sql': 'SQL',
    'bash': 'Shell',
    'shell': 'Shell',
    'php': 'PHP',
    'ruby': 'Ruby',
    'go': 'Go',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'dart': 'Dart',
    'lua': 'Lua',
    'perl': 'Perl',
    'r': 'R',
    'matlab': 'MATLAB',
    'dockerfile': 'Dockerfile',
    'yaml': 'YAML',
    'yml': 'YAML',
    'xml': 'XML',
    'scss': 'Sass',
    'sass': 'Sass',
    'less': 'Less',
    'vue': 'Vue',
    'jsx': 'JavaScript',
    'tsx': 'TSX'
  };
  
  const mappedLanguage = languageMappings[language.toLowerCase()];
  if (mappedLanguage && languageColors[mappedLanguage]) {
    return languageColors[mappedLanguage];
  }
  
  return null;
}

/**
 * Convert hex color to Tailwind CSS background class
 * @param hexColor - Hex color string (e.g., "#f1e05a")
 * @returns Tailwind CSS style object or fallback class
 */
export function hexToTailwindBg(hexColor: string | null): React.CSSProperties | string {
  if (!hexColor) {
    return 'bg-gray-400'; // fallback class
  }
  
  // Return inline style for custom colors
  return {
    backgroundColor: hexColor
  };
}

/**
 * Get Tailwind CSS background style for a programming language
 * @param language - The programming language name
 * @returns Tailwind CSS style object or fallback class
 */
export function getLanguageBackgroundStyle(language: string): React.CSSProperties | string {
  const hexColor = getLanguageHexColor(language);
  return hexToTailwindBg(hexColor);
}

/**
 * Get all available languages with their colors
 * @returns Array of language objects with name and color
 */
export function getAllLanguageColors(): Array<{ name: string; color: string }> {
  return Object.entries(languageColors).map(([name, color]) => ({
    name,
    color
  }));
}

/**
 * Check if a language has a defined color
 * @param language - The programming language name
 * @returns Boolean indicating if color is available
 */
export function hasLanguageColor(language: string): boolean {
  return getLanguageHexColor(language) !== null;
}