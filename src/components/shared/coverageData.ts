export const PRESS_COVERAGE_REMOTE_URL =
  'https://raw.githubusercontent.com/fulldecent/phor.net/main/source/_data/press-coverage.json';

export const SPEAKING_EVENTS_REMOTE_URL =
  'https://raw.githubusercontent.com/fulldecent/phor.net/main/source/_data/speaking-events.json';

export type CoverageFeedKind = 'press' | 'speaking';

export interface PressCoverageItem {
  key: string;
  date: string;
  title: string;
  url: string;
  authors: string[];
  publication: string;
}

export interface SpeakingEventItem {
  key: string;
  date: string;
  title: string;
  url: string;
}

export type CoverageFeedItem = PressCoverageItem | SpeakingEventItem;

const PLACEHOLDER_URLS = new Set(['', 'todo', 'private', 'n/a']);

const toTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeKeyPart = (value: string): string => value.toLowerCase().trim();

const buildCoverageKey = (date: string, title: string, url: string): string =>
  [date, title, url || 'no-url'].map(normalizeKeyPart).join('__');

export const getCoverageDateSortValue = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = /^\d{4}$/.test(trimmed) ? `${trimmed}-01-01` : trimmed;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortCoverageItems = <T extends { date: string; key: string }>(
  items: T[],
): void => {
  items.sort((a, b) => {
    const dateDelta = getCoverageDateSortValue(b.date) - getCoverageDateSortValue(a.date);
    if (dateDelta !== 0) {
      return dateDelta;
    }

    return a.key.localeCompare(b.key);
  });
};

export const isCoverageUrlLinkable = (value: unknown): value is string => {
  const trimmed = toTrimmedString(value);
  if (!trimmed) {
    return false;
  }

  if (PLACEHOLDER_URLS.has(trimmed.toLowerCase())) {
    return false;
  }

  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:')
  );
};

const normalizeAuthors = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

export const normalizePressCoverage = (value: unknown): PressCoverageItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: PressCoverageItem[] = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const date = toTrimmedString((entry as { date?: unknown }).date);
    const title = toTrimmedString((entry as { title?: unknown }).title);
    if (!date || !title) {
      continue;
    }

    const url = toTrimmedString((entry as { url?: unknown }).url);
    const authors = normalizeAuthors((entry as { authors?: unknown }).authors);
    const publication =
      toTrimmedString((entry as { publication?: unknown }).publication) ||
      'Unknown publication';

    const key = buildCoverageKey(date, title, url);

    normalized.push({
      key,
      date,
      title,
      url,
      authors,
      publication,
    });
  }

  sortCoverageItems(normalized);

  return normalized;
};

export const normalizeSpeakingEvents = (value: unknown): SpeakingEventItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: SpeakingEventItem[] = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const date = toTrimmedString((entry as { date?: unknown }).date);
    const title = toTrimmedString((entry as { title?: unknown }).title);
    if (!date || !title) {
      continue;
    }

    const url = toTrimmedString((entry as { url?: unknown }).url);
    const key = buildCoverageKey(date, title, url);

    normalized.push({
      key,
      date,
      title,
      url,
    });
  }

  sortCoverageItems(normalized);

  return normalized;
};

export const normalizeCoverageByKind = (
  kind: CoverageFeedKind,
  value: unknown,
): CoverageFeedItem[] =>
  kind === 'press' ? normalizePressCoverage(value) : normalizeSpeakingEvents(value);

export const getNewCoverageItems = <T extends CoverageFeedItem>(
  localItems: T[],
  remoteItems: T[],
): T[] => {
  const knownKeys = new Set(localItems.map((item) => item.key));
  return remoteItems.filter((item) => !knownKeys.has(item.key));
};
