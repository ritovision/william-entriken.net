import { getCoverageDateSortValue } from './canonicalize.mjs';
import type { CoverageFeedItem, PressCoverageItem } from './types';

const PLACEHOLDER_URLS = new Set(['', 'todo', 'private', 'n/a']);

export const toTrimmedString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';
export { getCoverageDateSortValue };

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

const toCanonicalCoverageItem = (item: CoverageFeedItem) => {
  const base = {
    key: item.key,
    date: item.date,
    title: item.title,
    url: item.url,
  };

  if ('authors' in item) {
    const pressItem = item as PressCoverageItem;
    return {
      ...base,
      authors: pressItem.authors,
      publication: pressItem.publication,
    };
  }

  return base;
};

export const stringifyCoverageItems = (items: CoverageFeedItem[]): string =>
  JSON.stringify(items.map((item) => toCanonicalCoverageItem(item)));

export const areCoverageItemsEqual = (
  left: CoverageFeedItem[],
  right: CoverageFeedItem[],
): boolean => stringifyCoverageItems(left) === stringifyCoverageItems(right);
