import { expect, test } from '@playwright/test';
import { getPrimaryPageRoutes, runAxeScan } from './helpers/a11y';
import { pathPattern } from './helpers/navigationTargets';
import { hideAstroDevToolbar } from './helpers/testEnvironment';
import { isDesktopViewport } from './helpers/viewports';

const primaryRoutes = getPrimaryPageRoutes();

for (const route of primaryRoutes) {
  test(`desktop a11y checks for ${route.path}`, async ({ page }) => {
    // Skip temporarily while site is still being built
    test.skip(true, 'Skip temporarily while site still being built.');
    await hideAstroDevToolbar(page);
    await page.goto(route.path);

    test.skip(
      !(await isDesktopViewport(page)),
      'Desktop breakpoint is required for this spec.',
    );

    await expect(page).toHaveURL(pathPattern(route.path));
    await expect(page.locator('main').first()).toBeVisible();

    await runAxeScan(page, {
      routePath: route.path,
      stateLabel: 'baseline',
    });

    const desktopSidebar = page.locator('aside.desktop-sidebar');
    await expect(desktopSidebar).toBeVisible();

    const tocTab = desktopSidebar.getByRole('tab', {
      name: 'In-page sections',
      exact: true,
    });
    await expect(tocTab).toBeVisible();
    await tocTab.click();

    await runAxeScan(page, {
      routePath: route.path,
      stateLabel: 'desktop in-page sections open',
    });
  });
}
