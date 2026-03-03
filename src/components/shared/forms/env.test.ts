import { parseMockFlag, readFormsEnv } from '@shared/forms/env';

describe('forms env', () => {
  it('parses mock flags consistently', () => {
    expect(parseMockFlag('true')).toBe(true);
    expect(parseMockFlag(' TRUE ')).toBe(true);
    expect(parseMockFlag('1')).toBe(true);
    expect(parseMockFlag('yes')).toBe(true);
    expect(parseMockFlag('on')).toBe(true);

    expect(parseMockFlag('false')).toBe(false);
    expect(parseMockFlag('0')).toBe(false);
    expect(parseMockFlag(undefined)).toBe(false);
    expect(parseMockFlag('')).toBe(false);
  });

  it('requires PUBLIC_FORMS_ENDPOINT and trims values', () => {
    expect(() => readFormsEnv({ PUBLIC_FORMS_ENDPOINT: '   ' })).toThrow(
      'Missing PUBLIC_FORMS_ENDPOINT environment variable.',
    );

    const config = readFormsEnv({
      PUBLIC_FORMS_ENDPOINT: ' https://cloudflare.example.com ',
      PUBLIC_FORMS_MOCK: ' true ',
    });

    expect(config.endpoint).toBe('https://cloudflare.example.com');
    expect(config.mock).toBe(true);
  });
});
