import type { PressCoverageItem, SpeakingEventItem } from './types';

export function toTrimmedString(value: unknown): string;
export function buildCoverageKey(
  date: string,
  title: string,
  url: string,
): string;
export function getCoverageDateSortValue(value: string): number;
export function sortCoverageItems<T extends { date: string; key: string }>(
  items: T[],
): void;
export function normalizePressCoverage(value: unknown): PressCoverageItem[];
export function normalizeSpeakingEvents(value: unknown): SpeakingEventItem[];
