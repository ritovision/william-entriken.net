const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeKeyPart = (value) => value.toLowerCase().trim();

const buildCoverageKey = (date, title, url) =>
  [date, title, url || 'no-url'].map(normalizeKeyPart).join('__');

const getCoverageDateSortValue = (value) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = /^\d{4}$/.test(trimmed) ? `${trimmed}-01-01` : trimmed;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortCoverageItems = (items) => {
  items.sort((a, b) => {
    const dateDelta =
      getCoverageDateSortValue(b.date) - getCoverageDateSortValue(a.date);
    if (dateDelta !== 0) {
      return dateDelta;
    }

    return a.key.localeCompare(b.key);
  });
};

const normalizePressAuthors = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const normalizePressCoverage = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const date = toTrimmedString(entry.date);
    const title = toTrimmedString(entry.title);
    if (!date || !title) {
      continue;
    }

    const url = toTrimmedString(entry.url);
    normalized.push({
      key: buildCoverageKey(date, title, url),
      date,
      title,
      url,
      authors: normalizePressAuthors(entry.authors),
      publication: toTrimmedString(entry.publication) || 'Unknown publication',
    });
  }

  sortCoverageItems(normalized);
  return normalized;
};

const normalizeSpeakingEvents = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }

    const date = toTrimmedString(entry.date);
    const title = toTrimmedString(entry.title);
    if (!date || !title) {
      continue;
    }

    const url = toTrimmedString(entry.url);
    normalized.push({
      key: buildCoverageKey(date, title, url),
      date,
      title,
      url,
    });
  }

  sortCoverageItems(normalized);
  return normalized;
};

export {
  buildCoverageKey,
  getCoverageDateSortValue,
  normalizePressCoverage,
  normalizeSpeakingEvents,
  sortCoverageItems,
  toTrimmedString,
};
