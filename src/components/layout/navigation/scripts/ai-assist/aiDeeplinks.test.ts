import { buildDeeplink, isAIProvider, openAIDeeplink } from './aiDeeplinks';

describe('aiDeeplinks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('accepts only supported AI providers', () => {
    expect(isAIProvider('chatgpt')).toBe(true);
    expect(isAIProvider('claude')).toBe(true);
    expect(isAIProvider('perplexity')).toBe(true);

    expect(isAIProvider('gemini')).toBe(false);
    expect(isAIProvider('')).toBe(false);
    expect(isAIProvider(null)).toBe(false);
  });

  it('builds provider-specific deeplinks with trimmed and encoded query text', () => {
    const query = '  Explain this page?  ';

    expect(buildDeeplink('chatgpt', query)).toBe(
      'https://chat.openai.com/?q=Explain%20this%20page%3F',
    );
    expect(buildDeeplink('claude', query)).toBe(
      'https://claude.ai/new?q=Explain%20this%20page%3F',
    );
    expect(buildDeeplink('perplexity', query)).toBe(
      'https://www.perplexity.ai/search?q=Explain%20this%20page%3F',
    );
  });

  it('opens the provider deeplink in a new tab with safety flags', () => {
    const openSpy = vi.fn();
    vi.stubGlobal('window', { open: openSpy });

    openAIDeeplink('claude', '  hello world  ');

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      'https://claude.ai/new?q=hello%20world',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
