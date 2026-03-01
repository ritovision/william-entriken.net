export type AIProvider = 'chatgpt' | 'claude' | 'perplexity';

export const isAIProvider = (value: string | null): value is AIProvider =>
  value === 'chatgpt' || value === 'claude' || value === 'perplexity';

export const buildDeeplink = (provider: AIProvider, queryText: string): string => {
  const encodedQuery = encodeURIComponent(queryText.trim());

  switch (provider) {
    case 'chatgpt':
      return `https://chat.openai.com/?q=${encodedQuery}`;
    case 'claude':
      return `https://claude.ai/new?q=${encodedQuery}`;
    case 'perplexity':
      return `https://www.perplexity.ai/search?q=${encodedQuery}`;
  }
};

export const openAIDeeplink = (provider: AIProvider, queryText: string): void => {
  const url = buildDeeplink(provider, queryText);
  window.open(url, '_blank', 'noopener,noreferrer');
};
