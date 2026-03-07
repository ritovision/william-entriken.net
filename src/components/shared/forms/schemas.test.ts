import {
  validateContactPayload,
  validateServicesPayload,
  validateSpeakingPayload,
} from '@shared/forms/schemas';
import type {
  ContactFormPayload,
  ServicesFormPayload,
  SpeakingFormPayload,
} from '@shared/forms/types';

const baseContactPayload: ContactFormPayload = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  organization: 'Acme Inc',
  purpose: 'Consulting inquiry',
  message: 'This is a valid inquiry message.',
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
  details: 'Looking for advisory support.',
};

const baseSpeakingPayload: SpeakingFormPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  organizationName: 'Acme Inc',
  position: 'Founder',
  dateMonth: 'Jan',
  dateDay: '5',
  dateYear: '2026',
  email: 'jane@example.com',
  phone: '555-123-4567',
  details: 'We would like to discuss a keynote opportunity.',
};

describe('form schemas', () => {
  it('returns structured readable issues for contact validation failures', () => {
    const invalid = validateContactPayload({
      ...baseContactPayload,
      purpose: '',
      message: 'short',
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.message).toBe('Purpose is required.');
      expect(invalid.issues).toEqual([
        {
          fieldName: 'purpose',
          fieldLabel: 'Purpose',
          message: 'Purpose is required.',
        },
        {
          fieldName: 'message',
          fieldLabel: 'Message',
          message: 'Message must be at least 10 characters.',
        },
      ]);
    }
  });

  it('returns deduped services issues with readable field labels', () => {
    const invalid = validateServicesPayload({
      ...baseServicesPayload,
      email: 'bad-email',
      industry: '',
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.issues).toEqual([
        {
          fieldName: 'email',
          fieldLabel: 'Email',
          message: 'Invalid email address.',
        },
        {
          fieldName: 'industry',
          fieldLabel: 'Industry',
          message: 'What Industry Are You In? is required.',
        },
      ]);
    }
  });

  it('returns speaking issues for numeric/date constraints', () => {
    const invalid = validateSpeakingPayload({
      ...baseSpeakingPayload,
      dateDay: '123',
      dateYear: 'abcd',
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.issues).toEqual([
        {
          fieldName: 'dateDay',
          fieldLabel: 'Day',
          message: 'Day cannot exceed 2 characters.',
        },
        {
          fieldName: 'dateYear',
          fieldLabel: 'Year',
          message: 'Year must be numeric.',
        },
      ]);
    }
  });

  it('enforces total payload length and reports submission-level issue', () => {
    const servicesTooLarge = validateServicesPayload({
      ...baseServicesPayload,
      details: 'A'.repeat(3950),
    });

    expect(servicesTooLarge.success).toBe(false);

    if (!servicesTooLarge.success) {
      expect(servicesTooLarge.message).toBe('Submission cannot exceed 4k characters.');
      expect(servicesTooLarge.issues).toEqual([
        {
          fieldName: 'form',
          fieldLabel: 'Submission',
          message: 'Submission cannot exceed 4k characters.',
        },
      ]);
    }
  });
});
