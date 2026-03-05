import { expect, type Locator, type Page } from '@playwright/test';
import { hideAstroDevToolbar } from './testEnvironment';
export { isDesktopViewport, isMobileViewport } from './viewports';

const CHATGPT_ORIGIN = 'https://chat.openai.com';
const CHATGPT_PATHNAME = '/';

export const EDITED_PROMPT_BODY = 'Summarize in one sentence.';

export const installWindowOpenCapture = async (page: Page): Promise<void> => {
  await hideAstroDevToolbar(page);

  await page.addInitScript(() => {
    const storage = window as typeof window & { __aiOpenedUrls?: string[] };
    storage.__aiOpenedUrls = [];

    window.open = ((url?: string | URL) => {
      const openedUrl = typeof url === 'string' ? url : url?.toString() ?? '';
      storage.__aiOpenedUrls?.push(openedUrl);
      return null;
    }) as typeof window.open;
  });
};

export const getOpenedUrls = async (page: Page): Promise<string[]> => {
  return page.evaluate(() => {
    const storage = window as typeof window & { __aiOpenedUrls?: string[] };
    return storage.__aiOpenedUrls ?? [];
  });
};

export const rewritePromptPreservingUrlLine = async (
  page: Page,
  prompt: Locator,
  bodyText = EDITED_PROMPT_BODY,
): Promise<string> => {
  const currentHref = await page.evaluate(() => window.location.href);
  const initialPrompt = await prompt.inputValue();
  const [urlLine = ''] = initialPrompt.split('\n');

  expect(urlLine).toBe(currentHref);

  const updatedPrompt = `${urlLine}\n\n${bodyText}`;
  await prompt.fill(updatedPrompt);

  return updatedPrompt;
};

export const expectChatGptDeeplink = (
  openedUrl: string,
  expectedPrompt: string,
): void => {
  const deeplink = new URL(openedUrl);

  expect(deeplink.origin).toBe(CHATGPT_ORIGIN);
  expect(deeplink.pathname).toBe(CHATGPT_PATHNAME);
  expect(deeplink.searchParams.get('q')).toBe(expectedPrompt);
};

export const expectStillOnHomepage = async (page: Page): Promise<void> => {
  const pathname = await page.evaluate(() => window.location.pathname);
  expect(pathname).toBe('/');
};
