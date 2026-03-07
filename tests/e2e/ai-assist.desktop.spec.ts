import { expect, test } from '@playwright/test';
import {
  expectChatGptDeeplink,
  expectStillOnHomepage,
  getOpenedUrls,
  installWindowOpenCapture,
  isDesktopViewport,
  rewritePromptPreservingUrlLine,
} from './helpers/aiAssistDeeplink';

test('desktop sidebar Ask your AI builds expected ChatGPT deeplink', async ({
  page,
}) => {
  await installWindowOpenCapture(page);
  await page.goto('/');

  test.skip(
    !(await isDesktopViewport(page)),
    'Desktop breakpoint is required for this spec.',
  );

  await expect(page.locator('main').first()).toBeVisible();

  const desktopSidebar = page.locator('aside.desktop-sidebar');
  await expect(desktopSidebar).toBeVisible();

  const openTocTab = desktopSidebar.getByRole('tab', {
    name: 'In-page sections',
    exact: true,
  });
  await expect(openTocTab).toBeVisible();
  await openTocTab.click();

  const openAskAiButton = desktopSidebar.getByRole('button', {
    name: 'Ask your AI',
    exact: true,
  });
  await expect(openAskAiButton).toBeVisible();
  await openAskAiButton.click({ force: true });

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
