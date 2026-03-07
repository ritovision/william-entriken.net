// @vitest-environment jsdom

import { copyPageAsMarkdown } from './markdownCopy';

const setClipboardMock = (writeTextImpl?: (text: string) => Promise<void>) => {
  const writeText = vi.fn(writeTextImpl ?? (async () => undefined));

  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });

  return writeText;
};

describe('copyPageAsMarkdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.title = '';
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies markdown with title/source, content conversion, and stripped nav chrome', async () => {
    document.title = 'AI Assist Test Page';
    window.history.replaceState({}, '', '/articles/ai-assist');

    document.body.innerHTML = `
      <header>Header to remove</header>
      <nav>Nav to remove</nav>
      <main>
        <h2>Section Title</h2>
        <p>Read the <a href="/docs">Docs Link</a></p>
        <p>Use <code>inline</code> formatting.</p>
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
        <div class="desktop-sidebar">Desktop sidebar to remove</div>
        <section data-ai-assist-modal>AI modal to remove</section>
      </main>
      <footer>Footer to remove</footer>
    `;

    const writeText = setClipboardMock();

    await copyPageAsMarkdown();

    expect(writeText).toHaveBeenCalledTimes(1);
    const [markdown] = writeText.mock.calls[0] as [string];

    expect(markdown).toContain('# AI Assist Test Page');
    expect(markdown).toContain(
      'Source: http://localhost:3000/articles/ai-assist',
    );
    expect(markdown).toContain('## Section Title');
    expect(markdown).toContain('[Docs Link](/docs)');
    expect(markdown).toContain('`inline`');
    expect(markdown).toContain('- First item');
    expect(markdown).toContain('- Second item');

    expect(markdown).not.toContain('Header to remove');
    expect(markdown).not.toContain('Nav to remove');
    expect(markdown).not.toContain('Footer to remove');
    expect(markdown).not.toContain('Desktop sidebar to remove');
    expect(markdown).not.toContain('AI modal to remove');
  });

  it('falls back to article content when main is not present', async () => {
    document.title = 'Article Fallback';
    window.history.replaceState({}, '', '/articles/fallback');

    document.body.innerHTML = `
      <article>
        <h1>Article Heading</h1>
        <p>Article body content.</p>
      </article>
    `;

    const writeText = setClipboardMock();

    await copyPageAsMarkdown();

    const [markdown] = writeText.mock.calls[0] as [string];
    expect(markdown).toContain('Article body content.');
    expect(markdown).toContain(
      'Source: http://localhost:3000/articles/fallback',
    );
  });

  it('throws when the Clipboard API is unavailable', async () => {
    document.title = 'Clipboard Missing';
    document.body.innerHTML = '<main><p>Test body</p></main>';

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    await expect(copyPageAsMarkdown()).rejects.toThrow(
      'Clipboard API is not available in this browser context.',
    );
  });
});
