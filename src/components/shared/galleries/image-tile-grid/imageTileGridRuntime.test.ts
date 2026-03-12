// @vitest-environment jsdom

import {
  hydrateImageTileGrid,
  syncImageTileGrid,
} from './imageTileGridRuntime';

class ResizeObserverStub {
  observe(): void {}

  disconnect(): void {}
}

const installMatchMediaStub = (getWidth: () => number): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query === '(min-width: 992px)'
          ? getWidth() >= 992
          : query === '(min-width: 768px)'
            ? getWidth() >= 768
            : false,
    })),
  );
};

const buildGridFixture = () => {
  document.body.innerHTML = `
    <section data-image-tile-grid>
      <div data-image-tile-viewport>
        <div data-image-tile-track></div>
        <div data-image-tile-expand-wrap hidden>
          <button type="button" data-image-tile-expand aria-expanded="false">
            Read More
          </button>
        </div>
      </div>
    </section>
  `;

  const root = document.querySelector<HTMLElement>('[data-image-tile-grid]');
  const viewport = document.querySelector<HTMLElement>('[data-image-tile-viewport]');
  const expandWrap = document.querySelector<HTMLElement>(
    '[data-image-tile-expand-wrap]',
  );
  const expandButton = document.querySelector<HTMLButtonElement>(
    '[data-image-tile-expand]',
  );

  if (!root || !viewport || !expandWrap || !expandButton) {
    throw new Error('Failed to build image tile grid fixture.');
  }

  return {
    root,
    viewport,
    expandWrap,
    expandButton,
  };
};

describe('imageTileGridRuntime', () => {
  beforeEach(() => {
    const width = 480;
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    installMatchMediaStub(() => width);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('keeps the expand control hidden when the viewport does not overflow', () => {
    const { root, viewport, expandWrap, expandButton } = buildGridFixture();

    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 500,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 500,
    });

    syncImageTileGrid(
      { root, viewport, expandWrap, expandButton },
      { expanded: false, viewportBucket: 'mobile' },
    );

    expect(expandWrap.hidden).toBe(true);
    expect(expandButton.hidden).toBe(true);
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the expand control when the viewport overflows', () => {
    const { root, viewport, expandWrap, expandButton } = buildGridFixture();

    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 780,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 500,
    });

    syncImageTileGrid(
      { root, viewport, expandWrap, expandButton },
      { expanded: false, viewportBucket: 'mobile' },
    );

    expect(expandWrap.hidden).toBe(false);
    expect(expandButton.hidden).toBe(false);
  });

  it('removes the clamp when the user expands the grid', () => {
    const { root, viewport, expandWrap, expandButton } = buildGridFixture();

    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 780,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 500,
    });

    const controller = hydrateImageTileGrid(root);

    expandButton.click();

    expect(controller).not.toBeNull();
    expect(root).toHaveClass('is-expanded');
    expect(expandWrap.hidden).toBe(true);
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('updates overflow state when the viewport changes size', () => {
    const { root, viewport, expandWrap, expandButton } = buildGridFixture();

    let clientHeight = 420;

    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 620,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => clientHeight,
    });

    const controller = hydrateImageTileGrid(root);
    expect(controller).not.toBeNull();
    expect(expandWrap.hidden).toBe(false);

    clientHeight = 620;
    controller?.sync();

    expect(expandWrap.hidden).toBe(true);
    expect(expandButton.hidden).toBe(true);
  });

  it('reclamps the grid when the viewport breakpoint changes', () => {
    const { root, viewport, expandWrap, expandButton } = buildGridFixture();

    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 780,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 500,
    });

    let width = 480;
    installMatchMediaStub(() => width);

    const controller = hydrateImageTileGrid(root);
    expandButton.click();

    expect(root).toHaveClass('is-expanded');

    width = 1200;
    controller?.sync();

    expect(root).not.toHaveClass('is-expanded');
    expect(expandWrap.hidden).toBe(false);
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });
});
