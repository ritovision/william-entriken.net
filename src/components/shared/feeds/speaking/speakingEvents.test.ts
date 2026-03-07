import { normalizeSpeakingEvents } from './speakingEvents';

describe('speakingEvents', () => {
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
  });
});
