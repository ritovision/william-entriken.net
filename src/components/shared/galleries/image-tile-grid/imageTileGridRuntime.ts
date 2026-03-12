interface ImageTileGridElements {
  root: HTMLElement;
  viewport: HTMLElement;
  expandWrap: HTMLElement;
  expandButton: HTMLButtonElement;
}

interface ImageTileGridState {
  expanded: boolean;
  viewportBucket: 'mobile' | 'tablet' | 'desktop';
}

interface ImageTileGridController {
  sync: () => void;
  expand: () => void;
}

const OVERFLOW_TOLERANCE_PX = 1;

const getViewportBucket = (): 'mobile' | 'tablet' | 'desktop' => {
  if (window.matchMedia('(min-width: 992px)').matches) {
    return 'desktop';
  }

  if (window.matchMedia('(min-width: 768px)').matches) {
    return 'tablet';
  }

  return 'mobile';
};

const hasGridOverflow = (viewport: HTMLElement): boolean =>
  viewport.scrollHeight > viewport.clientHeight + OVERFLOW_TOLERANCE_PX;

export const syncImageTileGrid = (
  elements: ImageTileGridElements,
  state: ImageTileGridState,
): void => {
  if (state.expanded) {
    elements.expandWrap.hidden = true;
    elements.expandButton.hidden = true;
    elements.expandButton.setAttribute('aria-expanded', 'true');
    elements.root.classList.add('is-expanded');
    return;
  }

  const overflow = hasGridOverflow(elements.viewport);

  elements.expandWrap.hidden = !overflow;
  elements.expandButton.hidden = !overflow;
  elements.expandButton.setAttribute('aria-expanded', 'false');
  elements.root.classList.remove('is-expanded');
};

const readGridElements = (root: HTMLElement): ImageTileGridElements | null => {
  const viewport = root.querySelector<HTMLElement>('[data-image-tile-viewport]');
  const expandWrap = root.querySelector<HTMLElement>('[data-image-tile-expand-wrap]');
  const expandButton =
    root.querySelector<HTMLButtonElement>('[data-image-tile-expand]');

  if (!viewport || !expandWrap || !expandButton) {
    return null;
  }

  return {
    root,
    viewport,
    expandWrap,
    expandButton,
  };
};

export const hydrateImageTileGrid = (
  root: HTMLElement,
): ImageTileGridController | null => {
  if (root.dataset.imageTileGridBound === 'true') {
    return null;
  }

  const elements = readGridElements(root);
  if (!elements) {
    return null;
  }

  root.dataset.imageTileGridBound = 'true';

  const state: ImageTileGridState = {
    expanded: root.classList.contains('is-expanded'),
    viewportBucket: getViewportBucket(),
  };

  let frameId = 0;
  const scheduleSync = (): void => {
    if (frameId !== 0) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      const nextViewportBucket = getViewportBucket();
      if (nextViewportBucket !== state.viewportBucket) {
        state.viewportBucket = nextViewportBucket;
        state.expanded = false;
      }
      syncImageTileGrid(elements, state);
    });
  };

  const expand = (): void => {
    if (state.expanded) {
      return;
    }

    state.expanded = true;
    syncImageTileGrid(elements, state);
  };

  elements.expandButton.addEventListener('click', expand);

  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(() => {
      scheduleSync();
    });

    resizeObserver.observe(elements.viewport);
    const track = root.querySelector<HTMLElement>('[data-image-tile-track]');
    if (track) {
      resizeObserver.observe(track);
    }
  } else {
    window.addEventListener('resize', scheduleSync);
  }

  syncImageTileGrid(elements, state);

  return {
    sync: scheduleSync,
    expand,
  };
};

export const initImageTileGrids = (scope: ParentNode = document): void => {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>('[data-image-tile-grid]'),
  );

  for (const root of roots) {
    hydrateImageTileGrid(root);
  }
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initImageTileGrids(), {
      once: true,
    });
  } else {
    initImageTileGrids();
  }

  document.addEventListener('astro:page-load', () => initImageTileGrids());
}
