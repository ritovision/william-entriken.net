import type { Page } from '@playwright/test';

const DESKTOP_MIN_WIDTH = 992;

const getViewportWidth = async (page: Page): Promise<number> => {
  const viewport = page.viewportSize();
  if (viewport) {
    return viewport.width;
  }

  return page.evaluate(() => window.innerWidth);
};

export const isDesktopViewport = async (page: Page): Promise<boolean> => {
  const width = await getViewportWidth(page);
  return width >= DESKTOP_MIN_WIDTH;
};

export const isMobileViewport = async (page: Page): Promise<boolean> => {
  const width = await getViewportWidth(page);
  return width < DESKTOP_MIN_WIDTH;
};
