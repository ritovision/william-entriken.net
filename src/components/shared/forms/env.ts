export interface FormsEnvInput {
  PUBLIC_FORMS_ENDPOINT?: string;
  PUBLIC_FORMS_MOCK?: string;
}

export interface FormsEnvConfig {
  endpoint: string;
  mock: boolean;
}

const TRUTHY_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on']);

export const parseMockFlag = (value?: string): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return TRUTHY_FLAG_VALUES.has(normalized);
};

export const readFormsEnv = (env: FormsEnvInput): FormsEnvConfig => {
  const endpoint = env.PUBLIC_FORMS_ENDPOINT?.trim() ?? '';
  if (!endpoint) {
    throw new Error('Missing PUBLIC_FORMS_ENDPOINT environment variable.');
  }

  return {
    endpoint,
    mock: parseMockFlag(env.PUBLIC_FORMS_MOCK),
  };
};
