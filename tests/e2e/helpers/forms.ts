import { expect, type Locator, type Page } from '@playwright/test';

const TRUTHY_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);
const MODAL_OPEN_CLASS = /\bis-open\b/;
const VALIDATION_MODAL_TITLE = 'Please fix the following';
const SUCCESS_MODAL_TITLE = 'Success. Message sent';
const SUCCESS_MODAL_TEXT = 'We will get back to you as soon as we can.';

export const LIVE_SAFE_TEST_MESSAGE = 'This is a test. No email.';
export const MOCK_FAILURE_TEST_MESSAGE = 'This message will fail.';

export type FormsMode = 'mock' | 'live';

export interface FormScenario {
  id: 'contact' | 'services' | 'speaking';
  route: '/contact' | '/services' | '/speaking';
  formSelector: string;
  invalidFieldNames: string[];
  resetFieldName: string;
  fillValidFields: (form: Locator, message: string) => Promise<void>;
}

const isTruthy = (value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return TRUTHY_FLAG_VALUES.has(normalized);
};

export const resolveFormsMode = (): FormsMode => {
  if (isTruthy(process.env.PUBLIC_FORMS_MOCK)) {
    return 'mock';
  }

  if (process.env.PLAYWRIGHT_EXTERNAL_BASE_URL === '1') {
    return 'live';
  }

  return 'mock';
};

export const getSubmissionMessageForMode = (_mode: FormsMode): string =>
  LIVE_SAFE_TEST_MESSAGE;

const getFormPanel = (form: Locator): Locator =>
  form
    .locator(
      'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " forms-panel ")]',
    )
    .first();

const submitAndExpectValidation = async (
  form: Locator,
  invalidFieldNames: string[],
): Promise<void> => {
  const panel = getFormPanel(form);
  const modal = panel.locator('[data-form-result-modal]');
  const modalTitle = panel.locator('[data-form-result-title]');
  const closeButton = panel.locator('[data-form-result-close]');

  await form.locator('button[type="submit"]').click();

  await expect(modal).toHaveClass(MODAL_OPEN_CLASS);
  await expect(modalTitle).toContainText(VALIDATION_MODAL_TITLE);

  for (const fieldName of invalidFieldNames) {
    await expect(form.locator(`[name="${fieldName}"]`)).toHaveClass(
      /site-form__field-invalid/,
    );
  }

  await closeButton.click();
  await expect(modal).toBeHidden();
};

const submitAndExpectSuccess = async (form: Locator): Promise<void> => {
  const panel = getFormPanel(form);
  const modal = panel.locator('[data-form-result-modal]');
  const modalTitle = panel.locator('[data-form-result-title]');
  const modalText = panel.locator('[data-form-result-text]');
  const closeButton = panel.locator('[data-form-result-close]');

  await form.locator('button[type="submit"]').click();

  await expect(modal).toHaveClass(MODAL_OPEN_CLASS);
  await expect(modalTitle).toContainText(SUCCESS_MODAL_TITLE);
  await expect(modalText).toContainText(SUCCESS_MODAL_TEXT);

  await closeButton.click();
  await expect(modal).toBeHidden();
};

const fillContactForm = async (
  form: Locator,
  message: string,
): Promise<void> => {
  await form.locator('input[name="name"]').fill('Jane Example');
  await form.locator('input[name="email"]').fill('jane@example.com');
  await form.locator('input[name="organization"]').fill('Acme Labs');
  await form.locator('input[name="purpose"]').fill('Consulting request');
  await form.locator('textarea[name="message"]').fill(message);
};

const fillServicesForm = async (
  form: Locator,
  message: string,
): Promise<void> => {
  await form.locator('input[name="firstName"]').fill('Jane');
  await form.locator('input[name="lastName"]').fill('Example');
  await form.locator('input[name="email"]').fill('jane@example.com');
  await form.locator('input[name="phone"]').fill('5551234567');
  await form.locator('input[name="companyName"]').fill('Acme Labs');
  await form.locator('input[name="position"]').fill('Founder');
  await form
    .locator('input[name="projectWebsite"]')
    .fill('https://example.com/project');

  await form
    .locator('select[name="industry"]')
    .selectOption({ label: 'Technology' });
  await form
    .locator('select[name="duration"]')
    .selectOption({ label: 'Long-term' });
  await form
    .locator('select[name="assistanceTime"]')
    .selectOption({ label: 'ASAP' });
  await form.locator('select[name="orgSize"]').selectOption({ label: '500+' });
  await form.locator('textarea[name="details"]').fill(message);
};

const fillSpeakingForm = async (
  form: Locator,
  message: string,
): Promise<void> => {
  await form.locator('input[name="firstName"]').fill('Jane');
  await form.locator('input[name="lastName"]').fill('Example');
  await form.locator('input[name="organizationName"]').fill('Acme Labs');
  await form.locator('input[name="position"]').fill('Founder');
  await form.locator('select[name="dateMonth"]').selectOption({ label: 'Jan' });
  await form.locator('input[name="dateDay"]').fill('15');
  await form.locator('input[name="dateYear"]').fill('2027');
  await form.locator('input[name="email"]').fill('jane@example.com');
  await form.locator('input[name="phone"]').fill('5551234567');
  await form.locator('textarea[name="details"]').fill(message);
};

export const formScenarios: FormScenario[] = [
  {
    id: 'contact',
    route: '/contact',
    formSelector: '#contact-form',
    invalidFieldNames: ['name', 'email', 'purpose', 'message'],
    resetFieldName: 'name',
    fillValidFields: fillContactForm,
  },
  {
    id: 'services',
    route: '/services',
    formSelector: '#services-form',
    invalidFieldNames: [
      'firstName',
      'email',
      'industry',
      'duration',
      'assistanceTime',
      'orgSize',
      'details',
    ],
    resetFieldName: 'firstName',
    fillValidFields: fillServicesForm,
  },
  {
    id: 'speaking',
    route: '/speaking',
    formSelector: '#speaking-form',
    invalidFieldNames: [
      'firstName',
      'organizationName',
      'position',
      'dateMonth',
      'email',
      'details',
    ],
    resetFieldName: 'firstName',
    fillValidFields: fillSpeakingForm,
  },
];

export const runFormValidationThenSuccess = async (
  page: Page,
  scenario: FormScenario,
): Promise<void> => {
  await page.goto(scenario.route);

  const form = page.locator(scenario.formSelector);
  await expect(form).toBeVisible();
  await form.scrollIntoViewIfNeeded();

  await submitAndExpectValidation(form, scenario.invalidFieldNames);

  const message = getSubmissionMessageForMode(resolveFormsMode());
  await scenario.fillValidFields(form, message);

  await submitAndExpectSuccess(form);
  await expect(form.locator(`[name="${scenario.resetFieldName}"]`)).toHaveValue(
    '',
  );
};
