import { expect, test } from '@playwright/test';
import { navigationTargets, pathPattern } from './helpers/navigationTargets';

const navigationTimeoutMs = 15_000;
const navigationAttempts = 2;

test('mobile main menu navigates to each internal primary route', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('main').first()).toBeVisible();

  const openMenuButton = page.getByRole('button', { name: 'Open main menu' });
  const menuDrawer = page.locator('#mobile-drawer-menu');
  const menuNav = menuDrawer.locator('nav[aria-label="Main menu links"]');

  await expect(openMenuButton).toBeVisible();

  for (const target of navigationTargets) {
    const targetPattern = pathPattern(target.path);

    for (let attempt = 1; attempt <= navigationAttempts; attempt += 1) {
      if (targetPattern.test(page.url())) {
        break;
      }

      await openMenuButton.click();
      await expect(menuDrawer).toHaveClass(/\bis-open\b/);

      const link = menuNav.getByRole('link', {
        name: target.label,
        exact: true,
      });

      await expect(link).toBeVisible();
      await link.click();

      try {
        await expect(page).toHaveURL(targetPattern, {
          timeout: navigationTimeoutMs,
        });
        break;
      } catch (error) {
        if (attempt === navigationAttempts) {
          throw error;
        }
        await page.waitForTimeout(500);
      }
    }

    await expect(page).toHaveURL(pathPattern(target.path));
    await expect(menuDrawer).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('main').first()).toBeVisible();
  }
});
