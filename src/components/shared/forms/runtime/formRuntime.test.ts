// @vitest-environment jsdom

import { initFormRuntime } from '@shared/forms/runtime/formRuntime';
import {
  MOCK_FAILURE_TRIGGER_TEXT,
  submitFormPayload,
} from '@shared/forms/submit';

const renderContactFixture = (messageValue = 'This is a valid message body.') => {
  document.body.innerHTML = `
    <section class="forms-panel">
      <form data-form-kind="contact">
        <input name="name" />
        <input name="email" />
        <input name="organization" />
        <input name="purpose" />
        <textarea name="message"></textarea>
        <button id="contact-submit" type="submit">Send</button>
      </form>

      <section
        data-form-result-modal
        role="dialog"
        aria-modal="true"
        aria-hidden="true"
        hidden
      >
        <button
          type="button"
          data-form-result-overlay
          tabindex="-1"
          aria-label="Close"
        ></button>
        <div>
          <div>
            <h3 data-form-result-title></h3>
          </div>
          <div data-form-result-body>
            <p data-form-result-text></p>
            <ul data-form-result-list hidden></ul>
          </div>
          <div>
            <button type="button" data-form-result-close>Okay</button>
          </div>
        </div>
      </section>
    </section>
  `;

  const form = document.querySelector<HTMLFormElement>('form[data-form-kind="contact"]');
  const modal = document.querySelector<HTMLElement>('[data-form-result-modal]');
  const title = document.querySelector<HTMLElement>('[data-form-result-title]');
  const text = document.querySelector<HTMLElement>('[data-form-result-text]');
  const list = document.querySelector<HTMLElement>('[data-form-result-list]');
  const overlay = document.querySelector<HTMLButtonElement>('[data-form-result-overlay]');
  const closeButton = document.querySelector<HTMLButtonElement>('[data-form-result-close]');
  const submitButton = document.querySelector<HTMLButtonElement>('#contact-submit');

  const name = document.querySelector<HTMLInputElement>('input[name="name"]');
  const email = document.querySelector<HTMLInputElement>('input[name="email"]');
  const organization = document.querySelector<HTMLInputElement>('input[name="organization"]');
  const purpose = document.querySelector<HTMLInputElement>('input[name="purpose"]');
  const message = document.querySelector<HTMLTextAreaElement>('textarea[name="message"]');

  if (
    !form ||
    !modal ||
    !title ||
    !text ||
    !list ||
    !overlay ||
    !closeButton ||
    !submitButton ||
    !name ||
    !email ||
    !organization ||
    !purpose ||
    !message
  ) {
    throw new Error('Failed to build contact fixture.');
  }

  name.value = 'Jane Doe';
  email.value = 'jane@example.com';
  organization.value = 'Acme Inc';
  purpose.value = 'Consulting';
  message.value = messageValue;

  return {
    form,
    modal,
    title,
    text,
    list,
    overlay,
    closeButton,
    submitButton,
    name,
    email,
    message,
    purpose,
  };
};

describe('formRuntime modal behavior', () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows a validation modal with multiple readable issues and keeps submitter untouched', async () => {
    const { form, title, list, email, message } = renderContactFixture('short');
    email.value = 'not-an-email';

    const submitter = vi
      .fn(async () => ({ kind: 'contact' as const, success: true, mocked: false }))
      .mockName('submitter') as unknown as typeof submitFormPayload;

    initFormRuntime({ submitter });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(title).toHaveTextContent('Please fix the following');
      expect(list).not.toHaveAttribute('hidden');
    });

    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(list).toHaveTextContent('Email: Invalid email address.');
    expect(list).toHaveTextContent('Message: Message must be at least 10 characters.');
    expect(email).toHaveClass('site-form__field-invalid');
    expect(message).toHaveClass('site-form__field-invalid');
    expect(submitter).not.toHaveBeenCalled();
  });

  it('shows success modal and resets form in mock mode', async () => {
    const { form, modal, title, text, list, name } = renderContactFixture();
    const fetcherMock = vi.fn();

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
        PUBLIC_FORMS_MOCK: 'true',
      },
      fetcher: fetcherMock as unknown as typeof fetch,
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(modal).toHaveClass('is-open');
      expect(title).toHaveTextContent('Success. Message sent');
      expect(title.innerHTML).toContain('<svg');
      expect(text).toHaveTextContent('We will get back to you as soon as we can.');
    });

    expect(list).toHaveAttribute('hidden');
    expect(fetcherMock).not.toHaveBeenCalled();
    expect(name.value).toBe('');
  });

  it('shows failure modal in mock mode when trigger text is used', async () => {
    const { form, title, text, name } = renderContactFixture(MOCK_FAILURE_TRIGGER_TEXT);
    const fetcherMock = vi.fn();

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
        PUBLIC_FORMS_MOCK: 'true',
      },
      fetcher: fetcherMock as unknown as typeof fetch,
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(title).toHaveTextContent('Message not sent');
      expect(text).toHaveTextContent('Message not sent. Try again later.');
    });

    expect(fetcherMock).not.toHaveBeenCalled();
    expect(name.value).toBe('Jane Doe');
  });

  it('calls live endpoint and shows success modal on successful response', async () => {
    const { form, title, text } = renderContactFixture();
    const fetcherMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as unknown as Response;
      },
    );

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
      },
      fetcher: fetcherMock as unknown as typeof fetch,
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(title).toHaveTextContent('Success. Message sent');
      expect(title.innerHTML).toContain('<svg');
      expect(text).toHaveTextContent('We will get back to you as soon as we can.');
    });

    expect(fetcherMock).toHaveBeenCalledTimes(1);
    const firstCall = fetcherMock.mock.calls[0];
    expect(firstCall?.[0]).toBe('https://cloudflare.example.com');
    expect(firstCall?.[1]?.method).toBe('POST');
  });

  it('shows failure modal on unsuccessful live responses', async () => {
    const { form, title, text } = renderContactFixture();
    const fetcherMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
        return {
          ok: true,
          json: async () => ({ success: false }),
        } as unknown as Response;
      },
    );

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
      },
      fetcher: fetcherMock as unknown as typeof fetch,
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(title).toHaveTextContent('Message not sent');
      expect(title.innerHTML).toContain('<svg');
      expect(text).toHaveTextContent('Message not sent. Try again later.');
    });
  });

  it('closes modal via overlay and restores focus to submit button', async () => {
    const { form, modal, overlay, submitButton } = renderContactFixture();

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
        PUBLIC_FORMS_MOCK: 'true',
      },
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(modal).toHaveClass('is-open');
    });

    overlay.click();

    expect(modal).not.toHaveClass('is-open');
    expect(modal).toHaveAttribute('hidden');
    expect(document.activeElement).toBe(submitButton);
  });

  it('closes modal via Okay button', async () => {
    const { form, modal, closeButton } = renderContactFixture();

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
        PUBLIC_FORMS_MOCK: 'true',
      },
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(modal).toHaveClass('is-open');
    });

    closeButton.click();

    expect(modal).not.toHaveClass('is-open');
    expect(modal).toHaveAttribute('hidden');
  });

  it('closes modal on Escape and traps focus with Tab/Shift+Tab', async () => {
    const { form, modal, closeButton } = renderContactFixture();

    initFormRuntime({
      env: {
        PUBLIC_FORMS_ENDPOINT: 'https://cloudflare.example.com',
        PUBLIC_FORMS_MOCK: 'true',
      },
    });

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => {
      expect(modal).toHaveClass('is-open');
      expect(document.activeElement).toBe(closeButton);
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(closeButton);

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(closeButton);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(modal).not.toHaveClass('is-open');
  });
});
