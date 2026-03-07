import { normalizePressCoverage } from './pressCoverage';

describe('pressCoverage', () => {
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
});
