interface IcoAdvisoryElements {
  root: HTMLElement;
  portrait: HTMLElement;
  coinsPane: HTMLElement;
  coinsImage: HTMLElement;
}

interface IcoAdvisoryController {
  sync: () => void;
}

const PORTRAIT_REVEALED_CLASS = 'ico-advisory__portrait--revealed';
const PORTRAIT_PRE_CLASS = 'ico-advisory__portrait--pre';
const COINS_VISIBLE_CLASS = 'ico-advisory__coins-image--visible';
const COINS_PRE_CLASS = 'ico-advisory__coins-image--pre';
const PARALLAX_RANGE = 0.12;

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const computeParallaxOffset = (coinsPane: HTMLElement): number => {
  const rect = coinsPane.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const paneCenter = rect.top + rect.height / 2;
  const viewportCenter = viewportHeight / 2;
  const normalized = clamp(
    (viewportCenter - paneCenter) / Math.max(viewportHeight / 2, 1),
    -1,
    1,
  );

  return normalized * rect.height * PARALLAX_RANGE;
};

export const syncIcoAdvisoryParallax = (
  root: HTMLElement,
  coinsPane: HTMLElement,
): void => {
  root.style.setProperty(
    '--ico-advisory-parallax-y',
    `${computeParallaxOffset(coinsPane).toFixed(2)}px`,
  );
};

const setPortraitRevealed = (portrait: HTMLElement): void => {
  portrait.classList.remove(PORTRAIT_PRE_CLASS);
  portrait.classList.add(PORTRAIT_REVEALED_CLASS);
};

const setCoinsVisible = (coinsImage: HTMLElement): void => {
  coinsImage.classList.remove(COINS_PRE_CLASS);
  coinsImage.classList.add(COINS_VISIBLE_CLASS);
};

const readElements = (root: HTMLElement): IcoAdvisoryElements | null => {
  const portrait = root.querySelector<HTMLElement>('.ico-advisory__portrait');
  const coinsPane = root.querySelector<HTMLElement>('[data-ico-coins-pane]');
  const coinsImage = root.querySelector<HTMLElement>(
    '.ico-advisory__coins-image',
  );

  if (!portrait || !coinsPane || !coinsImage) {
    return null;
  }

  return {
    root,
    portrait,
    coinsPane,
    coinsImage,
  };
};

export const hydrateIcoAdvisorySection = (
  root: HTMLElement,
): IcoAdvisoryController | null => {
  if (root.dataset.icoAdvisoryBound === 'true') {
    return null;
  }

  const elements = readElements(root);
  if (!elements) {
    return null;
  }

  root.dataset.icoAdvisoryBound = 'true';

  if (prefersReducedMotion()) {
    setPortraitRevealed(elements.portrait);
    setCoinsVisible(elements.coinsImage);
    root.style.setProperty('--ico-advisory-parallax-y', '0px');
    return {
      sync: () => {},
    };
  }

  let isParallaxActive = false;
  let frameId = 0;

  const sync = (): void => {
    if (!isParallaxActive) {
      return;
    }

    if (frameId !== 0) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      syncIcoAdvisoryParallax(elements.root, elements.coinsPane);
    });
  };

  const handleScroll = (): void => {
    sync();
  };

  const handleResize = (): void => {
    sync();
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });

  if (!('IntersectionObserver' in window)) {
    setPortraitRevealed(elements.portrait);
    setCoinsVisible(elements.coinsImage);
    isParallaxActive = true;
    syncIcoAdvisoryParallax(elements.root, elements.coinsPane);
    return { sync };
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      for (const entry of entries) {
        if (entry.target === elements.root && entry.isIntersecting) {
          setPortraitRevealed(elements.portrait);
          currentObserver.unobserve(elements.root);
        }

        if (entry.target === elements.coinsPane) {
          isParallaxActive = entry.isIntersecting;
          if (isParallaxActive) {
            setCoinsVisible(elements.coinsImage);
            sync();
          }
        }
      }
    },
    {
      threshold: 0.2,
      rootMargin: '0px 0px -10% 0px',
    },
  );

  observer.observe(elements.root);
  observer.observe(elements.coinsPane);

  return { sync };
};

export const initIcoAdvisorySections = (scope: ParentNode = document): void => {
  const roots = Array.from(
    scope.querySelectorAll<HTMLElement>('[data-ico-advisory]'),
  );

  for (const root of roots) {
    hydrateIcoAdvisorySection(root);
  }
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => initIcoAdvisorySections(),
      {
        once: true,
      },
    );
  } else {
    initIcoAdvisorySections();
  }

  document.addEventListener('astro:page-load', () => initIcoAdvisorySections());
}
