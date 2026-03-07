import { expect, test } from '@playwright/test';
import { getPrimaryPageRoutes, runAxeScan } from './helpers/a11y';
import { pathPattern } from './helpers/navigationTargets';
import { hideAstroDevToolbar } from './helpers/testEnvironment';
import { isMobileViewport } from './helpers/viewports';

const primaryRoutes = getPrimaryPageRoutes();
const homepageA11yTestTimeoutMs = 60_000;

for (const route of primaryRoutes) {
  test(`mobile a11y checks for ${route.path}`, async ({ page }) => {
    if (route.path === '/') {
      test.setTimeout(homepageA11yTestTimeoutMs);
    }
    await hideAstroDevToolbar(page);
    await page.goto(route.path);

    test.skip(
      !(await isMobileViewport(page)),
      'Mobile breakpoint is required for this spec.',
    );

    await expect(page).toHaveURL(pathPattern(route.path));
    await expect(page.locator('main').first()).toBeVisible();

    await runAxeScan(page, {
      routePath: route.path,
      stateLabel: 'baseline',
    });

    const openMenuButton = page.getByRole('button', {
      name: 'Open main menu',
      exact: true,
    });
    const menuDrawer = page.locator('#mobile-drawer-menu');
    const closeMenuButton = menuDrawer.getByRole('button', {
      name: 'Close main menu',
      exact: true,
    });

    await expect(openMenuButton).toBeVisible();
    await openMenuButton.click();
    await expect(menuDrawer).toHaveAttribute('aria-hidden', 'false');

    await runAxeScan(page, {
      routePath: route.path,
      stateLabel: 'mobile main menu open',
    });

    await closeMenuButton.click();
    await expect(menuDrawer).toHaveAttribute('aria-hidden', 'true');

    const openTocButton = page.getByRole('button', {
      name: 'Open in-page sections',
      exact: true,
    });
    const tocDrawer = page.locator('#mobile-drawer-toc');
    const closeTocButton = tocDrawer.getByRole('button', {
      name: 'Close in-page sections',
      exact: true,
    });

    await expect(openTocButton).toBeVisible();
    await openTocButton.click();
    await expect(tocDrawer).toHaveAttribute('aria-hidden', 'false');

    await runAxeScan(page, {
      routePath: route.path,
      stateLabel: 'mobile in-page sections open',
    });

    await closeTocButton.click();
    await expect(tocDrawer).toHaveAttribute('aria-hidden', 'true');
  });
}
