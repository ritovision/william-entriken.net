import { expect, test, type Locator, type Page } from '@playwright/test';
import { navigationTargets, pathPattern } from './helpers/navigationTargets';

const desktopSidebarNavSelector =
  'aside.desktop-sidebar nav[aria-label="Main menu links"]';
const navigationTimeoutMs = 15_000;
const navigationAttempts = 2;

const navigateWithRetry = async (
  page: Page,
  link: Locator,
  targetPath: string,
) => {
  const targetPattern = pathPattern(targetPath);

  for (let attempt = 1; attempt <= navigationAttempts; attempt += 1) {
    if (targetPattern.test(page.url())) {
      return;
    }

    await link.click();

    try {
      await expect(page).toHaveURL(targetPattern, {
        timeout: navigationTimeoutMs,
      });
      return;
    } catch (error) {
      if (attempt === navigationAttempts) {
        throw error;
      }
      await page.waitForTimeout(500);
    }
  }
};

test('desktop sidebar navigates to each internal primary route', async ({
  page,
}) => {
  await page.goto('/');

  const desktopNav = page.locator(desktopSidebarNavSelector);
  await expect(desktopNav).toBeVisible();
  await expect(page.locator('main').first()).toBeVisible();

  for (const target of navigationTargets) {
    const link = desktopNav.getByRole('link', {
      name: target.label,
      exact: true,
    });

    await expect(link).toBeVisible();
    await navigateWithRetry(page, link, target.path);
    await expect(page).toHaveURL(pathPattern(target.path));
    await expect(page.locator('main').first()).toBeVisible();
  }
});
