import { expect, test } from '@playwright/test';
import { pathPattern } from './helpers/navigationTargets';
import { hideAstroDevToolbar } from './helpers/testEnvironment';
import { isDesktopViewport } from './helpers/viewports';

interface DesktopTocEntry {
  targetId: string;
  label: string;
}

test('desktop in-page sections sidebar navigates all Services page anchors', async ({
  page,
}) => {
  await hideAstroDevToolbar(page);
  await page.goto('/services');

  test.skip(
    !(await isDesktopViewport(page)),
    'Desktop breakpoint is required for this spec.',
  );

  await expect(page).toHaveURL(pathPattern('/services'));
  await expect(page.locator('main').first()).toBeVisible();

  const desktopSidebar = page.locator('aside.desktop-sidebar');
  await expect(desktopSidebar).toBeVisible();

  const openTocTab = desktopSidebar.getByRole('tab', {
    name: 'In-page sections',
    exact: true,
  });
  await expect(openTocTab).toBeVisible();
  await openTocTab.click();

  const tocNav = desktopSidebar.locator('nav[aria-label="In-page sections"]');
  await expect(tocNav).toBeVisible();

  const tocLinks = tocNav.locator('a[data-toc-target]');
  const tocEntries = await tocLinks.evaluateAll<DesktopTocEntry[]>(
    (anchors) =>
      anchors
        .map((anchor) => ({
          targetId: anchor.getAttribute('data-toc-target') ?? '',
          label: anchor.textContent?.trim() ?? '',
        }))
        .filter((entry) => entry.targetId.length > 0),
  );

  expect(tocEntries.length).toBeGreaterThan(0);

  for (const entry of tocEntries) {
    const section = page.locator(`#${entry.targetId}`);
    await expect(section, `missing section for TOC item "${entry.label}"`).toHaveCount(
      1,
    );

    const link = tocNav.locator(`a[data-toc-target="${entry.targetId}"]`);
    await expect(link).toBeVisible();
    await link.click();

    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(
      `#${entry.targetId}`,
    );
    await expect(section).toBeInViewport();
    await expect(page).toHaveURL(pathPattern('/services'));
  }
});
