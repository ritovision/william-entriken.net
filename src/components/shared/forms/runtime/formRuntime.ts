import {
  validateContactPayload,
  validateServicesPayload,
  validateSpeakingPayload,
} from '@shared/forms/schemas';
import { submitFormPayload, type FormSubmitOptions } from '@shared/forms/submit';
import type {
  ContactFormPayload,
  FormKind,
  ServicesFormPayload,
  SpeakingFormPayload,
  ValidationIssue,
} from '@shared/forms/types';

interface FormRuntimeOptions extends FormSubmitOptions {
  submitter?: typeof submitFormPayload;
}

type FormModalMode = 'success' | 'failure' | 'validation';

interface FormSubmissionResult {
  reset: boolean;
  mode: FormModalMode;
  issues?: ValidationIssue[];
}

interface FormModalRefs {
  container: HTMLElement;
  root: HTMLElement;
  overlay: HTMLButtonElement;
  title: HTMLElement;
  text: HTMLElement;
  list: HTMLElement;
  closeButton: HTMLButtonElement;
}

interface FormModalState {
  restoreFocusTarget: HTMLElement | null;
  openFrameId: number | null;
}

const ICON_CHECKMARK =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-0.125em"><polyline points="20 6 9 17 4 12"/></svg>';

const ICON_X =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="var(--form-invalid-ring)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-0.125em"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

const SUCCESS_TITLE = `Success. Message sent ${ICON_CHECKMARK}`;
const SUCCESS_TEXT = 'We will get back to you as soon as we can.';
const FAILURE_TITLE = `Message not sent ${ICON_X}`;
const FAILURE_TEXT = 'Message not sent. Try again later.';
const VALIDATION_TITLE = 'Please fix the following';

const isFormKind = (value: string | null): value is FormKind =>
  value === 'contact' || value === 'services' || value === 'speaking';

const getFieldValue = (form: HTMLFormElement, fieldName: string): string => {
  const field = form.elements.namedItem(fieldName);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value.trim();
  }

  if (typeof RadioNodeList !== 'undefined' && field instanceof RadioNodeList) {
    return field.value.trim();
  }

  return '';
};

const buildContactPayload = (form: HTMLFormElement): ContactFormPayload => ({
  name: getFieldValue(form, 'name'),
  email: getFieldValue(form, 'email'),
  organization: getFieldValue(form, 'organization'),
  purpose: getFieldValue(form, 'purpose'),
  message: getFieldValue(form, 'message'),
});

const buildServicesPayload = (form: HTMLFormElement): ServicesFormPayload => ({
  formType: 'services',
  firstName: getFieldValue(form, 'firstName'),
  lastName: getFieldValue(form, 'lastName'),
  email: getFieldValue(form, 'email'),
  phone: getFieldValue(form, 'phone'),
  companyName: getFieldValue(form, 'companyName'),
  position: getFieldValue(form, 'position'),
  projectWebsite: getFieldValue(form, 'projectWebsite'),
  industry: getFieldValue(form, 'industry'),
  duration: getFieldValue(form, 'duration'),
  assistanceTime: getFieldValue(form, 'assistanceTime'),
  orgSize: getFieldValue(form, 'orgSize'),
  details: getFieldValue(form, 'details'),
});

const buildSpeakingPayload = (form: HTMLFormElement): SpeakingFormPayload => ({
  firstName: getFieldValue(form, 'firstName'),
  lastName: getFieldValue(form, 'lastName'),
  organizationName: getFieldValue(form, 'organizationName'),
  position: getFieldValue(form, 'position'),
  dateMonth: getFieldValue(form, 'dateMonth'),
  dateDay: getFieldValue(form, 'dateDay'),
  dateYear: getFieldValue(form, 'dateYear'),
  email: getFieldValue(form, 'email'),
  phone: getFieldValue(form, 'phone'),
  details: getFieldValue(form, 'details'),
});

const submitContact = async (
  form: HTMLFormElement,
  options: FormRuntimeOptions,
): Promise<FormSubmissionResult> => {
  const payload = buildContactPayload(form);
  const validated = validateContactPayload(payload);
  if (!validated.success) {
    return {
      reset: false,
      mode: 'validation',
      issues: validated.issues,
    };
  }

  const result = await (options.submitter ?? submitFormPayload)('contact', validated.data, {
    env: options.env,
    fetcher: options.fetcher,
  });

  return {
    reset: result.success,
    mode: result.success ? 'success' : 'failure',
  };
};

const submitServices = async (
  form: HTMLFormElement,
  options: FormRuntimeOptions,
): Promise<FormSubmissionResult> => {
  const payload = buildServicesPayload(form);
  const validated = validateServicesPayload(payload);
  if (!validated.success) {
    return {
      reset: false,
      mode: 'validation',
      issues: validated.issues,
    };
  }

  const result = await (options.submitter ?? submitFormPayload)(
    'services',
    validated.data,
    {
      env: options.env,
      fetcher: options.fetcher,
    },
  );

  return {
    reset: result.success,
    mode: result.success ? 'success' : 'failure',
  };
};

const submitSpeaking = async (
  form: HTMLFormElement,
  options: FormRuntimeOptions,
): Promise<FormSubmissionResult> => {
  const payload = buildSpeakingPayload(form);
  const validated = validateSpeakingPayload(payload);
  if (!validated.success) {
    return {
      reset: false,
      mode: 'validation',
      issues: validated.issues,
    };
  }

  const result = await (options.submitter ?? submitFormPayload)(
    'speaking',
    validated.data,
    {
      env: options.env,
      fetcher: options.fetcher,
    },
  );

  return {
    reset: result.success,
    mode: result.success ? 'success' : 'failure',
  };
};

const submitByKind = async (
  form: HTMLFormElement,
  kind: FormKind,
  options: FormRuntimeOptions,
): Promise<FormSubmissionResult> => {
  switch (kind) {
    case 'contact':
      return submitContact(form, options);
    case 'services':
      return submitServices(form, options);
    case 'speaking':
      return submitSpeaking(form, options);
  }
};

const getFieldElement = (
  form: HTMLFormElement,
  fieldName: string,
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null => {
  const field = form.elements.namedItem(fieldName);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field;
  }

  return null;
};

const clearInvalidStyles = (form: HTMLFormElement): void => {
  const invalidFields = form.querySelectorAll<HTMLElement>('.site-form__field-invalid');
  for (const field of invalidFields) {
    field.classList.remove('site-form__field-invalid');
  }
};

const markInvalidFields = (form: HTMLFormElement, issues: ValidationIssue[]): void => {
  const fieldNames = Array.from(
    new Set(
      issues
        .map((issue) => issue.fieldName)
        .filter((fieldName) => fieldName && fieldName !== 'form'),
    ),
  );

  for (const fieldName of fieldNames) {
    const field = getFieldElement(form, fieldName);
    if (!field) {
      continue;
    }

    field.classList.add('site-form__field-invalid');

    const clearCurrentField = () => {
      field.classList.remove('site-form__field-invalid');
    };

    field.addEventListener('focus', clearCurrentField, { once: true });
    field.addEventListener('input', clearCurrentField, { once: true });
    field.addEventListener('change', clearCurrentField, { once: true });
  }
};

const setSubmittingState = (form: HTMLFormElement, isSubmitting: boolean): void => {
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!submitButton) {
    return;
  }

  submitButton.classList.toggle('is-submitting', isSubmitting);
  submitButton.disabled = isSubmitting;
};

const resolveModalRefs = (form: HTMLFormElement): FormModalRefs | null => {
  const sectionRoot = form.closest<HTMLElement>('.forms-panel');
  if (!sectionRoot) {
    return null;
  }

  const root = sectionRoot.querySelector<HTMLElement>('[data-form-result-modal]');
  const overlay = sectionRoot.querySelector<HTMLButtonElement>('[data-form-result-overlay]');
  const title = sectionRoot.querySelector<HTMLElement>('[data-form-result-title]');
  const text = sectionRoot.querySelector<HTMLElement>('[data-form-result-text]');
  const list = sectionRoot.querySelector<HTMLElement>('[data-form-result-list]');
  const closeButton = sectionRoot.querySelector<HTMLButtonElement>('[data-form-result-close]');

  if (!root || !overlay || !title || !text || !list || !closeButton) {
    return null;
  }

  return {
    container: sectionRoot,
    root,
    overlay,
    title,
    text,
    list,
    closeButton,
  };
};

const getFocusableElements = (root: HTMLElement): HTMLElement[] => {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) =>
      !element.hasAttribute('hidden') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getAttribute('tabindex') !== '-1',
  );
};

const renderModalContent = (
  refs: FormModalRefs,
  mode: FormModalMode,
  issues: ValidationIssue[] = [],
): void => {
  refs.list.innerHTML = '';

  if (mode === 'success') {
    refs.title.innerHTML = SUCCESS_TITLE;
    refs.text.textContent = SUCCESS_TEXT;
    refs.text.hidden = false;
    refs.list.hidden = true;
    return;
  }

  if (mode === 'failure') {
    refs.title.innerHTML = FAILURE_TITLE;
    refs.text.textContent = FAILURE_TEXT;
    refs.text.hidden = false;
    refs.list.hidden = true;
    return;
  }

  refs.title.textContent = VALIDATION_TITLE;
  refs.text.hidden = true;

  const fragment = document.createDocumentFragment();
  for (const issue of issues) {
    const item = document.createElement('li');
    item.className = 'form-result-modal__issue';

    const field = document.createElement('strong');
    field.className = 'form-result-modal__issue-label';
    field.textContent = `${issue.fieldLabel}: `;

    const message = document.createElement('span');
    message.className = 'form-result-modal__issue-message';
    message.textContent = issue.message;

    item.appendChild(field);
    item.appendChild(message);
    fragment.appendChild(item);
  }

  refs.list.appendChild(fragment);
  refs.list.hidden = issues.length === 0;
};

const openModal = (
  refs: FormModalRefs,
  state: FormModalState,
  mode: FormModalMode,
  triggerElement: HTMLElement,
  issues: ValidationIssue[] = [],
): void => {
  renderModalContent(refs, mode, issues);

  if (state.openFrameId !== null) {
    window.cancelAnimationFrame(state.openFrameId);
    state.openFrameId = null;
  }

  refs.root.hidden = false;
  refs.root.classList.remove('is-open');
  refs.root.setAttribute('aria-hidden', 'false');
  refs.container.classList.add('is-form-modal-open');
  state.restoreFocusTarget = triggerElement;

  state.openFrameId = window.requestAnimationFrame(() => {
    refs.root.classList.add('is-open');
    state.openFrameId = null;

    const focusables = getFocusableElements(refs.root);
    const preferred =
      focusables.find((element) => element === refs.closeButton) ?? focusables[0];
    preferred?.focus();
  });
};

const closeModal = (refs: FormModalRefs, state: FormModalState): void => {
  if (state.openFrameId !== null) {
    window.cancelAnimationFrame(state.openFrameId);
    state.openFrameId = null;
  }

  refs.container.classList.remove('is-form-modal-open');

  if (!refs.root.classList.contains('is-open')) {
    refs.root.hidden = true;
    refs.root.setAttribute('aria-hidden', 'true');
    return;
  }

  refs.root.classList.remove('is-open');
  refs.root.setAttribute('aria-hidden', 'true');
  refs.root.hidden = true;
  refs.container.classList.remove('is-form-modal-open');
  state.restoreFocusTarget?.focus();
  state.restoreFocusTarget = null;
};

const setupModalEvents = (refs: FormModalRefs, state: FormModalState): void => {
  refs.overlay.addEventListener('click', () => {
    closeModal(refs, state);
  });

  refs.closeButton.addEventListener('click', () => {
    closeModal(refs, state);
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const isOpen = refs.root.classList.contains('is-open');
    if (!isOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(refs, state);
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusables = getFocusableElements(refs.root);
    if (focusables.length === 0) {
      return;
    }

    const activeElement = document.activeElement;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!first || !last) {
      return;
    }

    if (event.shiftKey) {
      if (activeElement === first || !refs.root.contains(activeElement)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
};

const getSubmitTrigger = (form: HTMLFormElement, event: SubmitEvent): HTMLElement => {
  if (event.submitter instanceof HTMLElement) {
    return event.submitter;
  }

  const button = form.querySelector<HTMLElement>('button[type="submit"]');
  if (button) {
    return button;
  }

  return form;
};

const hydrateForm = (form: HTMLFormElement, options: FormRuntimeOptions): void => {
  if (form.dataset.formHydrated === 'true') {
    return;
  }

  const kindAttr = form.getAttribute('data-form-kind');
  if (!isFormKind(kindAttr)) {
    return;
  }

  const modalRefs = resolveModalRefs(form);
  if (!modalRefs) {
    return;
  }

  const modalState: FormModalState = {
    restoreFocusTarget: null,
    openFrameId: null,
  };

  form.dataset.formHydrated = 'true';
  setupModalEvents(modalRefs, modalState);

  form.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();
    clearInvalidStyles(form);

    setSubmittingState(form, true);

    let submission: FormSubmissionResult;
    try {
      submission = await submitByKind(form, kindAttr, options);
    } catch {
      submission = {
        reset: false,
        mode: 'failure',
      };
    }

    setSubmittingState(form, false);

    if (submission.mode === 'validation' && submission.issues && submission.issues.length > 0) {
      markInvalidFields(form, submission.issues);
    }

    if (submission.reset) {
      form.reset();
    }

    openModal(
      modalRefs,
      modalState,
      submission.mode,
      getSubmitTrigger(form, event),
      submission.issues,
    );
  });
};

export const initFormRuntime = (options: FormRuntimeOptions = {}): void => {
  const forms = document.querySelectorAll<HTMLFormElement>('form[data-form-kind]');
  for (const form of forms) {
    hydrateForm(form, options);
  }
};
