import type { Page } from '@playwright/test';

export const hideAstroDevToolbar = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const hideToolbar = () => {
      if (document.getElementById('pw-hide-astro-dev-toolbar')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'pw-hide-astro-dev-toolbar';
      style.textContent = 'astro-dev-toolbar { display: none !important; }';
      document.head.append(style);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideToolbar, { once: true });
      return;
    }

    hideToolbar();
  });
};
