/**
 * Simple token counter for LLM usage
 * Counts tokens based on character count approximation (4 chars ≈ 1 token)
 */

export const countTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const countTokensForFiles = (files: Array<{ content: string }>): { totalTokens: number; tokensByFile: Record<string, number> } => {
  const tokensByFile: Record<string, number> = {};
  let totalTokens = 0;

  files.forEach(file => {
    const tokens = countTokens(file.content);
    tokensByFile[file.content] = tokens; // Using content as key since path might not be available here
    totalTokens += tokens;
  });

  return { totalTokens, tokensByFile };
};

export const formatTokenCount = (tokens: number): string => {
  if (tokens >= 1000000) {
    return (tokens / 1000000).toFixed(1) + 'M';
  } else if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'K';
  }
  return tokens.toString();
};