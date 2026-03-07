import { readFormsEnv, type FormsEnvInput } from '@shared/forms/env';
import type {
  ContactFormPayload,
  FormKind,
  FormPayloadByKind,
  FormSubmitResult,
  ServicesFormPayload,
  SpeakingFormPayload,
} from '@shared/forms/types';

export interface FormSubmitOptions {
  env?: FormsEnvInput;
  fetcher?: typeof fetch;
}

interface WorkerResponse {
  success?: unknown;
}

export const MOCK_FAILURE_TRIGGER_TEXT = 'This message will fail.';

const isWorkerSuccess = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (value as WorkerResponse).success === true;
};

const didRequestSucceed = async (response: Response): Promise<boolean> => {
  if (!response.ok) {
    return false;
  }

  try {
    const payload = (await response.json()) as unknown;
    return isWorkerSuccess(payload);
  } catch {
    return false;
  }
};

const getPrimaryTextareaValue = (
  kind: FormKind,
  payload: FormPayloadByKind[FormKind],
): string => {
  switch (kind) {
    case 'contact':
      return (payload as ContactFormPayload).message;
    case 'services':
      return (payload as ServicesFormPayload).details;
    case 'speaking':
      return (payload as SpeakingFormPayload).details;
  }
};

export const submitFormPayload = async <K extends FormKind>(
  kind: K,
  payload: FormPayloadByKind[K],
  options: FormSubmitOptions = {},
): Promise<FormSubmitResult<K>> => {
  const env = options.env ?? (import.meta.env as FormsEnvInput);
  let config;
  try {
    config = readFormsEnv(env);
  } catch {
    return {
      kind,
      success: false,
      mocked: false,
    };
  }

  if (config.mock) {
    // In mock mode, use an exact phrase in the main textarea to force a failure response
    // for UI/testing workflows without hitting the live endpoint.
    const shouldFailMockSubmission =
      getPrimaryTextareaValue(kind, payload as FormPayloadByKind[FormKind]).trim() ===
      MOCK_FAILURE_TRIGGER_TEXT;

    return {
      kind,
      success: !shouldFailMockSubmission,
      mocked: true,
    };
  }

  const fetcher = options.fetcher ?? fetch;

  // To test live response paths without sending mail, manually include:
  // "This is a test. No email."
  try {
    const response = await fetcher(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      kind,
      success: await didRequestSucceed(response),
      mocked: false,
    };
  } catch {
    return {
      kind,
      success: false,
      mocked: false,
    };
  }
};
