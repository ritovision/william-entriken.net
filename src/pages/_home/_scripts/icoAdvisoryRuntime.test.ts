// @vitest-environment jsdom

import {
  computeParallaxOffset,
  hydrateIcoAdvisorySection,
  syncIcoAdvisoryParallax,
} from './icoAdvisoryRuntime';

type ObserverEntry = {
  observer: IntersectionObserverStub;
  target: Element;
  isIntersecting: boolean;
};

class IntersectionObserverStub {
  static instances: IntersectionObserverStub[] = [];

  callback: IntersectionObserverCallback;

  observed = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverStub.instances.push(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }

  fire(entries: ObserverEntry[]): void {
    this.callback(
      entries.map((entry) => ({
        isIntersecting: entry.isIntersecting,
        target: entry.target,
      })) as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

const installMatchMediaStub = (reducedMotion = false): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
};

const buildFixture = () => {
  document.body.innerHTML = `
    <section data-ico-advisory>
      <div data-ico-portrait class="ico-advisory__portrait ico-advisory__portrait--pre"></div>
      <div data-ico-coins-pane></div>
      <div class="ico-advisory__coins-image ico-advisory__coins-image--pre"></div>
    </section>
  `;

  const root = document.querySelector<HTMLElement>('[data-ico-advisory]');
  const portrait = document.querySelector<HTMLElement>('[data-ico-portrait]');
  const coinsPane = document.querySelector<HTMLElement>(
    '[data-ico-coins-pane]',
  );
  const coinsImage = document.querySelector<HTMLElement>(
    '.ico-advisory__coins-image',
  );

  if (!root || !portrait || !coinsPane || !coinsImage) {
    throw new Error('Failed to build ICO advisory fixture.');
  }

  return {
    root,
    portrait,
    coinsPane,
    coinsImage,
  };
};

describe('icoAdvisoryRuntime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    IntersectionObserverStub.instances = [];
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('innerHeight', 1000);
    installMatchMediaStub(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('reveals the portrait when the section intersects', () => {
    const { root, portrait } = buildFixture();

    hydrateIcoAdvisorySection(root);

    IntersectionObserverStub.instances[0]?.fire([
      {
        observer: IntersectionObserverStub.instances[0],
        target: root,
        isIntersecting: true,
      },
    ]);

    expect(portrait).toHaveClass('ico-advisory__portrait--revealed');
    expect(portrait).not.toHaveClass('ico-advisory__portrait--pre');
  });

  it('reveals the portrait only once', () => {
    const { root, portrait } = buildFixture();

    hydrateIcoAdvisorySection(root);

    IntersectionObserverStub.instances[0]?.fire([
      {
        observer: IntersectionObserverStub.instances[0],
        target: root,
        isIntersecting: true,
      },
    ]);

    expect(IntersectionObserverStub.instances[0]?.observed.has(root)).toBe(
      false,
    );
    expect(portrait).toHaveClass('ico-advisory__portrait--revealed');
  });

  it('updates the parallax CSS variable while the coins pane is in view', () => {
    const { root, coinsPane, coinsImage } = buildFixture();

    coinsPane.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      height: 300,
    })) as unknown as typeof coinsPane.getBoundingClientRect;

    const controller = hydrateIcoAdvisorySection(root);
    IntersectionObserverStub.instances[0]?.fire([
      {
        observer: IntersectionObserverStub.instances[0],
        target: coinsPane,
        isIntersecting: true,
      },
    ]);

    controller?.sync();

    expect(root.style.getPropertyValue('--ico-advisory-parallax-y')).not.toBe(
      '',
    );
    expect(coinsImage).toHaveClass('ico-advisory__coins-image--visible');
  });

  it('does not update parallax when reduced motion is enabled', () => {
    installMatchMediaStub(true);
    const { root, portrait } = buildFixture();

    const controller = hydrateIcoAdvisorySection(root);
    controller?.sync();

    expect(root.style.getPropertyValue('--ico-advisory-parallax-y')).toBe(
      '0px',
    );
    expect(portrait).toHaveClass('ico-advisory__portrait--revealed');
  });

  it('computes a clamped parallax offset from the pane position', () => {
    const { coinsPane } = buildFixture();

    coinsPane.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      height: 400,
    })) as unknown as typeof coinsPane.getBoundingClientRect;

    expect(computeParallaxOffset(coinsPane)).toBeGreaterThan(0);
  });

  it('syncs the parallax CSS variable through the helper', () => {
    const { root, coinsPane } = buildFixture();

    coinsPane.getBoundingClientRect = vi.fn(() => ({
      top: 900,
      height: 300,
    })) as unknown as typeof coinsPane.getBoundingClientRect;

    syncIcoAdvisoryParallax(root, coinsPane);

    expect(root.style.getPropertyValue('--ico-advisory-parallax-y')).not.toBe(
      '',
    );
  });
});
