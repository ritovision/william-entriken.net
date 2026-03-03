import { z } from 'zod';
import type {
  ContactFormPayload,
  FormKind,
  FormPayloadByKind,
  FormValidationResult,
  ServicesFormPayload,
  SpeakingFormPayload,
  ValidationIssue,
} from '@shared/forms/types';

export const MAX_SUBMISSION_LENGTH = 4000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_VALIDATION_MESSAGE = 'Invalid submission.';
const FORM_LEVEL_FIELD_NAME = 'form';
const FORM_LEVEL_FIELD_LABEL = 'Submission';

interface SchemaIssueLike {
  path: unknown[];
  message: string;
}

const CONTACT_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  organization: 'Organization',
  purpose: 'Purpose',
  message: 'Message',
};

const SERVICES_FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  companyName: 'Company Name',
  position: 'Position',
  projectWebsite: 'Project / Company Website',
  industry: 'Industry',
  duration: 'Duration',
  assistanceTime: 'Assistance Time',
  orgSize: 'Organization Size',
  details: 'Details',
};

const SPEAKING_FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  organizationName: 'Organization',
  position: 'Position',
  dateMonth: 'Month',
  dateDay: 'Day',
  dateYear: 'Year',
  email: 'Email',
  phone: 'Phone',
  details: 'Details',
};

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string()
    .min(1, 'Email is required.')
    .max(100, 'Email cannot exceed 100 characters.')
    .regex(EMAIL_REGEX, 'Invalid email address.'),
  organization: z.string().max(100, 'Organization cannot exceed 100 characters.'),
  purpose: z
    .string()
    .min(1, 'Purpose is required.')
    .max(100, 'Purpose cannot exceed 100 characters.'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message cannot exceed 2000 characters.'),
});

export const servicesFormSchema = z.object({
  formType: z.literal('services'),
  firstName: z.string().min(1, 'First Name is required.'),
  lastName: z.string(),
  email: z
    .string()
    .min(1, 'Email is required.')
    .regex(EMAIL_REGEX, 'Invalid email address.'),
  phone: z.string(),
  companyName: z.string(),
  position: z.string(),
  projectWebsite: z.string(),
  industry: z.string().min(1, 'What Industry Are You In? is required.'),
  duration: z.string().min(1, 'Duration of Engagement Sought is required.'),
  assistanceTime: z
    .string()
    .min(1, 'How Soon Do You Require Assistance? is required.'),
  orgSize: z.string().min(1, 'Organization Size is required.'),
  details: z.string().min(1, 'Please Detail Your Needs and Questions is required.'),
});

export const speakingFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First Name is required.')
    .max(50, 'First Name cannot exceed 50 characters.'),
  lastName: z.string().max(50, 'Last Name cannot exceed 50 characters.'),
  organizationName: z
    .string()
    .min(1, 'Organization is required.')
    .max(50, 'Organization cannot exceed 50 characters.'),
  position: z
    .string()
    .min(1, 'Position is required.')
    .max(50, 'Position cannot exceed 50 characters.'),
  dateMonth: z.string().min(1, 'Month is required.'),
  dateDay: z
    .string()
    .max(2, 'Day cannot exceed 2 characters.')
    .regex(/^\d*$/, 'Day must be numeric.'),
  dateYear: z
    .string()
    .max(4, 'Year cannot exceed 4 characters.')
    .regex(/^\d*$/, 'Year must be numeric.'),
  email: z
    .string()
    .min(1, 'Email is required.')
    .max(50, 'Email cannot exceed 50 characters.')
    .regex(EMAIL_REGEX, 'Invalid email address.'),
  phone: z.string().max(50, 'Phone cannot exceed 50 characters.'),
  details: z
    .string()
    .min(1, 'Details About Opportunity is required.')
    .max(2500, 'Details cannot exceed 2500 characters.'),
});

const getFieldLabel = (
  fieldName: string,
  fieldLabels: Record<string, string>,
): string => {
  if (fieldName === FORM_LEVEL_FIELD_NAME) {
    return FORM_LEVEL_FIELD_LABEL;
  }

  return fieldLabels[fieldName] ?? fieldName;
};

const buildIssuesFromZodError = (
  zodIssues: SchemaIssueLike[],
  fieldLabels: Record<string, string>,
): ValidationIssue[] => {
  const dedupedIssues = new Map<string, ValidationIssue>();

  for (const issue of zodIssues) {
    const pathHead = issue.path[0];
    const fieldName =
      typeof pathHead === 'string' && pathHead.length > 0
        ? pathHead
        : FORM_LEVEL_FIELD_NAME;

    if (dedupedIssues.has(fieldName)) {
      continue;
    }

    dedupedIssues.set(fieldName, {
      fieldName,
      fieldLabel: getFieldLabel(fieldName, fieldLabels),
      message: issue.message || FALLBACK_VALIDATION_MESSAGE,
    });
  }

  const issues = Array.from(dedupedIssues.values());
  if (issues.length > 0) {
    return issues;
  }

  return [
    {
      fieldName: FORM_LEVEL_FIELD_NAME,
      fieldLabel: FORM_LEVEL_FIELD_LABEL,
      message: FALLBACK_VALIDATION_MESSAGE,
    },
  ];
};

const getValidationError = (issues: ValidationIssue[]): FormValidationResult<never> => ({
  success: false,
  message: issues[0]?.message ?? FALLBACK_VALIDATION_MESSAGE,
  issues,
});

const validateWithTotalLength = <T>(
  payload: T,
  schema: z.ZodType<T>,
  totalLengthMessage: string,
  fieldLabels: Record<string, string>,
): FormValidationResult<T> => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issues = buildIssuesFromZodError(parsed.error.issues, fieldLabels);
    return getValidationError(issues);
  }

  const totalLength = JSON.stringify(parsed.data).length;
  if (totalLength > MAX_SUBMISSION_LENGTH) {
    return getValidationError([
      {
        fieldName: FORM_LEVEL_FIELD_NAME,
        fieldLabel: FORM_LEVEL_FIELD_LABEL,
        message: totalLengthMessage,
      },
    ]);
  }

  return {
    success: true,
    data: parsed.data,
  };
};

export const validateContactPayload = (
  payload: ContactFormPayload,
): FormValidationResult<ContactFormPayload> =>
  validateWithTotalLength(
    payload,
    contactFormSchema,
    'Submission cannot exceed 4000 characters total.',
    CONTACT_FIELD_LABELS,
  );

export const validateServicesPayload = (
  payload: ServicesFormPayload,
): FormValidationResult<ServicesFormPayload> =>
  validateWithTotalLength(
    payload,
    servicesFormSchema,
    'Submission cannot exceed 4k characters.',
    SERVICES_FIELD_LABELS,
  );

export const validateSpeakingPayload = (
  payload: SpeakingFormPayload,
): FormValidationResult<SpeakingFormPayload> =>
  validateWithTotalLength(
    payload,
    speakingFormSchema,
    'Submission cannot exceed 4k characters.',
    SPEAKING_FIELD_LABELS,
  );

export const validatePayloadByKind = <K extends FormKind>(
  kind: K,
  payload: FormPayloadByKind[K],
): FormValidationResult<FormPayloadByKind[K]> => {
  switch (kind) {
    case 'contact':
      return validateContactPayload(payload as FormPayloadByKind['contact']) as FormValidationResult<
        FormPayloadByKind[K]
      >;
    case 'services':
      return validateServicesPayload(payload as FormPayloadByKind['services']) as FormValidationResult<
        FormPayloadByKind[K]
      >;
    case 'speaking':
      return validateSpeakingPayload(payload as FormPayloadByKind['speaking']) as FormValidationResult<
        FormPayloadByKind[K]
      >;
  }
};
