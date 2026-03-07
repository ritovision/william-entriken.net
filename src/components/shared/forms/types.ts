export type FormKind = 'contact' | 'services' | 'speaking';

export interface ContactFormPayload {
  name: string;
  email: string;
  organization: string;
  purpose: string;
  message: string;
}

export interface ServicesFormPayload {
  formType: 'services';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  position: string;
  projectWebsite: string;
  industry: string;
  duration: string;
  assistanceTime: string;
  orgSize: string;
  details: string;
}

export interface SpeakingFormPayload {
  firstName: string;
  lastName: string;
  organizationName: string;
  position: string;
  dateMonth: string;
  dateDay: string;
  dateYear: string;
  email: string;
  phone: string;
  details: string;
}

export interface FormPayloadByKind {
  contact: ContactFormPayload;
  services: ServicesFormPayload;
  speaking: SpeakingFormPayload;
}

export type AnyFormPayload = FormPayloadByKind[FormKind];

export interface ValidationIssue {
  fieldName: string;
  fieldLabel: string;
  message: string;
}

export type FormValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
      issues: ValidationIssue[];
    };

export interface FormSubmitResult<K extends FormKind = FormKind> {
  kind: K;
  success: boolean;
  mocked: boolean;
}
