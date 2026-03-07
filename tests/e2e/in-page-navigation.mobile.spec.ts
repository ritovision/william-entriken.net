import { expect, test } from '@playwright/test';
import { pathPattern } from './helpers/navigationTargets';
import { hideAstroDevToolbar } from './helpers/testEnvironment';
import { isMobileViewport } from './helpers/viewports';

interface MobileTocEntry {
  targetId: string;
  label: string;
}

test('mobile in-page sections drawer navigates all Services page anchors', async ({
  page,
}) => {
  await hideAstroDevToolbar(page);
  await page.goto('/services');

  test.skip(
    !(await isMobileViewport(page)),
    'Mobile breakpoint is required for this spec.',
  );

  await expect(page).toHaveURL(pathPattern('/services'));
  await expect(page.locator('main').first()).toBeVisible();

  const openTocButton = page.getByRole('button', {
    name: 'Open in-page sections',
    exact: true,
  });
  const tocDrawer = page.locator('#mobile-drawer-toc');
  const tocNav = tocDrawer.locator('nav[aria-label="In-page sections"]');

  await expect(openTocButton).toBeVisible();
  await expect(tocNav).toBeVisible();

  const tocLinks = tocNav.locator('a[data-mobile-toc-target]');
  const tocEntries = await tocLinks.evaluateAll<MobileTocEntry[]>((anchors) =>
    anchors
      .map((anchor) => ({
        targetId: anchor.getAttribute('data-mobile-toc-target') ?? '',
        label: anchor.textContent?.trim() ?? '',
      }))
      .filter((entry) => entry.targetId.length > 0),
  );

  expect(tocEntries.length).toBeGreaterThan(0);

  for (const entry of tocEntries) {
    await openTocButton.click();
    await expect(tocDrawer).toHaveAttribute('aria-hidden', 'false');

    const link = tocDrawer.locator(
      `a[data-mobile-toc-target="${entry.targetId}"]`,
    );
    await expect(link).toBeVisible();
    await link.click();

    const section = page.locator(`#${entry.targetId}`);
    await expect(section, `missing section for TOC item "${entry.label}"`).toHaveCount(
      1,
    );

    await expect(tocDrawer).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(
      `#${entry.targetId}`,
    );
    await expect(section).toBeInViewport({ timeout: 10_000 });
    await expect(page).toHaveURL(pathPattern('/services'));
  }
});
