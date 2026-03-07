import type { ImageMetadata } from 'astro';

export type ContentImageSource = string | ImageMetadata;

type ImageModule = {
  default: ImageMetadata;
};

const CONTENT_IMAGE_GLOB = import.meta.glob<ImageModule>(
  '/src/assets/images/**/*.{avif,gif,jpeg,jpg,png,svg,webp}',
  {
    eager: true,
  },
);

const CONTENT_IMAGE_PATH_PREFIXES = ['/images/pages/', '/images/shared/'] as const;
const SCHEMA_IMAGE_KEYS = new Set(['image', 'logo', 'thumbnailUrl']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toContentAssetPath = (value: string): string => `/src/assets${value}`;

const getPathname = (value: string): string | null => {
  try {
    return new URL(value).pathname;
  } catch {
    return null;
  }
};

export const isOptimizedContentImagePath = (value: string): boolean =>
  CONTENT_IMAGE_PATH_PREFIXES.some((prefix) => value.startsWith(prefix));

export const isImageMetadata = (value: unknown): value is ImageMetadata =>
  isRecord(value) &&
  typeof value.src === 'string' &&
  typeof value.width === 'number' &&
  typeof value.height === 'number' &&
  typeof value.format === 'string';

export const resolveContentImagePath = (value: string): ImageMetadata => {
  if (!isOptimizedContentImagePath(value)) {
    throw new Error(`Unsupported content image path: ${value}`);
  }

  const imageModule = CONTENT_IMAGE_GLOB[toContentAssetPath(value)];
  if (!imageModule) {
    throw new Error(`Missing image asset for content path: ${value}`);
  }

  return imageModule.default;
};

const resolveContentImageValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveContentImageValue(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const nextValue: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (
      (key === 'src' || key === 'imageSrc' || key === 'image') &&
      typeof entry === 'string' &&
      isOptimizedContentImagePath(entry)
    ) {
      nextValue[key] = resolveContentImagePath(entry);
      continue;
    }

    nextValue[key] = resolveContentImageValue(entry);
  }

  return nextValue;
};

export const resolveContentImageRefs = <T>(value: T): T =>
  resolveContentImageValue(value) as T;

export const toImageHref = (
  value: ContentImageSource,
  siteBaseUrl: URL,
): string => {
  if (isImageMetadata(value)) {
    return new URL(value.src, siteBaseUrl).href;
  }

  return new URL(value, siteBaseUrl).href;
};

const resolveSchemaImageHref = (
  value: string,
  siteBaseUrl: URL,
): string => {
  if (isOptimizedContentImagePath(value)) {
    return toImageHref(resolveContentImagePath(value), siteBaseUrl);
  }

  const pathname = getPathname(value);
  if (pathname && isOptimizedContentImagePath(pathname)) {
    return toImageHref(resolveContentImagePath(pathname), siteBaseUrl);
  }

  return value;
};

const resolveSchemaImageValue = (value: unknown, siteBaseUrl: URL): unknown => {
  if (typeof value === 'string') {
    return resolveSchemaImageHref(value, siteBaseUrl);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveSchemaImageValue(item, siteBaseUrl));
  }

  if (isRecord(value)) {
    const nextValue: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      nextValue[key] = SCHEMA_IMAGE_KEYS.has(key)
        ? resolveSchemaImageValue(entry, siteBaseUrl)
        : resolveSchemaObjectValue(entry, siteBaseUrl);
    }

    return nextValue;
  }

  return value;
};

const resolveSchemaObjectValue = (value: unknown, siteBaseUrl: URL): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveSchemaObjectValue(item, siteBaseUrl));
  }

  if (!isRecord(value)) {
    return value;
  }

  const nextValue: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    nextValue[key] = SCHEMA_IMAGE_KEYS.has(key)
      ? resolveSchemaImageValue(entry, siteBaseUrl)
      : resolveSchemaObjectValue(entry, siteBaseUrl);
  }

  return nextValue;
};

export const resolveSchemaImageRefs = <T>(value: T, siteBaseUrl: URL): T =>
  resolveSchemaObjectValue(value, siteBaseUrl) as T;
