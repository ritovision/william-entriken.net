import { expect, test } from '@playwright/test';
import {
  expectChatGptDeeplink,
  expectStillOnHomepage,
  getOpenedUrls,
  installWindowOpenCapture,
  isMobileViewport,
  rewritePromptPreservingUrlLine,
} from './helpers/aiAssistDeeplink';

test('mobile drawer Ask your AI builds expected ChatGPT deeplink', async ({
  page,
}) => {
  await installWindowOpenCapture(page);
  await page.goto('/');

  test.skip(
    !(await isMobileViewport(page)),
    'Mobile breakpoint is required for this spec.',
  );

  await expect(page.locator('main').first()).toBeVisible();

  const openTocButton = page.getByRole('button', {
    name: 'Open in-page sections',
    exact: true,
  });
  await expect(openTocButton).toBeVisible();
  await openTocButton.click();

  const tocDrawer = page.locator('#mobile-drawer-toc');
  await expect(tocDrawer).toHaveClass(/\bis-open\b/);

  const openAskAiButton = tocDrawer.getByRole('button', {
    name: 'Ask your AI',
    exact: true,
  });
  await expect(openAskAiButton).toBeVisible();
  await openAskAiButton.click({ force: true });

  await expect(tocDrawer).toHaveAttribute('aria-hidden', 'true');

  const aiAssistModal = page.locator('[data-ai-assist-modal]');
  await expect(aiAssistModal).toHaveAttribute('aria-hidden', 'false');

  const prompt = aiAssistModal.locator('[data-ai-prompt]');
  await expect(prompt).toBeVisible();

  const expectedPrompt = await rewritePromptPreservingUrlLine(page, prompt);

  const chatGptButton = aiAssistModal.locator('[data-ai-provider="chatgpt"]');
  await expect(chatGptButton).toBeVisible();
  await chatGptButton.click();

  const openedUrls = await getOpenedUrls(page);
  expect(openedUrls).toHaveLength(1);
  expectChatGptDeeplink(openedUrls[0], expectedPrompt);

  await expectStillOnHomepage(page);
});
