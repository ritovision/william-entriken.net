// @vitest-environment jsdom

import {
  COVERAGE_STATUS_FADE_MS,
  COVERAGE_VISIBLE_FADE_MS,
  hydrateCoverageFeed,
  renderCoverageCards,
} from './coverageFeedRuntime';
import {
  normalizePressCoverage,
  normalizeSpeakingEvents,
} from '@shared/coverageData';

const buildFeedFixture = (
  kind: 'press' | 'speaking',
  items: ReturnType<typeof normalizePressCoverage> | ReturnType<typeof normalizeSpeakingEvents>,
) => {
  document.body.innerHTML = `
    <section
      data-coverage-feed
      data-coverage-kind="${kind}"
      data-coverage-remote-url="https://example.com/remote.json"
      data-coverage-keys='${JSON.stringify(items.map((item) => item.key))}'
    >
      <p data-coverage-status hidden>Updating...</p>
      <div data-coverage-viewport>
        <div data-coverage-cards></div>
        <div data-coverage-overlay>
          <button type="button" data-coverage-expand aria-expanded="false">See full list</button>
        </div>
      </div>
    </section>
  `;

  const root = document.querySelector<HTMLElement>('[data-coverage-feed]');
  const cards = document.querySelector<HTMLElement>('[data-coverage-cards]');
  const viewport = document.querySelector<HTMLElement>('[data-coverage-viewport]');

  if (!root || !cards || !viewport) {
    throw new Error('Failed to build fixture.');
  }

  renderCoverageCards(cards, kind, items);

  Object.defineProperty(cards, 'scrollHeight', {
    configurable: true,
    get: () => cards.childElementCount * 120,
  });

  Object.defineProperty(viewport, 'clientHeight', {
    configurable: true,
    value: 300,
  });

  return { root, cards, viewport };
};

const createFetcher = (payload: unknown): typeof fetch =>
  (vi.fn(async () => {
    return {
      ok: true,
      json: async () => payload,
    } as Response;
  }) as unknown as typeof fetch);

const createFailedFetcher = (
  status: number,
  statusText: string,
): typeof fetch =>
  (vi.fn(async () => {
    return {
      ok: false,
      status,
      statusText,
    } as Response;
  }) as unknown as typeof fetch);

describe('coverageFeedRuntime', () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows Updating... only for visible updates and fades it out when finished', async () => {
    vi.useFakeTimers();

    const localItems = normalizePressCoverage([
      {
        date: '2024-01-10',
        title: 'Local Item',
        url: 'https://example.com/local',
        authors: ['Author'],
        publication: 'Publication',
      },
    ]);

    const remotePayload = [
      {
        date: '2025-01-10',
        title: 'New Remote Item',
        url: 'https://example.com/new',
        authors: ['Reporter'],
        publication: 'News Desk',
      },
      {
        date: '2024-01-10',
        title: 'Local Item',
        url: 'https://example.com/local',
        authors: ['Author'],
        publication: 'Publication',
      },
    ];

    const { root } = buildFeedFixture('press', localItems);
    const fetcher = createFetcher(remotePayload);

    const controller = hydrateCoverageFeed(root, {
      autoRemoteCheck: false,
      fetcher,
    });

    expect(controller).not.toBeNull();

    const status = root.querySelector<HTMLElement>('[data-coverage-status]');
    expect(status).not.toBeNull();

    const refreshPromise = controller?.refreshFromRemote();
    await vi.advanceTimersByTimeAsync(0);

    expect(status?.hidden).toBe(false);
    expect(status).toHaveClass('is-visible');

    await vi.advanceTimersByTimeAsync(COVERAGE_VISIBLE_FADE_MS);
    await vi.advanceTimersByTimeAsync(COVERAGE_VISIBLE_FADE_MS);

    expect(status).not.toHaveClass('is-visible');
    expect(status?.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(COVERAGE_STATUS_FADE_MS);
    await refreshPromise;

    expect(status?.hidden).toBe(true);

    const firstCard = root.querySelector<HTMLElement>('[data-coverage-card] .coverage-card__title');
    expect(firstCard).toHaveTextContent('New Remote Item');
  });

  it('updates silently when changes do not affect visible cards', async () => {
    const localItems = normalizeSpeakingEvents([
      {
        date: '2024-01-10',
        title: 'Local Event',
        url: 'https://example.com/local',
      },
    ]);

    const remotePayload = [
      {
        date: '2025-03-10',
        title: 'New Event',
        url: 'https://example.com/new',
      },
      {
        date: '2024-01-10',
        title: 'Local Event',
        url: 'https://example.com/local',
      },
    ];

    const { root, viewport } = buildFeedFixture('speaking', localItems);
    root.classList.add('is-expanded');
    viewport.scrollTop = 240;

    const fetcher = createFetcher(remotePayload);

    const controller = hydrateCoverageFeed(root, {
      autoRemoteCheck: false,
      fetcher,
    });

    const status = root.querySelector<HTMLElement>('[data-coverage-status]');

    await controller?.refreshFromRemote();

    expect(status?.hidden).toBe(true);
    expect(status).not.toHaveClass('is-visible');

    const firstCard = root.querySelector<HTMLElement>('[data-coverage-card] .coverage-card__title');
    expect(firstCard).toHaveTextContent('New Event');
  });

  it('logs a warning and keeps local cards when the remote fetch fails', async () => {
    const localItems = normalizePressCoverage([
      {
        date: '2024-01-10',
        title: 'Local Item',
        url: 'https://example.com/local',
        authors: ['Author'],
        publication: 'Publication',
      },
    ]);

    const { root } = buildFeedFixture('press', localItems);
    const fetcher = createFailedFetcher(503, 'Service Unavailable');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const controller = hydrateCoverageFeed(root, {
      autoRemoteCheck: false,
      fetcher,
    });

    const didUpdate = await controller?.refreshFromRemote();
    expect(didUpdate).toBe(false);

    expect(warnSpy).toHaveBeenCalledWith(
      '[coverage-feed] Failed to fetch press updates: 503 Service Unavailable',
    );

    const firstCard = root.querySelector<HTMLElement>('[data-coverage-card] .coverage-card__title');
    expect(firstCard).toHaveTextContent('Local Item');
  });
});
