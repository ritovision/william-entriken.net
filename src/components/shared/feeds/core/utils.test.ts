import {
  getCoverageDateSortValue,
  areCoverageItemsEqual,
  isCoverageUrlLinkable,
} from './utils';
import { normalizePressCoverage } from '../press/pressCoverage';

describe('feed core utils', () => {
  it('flags linkable urls and rejects placeholder urls', () => {
    expect(isCoverageUrlLinkable('https://example.com')).toBe(true);
    expect(isCoverageUrlLinkable('/internal-path')).toBe(true);
    expect(isCoverageUrlLinkable('mailto:test@example.com')).toBe(true);

    expect(isCoverageUrlLinkable('todo')).toBe(false);
    expect(isCoverageUrlLinkable('private')).toBe(false);
    expect(isCoverageUrlLinkable('n/a')).toBe(false);
    expect(isCoverageUrlLinkable('')).toBe(false);
  });

  it('treats semantically equivalent arrays as equal despite property order', () => {
    const local = normalizePressCoverage([
      {
        date: '2024-01-10',
        title: 'Alpha',
        url: 'https://example.com/a',
        authors: ['Author'],
        publication: 'Publication',
      },
    ]);

    const remote = JSON.parse(
      '[{"publication":"Publication","authors":["Author"],"url":"https://example.com/a","title":"Alpha","date":"2024-01-10","key":"2024-01-10__alpha__https://example.com/a"}]',
    ) as typeof local;

    expect(areCoverageItemsEqual(local, remote)).toBe(true);
  });

  it('parses year-only dates for sorting', () => {
    expect(getCoverageDateSortValue('2019')).toBeGreaterThan(0);
  });
});
