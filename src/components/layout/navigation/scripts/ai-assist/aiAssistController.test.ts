// @vitest-environment jsdom

import { fireEvent, screen } from '@testing-library/dom';

const renderAiAssistFixture = (): void => {
  document.body.innerHTML = `
    <main>
      <h1>AI Assist Page</h1>
      <p>Main content body.</p>
    </main>

    <button type="button" data-ai-open-modal aria-label="Open Ask AI">
      Open Ask AI
    </button>

    <section data-ai-assist-modal aria-hidden="true" hidden>
      <button type="button" data-ai-close-modal aria-label="Close Ask AI modal">
        Close
      </button>

      <textarea data-ai-prompt aria-label="Prompt"></textarea>

      <button type="button" data-ai-provider="chatgpt">ChatGPT</button>
      <button type="button" data-ai-provider="not-supported">Unsupported</button>

      <button type="button" data-ai-copy>
        <span data-ai-copy-label>Copy Page as markdown</span>
      </button>

      <span data-ai-copy-status role="status" aria-live="polite"></span>
    </section>
  `;
};

const setClipboardMock = (writeTextImpl?: (text: string) => Promise<void>) => {
  const writeText = vi.fn(writeTextImpl ?? (async () => undefined));

  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });

  return writeText;
};

const importController = async () => {
  const module = await import('./aiAssistController');
  return module.initAiAssistController;
};

const flushAsyncHandlers = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

describe('initAiAssistController', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    document.body.innerHTML = '';
    document.title = 'AI Assist Controller';
    window.history.replaceState({}, '', '/nav/ai-assist');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is idempotent and does not register duplicate listeners', async () => {
    renderAiAssistFixture();
    setClipboardMock();

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const initAiAssistController = await importController();

    initAiAssistController();
    initAiAssistController();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AI' }));
    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT' }));

    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('opens on click and custom event, then closes on close button and Escape', async () => {
    renderAiAssistFixture();
    setClipboardMock();

    const initAiAssistController = await importController();
    initAiAssistController();

    const modal = document.querySelector<HTMLElement>('[data-ai-assist-modal]');
    expect(modal).not.toBeNull();
    expect(modal).toHaveAttribute('aria-hidden', 'true');
    expect(modal?.hidden).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AI' }));
    expect(modal).toHaveClass('is-open');
    expect(modal).toHaveAttribute('aria-hidden', 'false');
    expect(modal?.hidden).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Close Ask AI modal' }));
    expect(modal).not.toHaveClass('is-open');
    expect(modal).toHaveAttribute('aria-hidden', 'true');
    expect(modal?.hidden).toBe(true);

    document.dispatchEvent(new Event('ai-assist:open'));
    expect(modal).toHaveClass('is-open');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(modal).not.toHaveClass('is-open');
    expect(modal).toHaveAttribute('aria-hidden', 'true');
    expect(modal?.hidden).toBe(true);
  });

  it('resets prompt using the current page URL on open and close', async () => {
    renderAiAssistFixture();
    setClipboardMock();

    const initAiAssistController = await importController();
    initAiAssistController();

    const prompt = screen.getByRole('textbox', {
      name: 'Prompt',
      hidden: true,
    });
    const expectedPrompt = `${window.location.href}\n\nExplain this page to me.`;

    expect(prompt).toHaveValue(expectedPrompt);

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AI' }));
    fireEvent.input(prompt, { target: { value: 'Custom question' } });
    expect(prompt).toHaveValue('Custom question');

    fireEvent.click(screen.getByRole('button', { name: 'Close Ask AI modal' }));
    expect(prompt).toHaveValue(expectedPrompt);

    document.dispatchEvent(new Event('ai-assist:open'));
    expect(prompt).toHaveValue(expectedPrompt);
  });

  it('opens deeplinks for valid providers and ignores invalid providers', async () => {
    renderAiAssistFixture();
    setClipboardMock();

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const initAiAssistController = await importController();
    initAiAssistController();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AI' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unsupported' }));
    expect(openSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT' }));

    const expectedPrompt = encodeURIComponent(
      `${window.location.href}\n\nExplain this page to me.`,
    );

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      `https://chat.openai.com/?q=${expectedPrompt}`,
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows copy success feedback and resets it after timeout', async () => {
    vi.useFakeTimers();
    renderAiAssistFixture();
    const writeText = setClipboardMock(async () => undefined);

    const initAiAssistController = await importController();
    initAiAssistController();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AI' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy Page as markdown' }),
    );

    await flushAsyncHandlers();

    const copyLabel = document.querySelector('[data-ai-copy-label]');
    const copyStatus = document.querySelector('[data-ai-copy-status]');

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(copyLabel).toHaveTextContent('Copied!');
    expect(copyStatus).toHaveTextContent('Copied!');

    vi.advanceTimersByTime(2000);

    expect(copyLabel).toHaveTextContent('Copy Page as markdown');
    expect(copyStatus).toHaveTextContent('');
  });

  it('shows copy failure feedback and resets it after timeout', async () => {
    vi.useFakeTimers();
    renderAiAssistFixture();

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });

    const initAiAssistController = await importController();
    initAiAssistController();

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask AI' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy Page as markdown' }),
    );

    await flushAsyncHandlers();

    const copyLabel = document.querySelector('[data-ai-copy-label]');
    const copyStatus = document.querySelector('[data-ai-copy-status]');

    expect(copyLabel).toHaveTextContent('Failed to Copy!');
    expect(copyStatus).toHaveTextContent('Failed to copy page as markdown.');

    vi.advanceTimersByTime(2000);

    expect(copyLabel).toHaveTextContent('Copy Page as markdown');
    expect(copyStatus).toHaveTextContent('');
  });
});
