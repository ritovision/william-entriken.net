import {
  getCoverageDateSortValue,
  getNewCoverageItems,
  isCoverageUrlLinkable,
  normalizePressCoverage,
  normalizeSpeakingEvents,
} from './coverageData';

describe('coverageData helpers', () => {
  it('normalizes and sorts press entries with mixed author shapes', () => {
    const items = normalizePressCoverage([
      {
        date: '2024-01-03',
        title: 'Older item',
        url: 'https://example.com/older',
        authors: 'Solo Author',
        publication: 'Example Daily',
      },
      {
        date: '2025-02-04',
        title: 'Newest item',
        url: 'https://example.com/newest',
        authors: ['A Author', 'B Author'],
        publication: 'Example Weekly',
      },
      {
        date: '',
        title: 'invalid',
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe('Newest item');
    expect(items[0]?.authors).toEqual(['A Author', 'B Author']);
    expect(items[1]?.authors).toEqual(['Solo Author']);
  });

  it('normalizes and sorts speaking entries including year-only dates', () => {
    const items = normalizeSpeakingEvents([
      {
        date: '2019',
        title: 'Legacy Event',
        url: 'https://example.com/legacy',
      },
      {
        date: '2024-06-10',
        title: 'Recent Event',
        url: 'https://example.com/recent',
      },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe('Recent Event');
    expect(items[1]?.title).toBe('Legacy Event');
    expect(getCoverageDateSortValue('2019')).toBeGreaterThan(0);
  });

  it('flags linkable urls and rejects placeholder urls', () => {
    expect(isCoverageUrlLinkable('https://example.com')).toBe(true);
    expect(isCoverageUrlLinkable('/internal-path')).toBe(true);
    expect(isCoverageUrlLinkable('mailto:test@example.com')).toBe(true);

    expect(isCoverageUrlLinkable('todo')).toBe(false);
    expect(isCoverageUrlLinkable('private')).toBe(false);
    expect(isCoverageUrlLinkable('n/a')).toBe(false);
    expect(isCoverageUrlLinkable('')).toBe(false);
  });

  it('detects only newly-added entries from a remote dataset', () => {
    const local = normalizeSpeakingEvents([
      {
        date: '2024-01-10',
        title: 'Alpha',
        url: 'https://example.com/a',
      },
    ]);

    const remote = normalizeSpeakingEvents([
      {
        date: '2025-01-10',
        title: 'Beta',
        url: 'https://example.com/b',
      },
      {
        date: '2024-01-10',
        title: 'Alpha',
        url: 'https://example.com/a',
      },
    ]);

    const newItems = getNewCoverageItems(local, remote);
    expect(newItems).toHaveLength(1);
    expect(newItems[0]?.title).toBe('Beta');
  });
});
