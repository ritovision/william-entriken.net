import {
  MOCK_FAILURE_TRIGGER_TEXT,
  submitFormPayload,
} from '@shared/forms/submit';
import type { ContactFormPayload, ServicesFormPayload } from '@shared/forms/types';

const baseContactPayload: ContactFormPayload = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  organization: 'Acme Inc',
  purpose: 'Test',
  message: 'This is a valid test message.',
};

const baseServicesPayload: ServicesFormPayload = {
  formType: 'services',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '555-123-4567',
  companyName: 'Acme Inc',
  position: 'Founder',
  projectWebsite: 'https://example.com',
  industry: 'Technology',
  duration: '1 Month',
  assistanceTime: 'ASAP',
  orgSize: '1–10',
  details: 'This is a valid service message.',
};

describe('submitFormPayload', () => {
  it('returns mock success without calling fetch when trigger phrase is not used', async () => {
    const fetcherMock = vi.fn();
    const fetcher = fetcherMock as unknown as typeof fetch;

    const result = await submitFormPayload('contact', baseContactPayload, {
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
        PUBLIC_FORMS_MOCK: 'true',
      },
      fetcher,
    });

    expect(result.success).toBe(true);
    expect(result.mocked).toBe(true);
    expect(fetcherMock).not.toHaveBeenCalled();
  });

  it('returns mock failure when textarea matches trigger phrase exactly', async () => {
    const fetcherMock = vi.fn();
    const fetcher = fetcherMock as unknown as typeof fetch;

    const contactFailure = await submitFormPayload(
      'contact',
      {
        ...baseContactPayload,
        message: ` ${MOCK_FAILURE_TRIGGER_TEXT} `,
      },
      {
        env: {
          PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
          PUBLIC_FORMS_MOCK: 'true',
        },
        fetcher,
      },
    );

    const servicesFailure = await submitFormPayload(
      'services',
      {
        ...baseServicesPayload,
        details: MOCK_FAILURE_TRIGGER_TEXT,
      },
      {
        env: {
          PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
          PUBLIC_FORMS_MOCK: 'true',
        },
        fetcher,
      },
    );

    expect(contactFailure.success).toBe(false);
    expect(contactFailure.mocked).toBe(true);
    expect(servicesFailure.success).toBe(false);
    expect(servicesFailure.mocked).toBe(true);
    expect(fetcherMock).not.toHaveBeenCalled();
  });

  it('returns success for live responses with ok=true and success=true', async () => {
    const fetcherMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ success: true }),
      } as unknown as Response;
    });
    const fetcher = fetcherMock as unknown as typeof fetch;

    const result = await submitFormPayload('contact', baseContactPayload, {
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
      },
      fetcher,
    });

    expect(result.success).toBe(true);
    expect(result.mocked).toBe(false);
  });

  it('returns failure for non-success payloads, malformed JSON, and fetch errors', async () => {
    const nonSuccessFetcherMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ success: false }),
      } as unknown as Response;
    });
    const nonSuccessFetcher = nonSuccessFetcherMock as unknown as typeof fetch;

    const malformedFetcherMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => {
          throw new Error('invalid json');
        },
      } as unknown as Response;
    });
    const malformedFetcher = malformedFetcherMock as unknown as typeof fetch;

    const throwingFetcherMock = vi.fn(async () => {
      throw new Error('network down');
    });
    const throwingFetcher = throwingFetcherMock as unknown as typeof fetch;

    const nonSuccess = await submitFormPayload('contact', baseContactPayload, {
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
      },
      fetcher: nonSuccessFetcher,
    });

    const malformed = await submitFormPayload('contact', baseContactPayload, {
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
      },
      fetcher: malformedFetcher,
    });

    const thrown = await submitFormPayload('contact', baseContactPayload, {
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
      },
      fetcher: throwingFetcher,
    });

    expect(nonSuccess.success).toBe(false);
    expect(malformed.success).toBe(false);
    expect(thrown.success).toBe(false);
  });
});
