import {
  isCoverageUrlLinkable,
  normalizeCoverageByKind,
  type CoverageFeedItem,
  type CoverageFeedKind,
  type PressCoverageItem,
  type SpeakingEventItem,
} from '@shared/coverageData';

export const COVERAGE_FETCH_DELAY_MS = 2000;
export const COVERAGE_VISIBLE_FADE_MS = 1000;
export const COVERAGE_STATUS_FADE_MS = 1000;

interface CoverageFeedElements {
  root: HTMLElement;
  viewport: HTMLElement;
  cards: HTMLElement;
  overlay: HTMLElement;
  expandButton: HTMLButtonElement;
  status: HTMLElement;
}

interface CoverageFeedState {
  kind: CoverageFeedKind;
  remoteUrl: string;
  knownKeys: string[];
  expanded: boolean;
}

interface HydrateOptions {
  fetchDelayMs?: number;
  fetcher?: typeof fetch;
  waitMs?: (ms: number) => Promise<void>;
  autoRemoteCheck?: boolean;
}

interface CoverageFeedController {
  refreshFromRemote: () => Promise<boolean>;
  syncOverlayState: () => void;
  expandList: () => void;
}

const defaultWait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const warnCoverageFetchFailure = (message: string): void => {
  // eslint-disable-next-line no-console -- intentional diagnostics for remote data failures.
  console.warn(message);
};

const buildLink = (
  doc: Document,
  url: string,
  title: string,
): HTMLAnchorElement => {
  const link = doc.createElement('a');
  link.href = url;
  link.className = 'coverage-card__link';
  link.setAttribute('aria-label', `Open entry: ${title}`);
  return link;
};

const appendCardFrame = (
  contentRoot: HTMLElement,
  kind: CoverageFeedKind,
  item: CoverageFeedItem,
): void => {
  const date = document.createElement('p');
  date.className = 'coverage-card__date m-0';
  date.textContent = item.date;
  contentRoot.appendChild(date);

  if (kind === 'press') {
    const pressItem = item as PressCoverageItem;
    const authors = document.createElement('p');
    authors.className = 'coverage-card__meta m-0';
    authors.textContent =
      pressItem.authors.length > 0
        ? pressItem.authors.join(', ')
        : 'Unknown author';
    contentRoot.appendChild(authors);

    const publication = document.createElement('p');
    publication.className = 'coverage-card__meta m-0';
    publication.textContent = pressItem.publication;
    contentRoot.appendChild(publication);

    const title = document.createElement('h3');
    title.className = 'coverage-card__title m-0';
    title.textContent = pressItem.title;
    contentRoot.appendChild(title);
  } else {
    const speakingItem = item as SpeakingEventItem;
    const title = document.createElement('h3');
    title.className = 'coverage-card__title coverage-card__title--center m-0';
    title.textContent = speakingItem.title;
    contentRoot.appendChild(title);
  }
};

const buildCardElement = (
  item: CoverageFeedItem,
  kind: CoverageFeedKind,
): HTMLElement => {
  const card = document.createElement('article');
  card.className = 'coverage-card border-gold';
  card.dataset.coverageCard = '';
  card.dataset.coverageKey = item.key;

  const contentRoot =
    isCoverageUrlLinkable(item.url) && item.url
      ? buildLink(document, item.url, item.title)
      : document.createElement('div');

  if (!(contentRoot instanceof HTMLAnchorElement)) {
    contentRoot.className = 'coverage-card__content';
  }

  appendCardFrame(contentRoot, kind, item);
  card.appendChild(contentRoot);

  if (kind === 'press') {
    card.classList.add('coverage-card--press');
  } else {
    card.classList.add('coverage-card--speaking');
  }

  return card;
};

export const renderCoverageCards = (
  cardsRoot: HTMLElement,
  kind: CoverageFeedKind,
  items: CoverageFeedItem[],
): void => {
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.appendChild(buildCardElement(item, kind));
  }
  cardsRoot.replaceChildren(fragment);
};

const readFeedElements = (root: HTMLElement): CoverageFeedElements | null => {
  const viewport = root.querySelector<HTMLElement>('[data-coverage-viewport]');
  const cards = root.querySelector<HTMLElement>('[data-coverage-cards]');
  const overlay = root.querySelector<HTMLElement>('[data-coverage-overlay]');
  const expandButton =
    root.querySelector<HTMLButtonElement>('[data-coverage-expand]');
  const status = root.querySelector<HTMLElement>('[data-coverage-status]');

  if (!viewport || !cards || !overlay || !expandButton || !status) {
    return null;
  }

  return {
    root,
    viewport,
    cards,
    overlay,
    expandButton,
    status,
  };
};

const readFeedState = (root: HTMLElement): CoverageFeedState | null => {
  const kindValue = root.getAttribute('data-coverage-kind');
  if (kindValue !== 'press' && kindValue !== 'speaking') {
    return null;
  }

  const remoteUrl = root.getAttribute('data-coverage-remote-url')?.trim() || '';
  const rawKeys = root.getAttribute('data-coverage-keys') || '[]';

  let parsedKeys: unknown = [];
  try {
    parsedKeys = JSON.parse(rawKeys) as unknown;
  } catch {
    parsedKeys = [];
  }

  const knownKeys = Array.isArray(parsedKeys)
    ? parsedKeys
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

  return {
    kind: kindValue,
    remoteUrl,
    knownKeys,
    expanded: root.classList.contains('is-expanded'),
  };
};

const setUpdatingState = (status: HTMLElement, isVisible: boolean): void => {
  if (isVisible) {
    status.hidden = false;
    status.classList.add('is-visible');
    return;
  }

  status.classList.remove('is-visible');
};

export const shouldUseVisibleUpdate = (
  expanded: boolean,
  scrollTop: number,
): boolean => {
  if (!expanded) {
    return true;
  }

  return scrollTop <= 8;
};

const applyUpdatedItems = (
  elements: CoverageFeedElements,
  state: CoverageFeedState,
  nextItems: CoverageFeedItem[],
): void => {
  renderCoverageCards(elements.cards, state.kind, nextItems);
  state.knownKeys = nextItems.map((item) => item.key);
  elements.root.setAttribute('data-coverage-keys', JSON.stringify(state.knownKeys));
};

const syncOverlayState = (
  elements: CoverageFeedElements,
  state: CoverageFeedState,
): void => {
  if (state.expanded) {
    elements.overlay.hidden = true;
    elements.expandButton.hidden = true;
    elements.expandButton.setAttribute('aria-expanded', 'true');
    return;
  }

  const hasOverflow = elements.cards.scrollHeight > elements.viewport.clientHeight + 1;
  elements.overlay.hidden = !hasOverflow;
  elements.expandButton.hidden = !hasOverflow;
  elements.expandButton.setAttribute('aria-expanded', 'false');
};

const expandList = (
  elements: CoverageFeedElements,
  state: CoverageFeedState,
): void => {
  if (state.expanded) {
    return;
  }

  state.expanded = true;
  elements.root.classList.add('is-expanded');
  syncOverlayState(elements, state);
};

const fetchRemoteItems = async (
  kind: CoverageFeedKind,
  remoteUrl: string,
  fetcher: typeof fetch,
): Promise<CoverageFeedItem[]> => {
  if (!remoteUrl) {
    return [];
  }

  try {
    const response = await fetcher(remoteUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      warnCoverageFetchFailure(
        `[coverage-feed] Failed to fetch ${kind} updates: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const payload = (await response.json()) as unknown;
    return normalizeCoverageByKind(kind, payload);
  } catch (error) {
    warnCoverageFetchFailure(
      `[coverage-feed] Failed to fetch ${kind} updates: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
};

export const hydrateCoverageFeed = (
  root: HTMLElement,
  options: HydrateOptions = {},
): CoverageFeedController | null => {
  if (root.getAttribute('data-coverage-hydrated') === 'true') {
    return null;
  }

  const elements = readFeedElements(root);
  const state = readFeedState(root);
  if (!elements || !state) {
    return null;
  }

  root.setAttribute('data-coverage-hydrated', 'true');

  const waitMs = options.waitMs ?? defaultWait;
  const fetcher = options.fetcher ?? fetch;

  syncOverlayState(elements, state);

  const refreshFromRemote = async (): Promise<boolean> => {
    const remoteItems = await fetchRemoteItems(state.kind, state.remoteUrl, fetcher);
    if (remoteItems.length === 0) {
      return false;
    }

    const nextItems = remoteItems as CoverageFeedItem[];
    const knownKeys = new Set(state.knownKeys);
    const newItems = nextItems.filter((item) => !knownKeys.has(item.key));

    if (newItems.length === 0) {
      return false;
    }

    // TODO: Trigger a server-side webhook/dispatch here when new items are detected.
    const useVisibleUpdate = shouldUseVisibleUpdate(
      state.expanded,
      elements.viewport.scrollTop,
    );

    const previousHeight = elements.cards.scrollHeight;

    if (useVisibleUpdate) {
      setUpdatingState(elements.status, true);
      elements.cards.classList.add('is-fading-out');
      await waitMs(COVERAGE_VISIBLE_FADE_MS);

      applyUpdatedItems(elements, state, nextItems);
      syncOverlayState(elements, state);

      elements.cards.classList.remove('is-fading-out');
      await waitMs(COVERAGE_VISIBLE_FADE_MS);

      setUpdatingState(elements.status, false);
      await waitMs(COVERAGE_STATUS_FADE_MS);
      elements.status.hidden = true;
    } else {
      applyUpdatedItems(elements, state, nextItems);
      syncOverlayState(elements, state);

      const nextHeight = elements.cards.scrollHeight;
      const heightDelta = Math.max(0, nextHeight - previousHeight);
      if (heightDelta > 0) {
        elements.viewport.scrollTop += heightDelta;
      }
    }

    return true;
  };

  const onExpandClick = () => {
    expandList(elements, state);
  };

  const onResize = () => {
    syncOverlayState(elements, state);
  };

  elements.expandButton.addEventListener('click', onExpandClick);
  window.addEventListener('resize', onResize);

  if (options.autoRemoteCheck !== false) {
    const delay = options.fetchDelayMs ?? COVERAGE_FETCH_DELAY_MS;
    window.setTimeout(() => {
      void refreshFromRemote();
    }, delay);
  }

  return {
    refreshFromRemote,
    syncOverlayState: () => syncOverlayState(elements, state),
    expandList: () => expandList(elements, state),
  };
};

export const initCoverageFeeds = (): void => {
  const roots = document.querySelectorAll<HTMLElement>('[data-coverage-feed]');
  for (const root of roots) {
    hydrateCoverageFeed(root);
  }
};
