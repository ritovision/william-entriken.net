import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizePressCoverage,
  normalizeSpeakingEvents,
} from '../src/components/shared/feeds/core/canonicalize.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'src', 'data', 'feeds');
const log = (message) => process.stdout.write(`${message}\n`);
const logError = (message) => process.stderr.write(`${message}\n`);

const DATASETS = [
  {
    name: 'press-coverage',
    kind: 'press',
    url: 'https://raw.githubusercontent.com/fulldecent/phor.net/main/source/_data/press-coverage.json',
    targetPath: path.join(dataDir, 'press-coverage.json'),
  },
  {
    name: 'speaking-events',
    kind: 'speaking',
    url: 'https://raw.githubusercontent.com/fulldecent/phor.net/main/source/_data/speaking-events.json',
    targetPath: path.join(dataDir, 'speaking-events.json'),
  },
];

const readFileOrEmpty = async (filePath) => {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
};

const normalizeJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const assertOptionalString = (value, fieldName, datasetName, index) => {
  if (value === undefined || typeof value === 'string') {
    return;
  }

  throw new Error(
    `${datasetName}[${index}] has invalid "${fieldName}" (expected string when present).`,
  );
};

const assertPressAuthors = (value, datasetName, index) => {
  if (value === undefined || typeof value === 'string') {
    return;
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
    return;
  }

  throw new Error(
    `${datasetName}[${index}] has invalid "authors" (expected string or string array).`,
  );
};

const validateCoverageEntry = (kind, entry, datasetName, index) => {
  if (!isRecord(entry)) {
    throw new Error(`${datasetName}[${index}] is not an object.`);
  }

  if (!hasNonEmptyString(entry.date)) {
    throw new Error(`${datasetName}[${index}] is missing a valid "date".`);
  }

  if (!hasNonEmptyString(entry.title)) {
    throw new Error(`${datasetName}[${index}] is missing a valid "title".`);
  }

  assertOptionalString(entry.url, 'url', datasetName, index);

  if (kind === 'press') {
    assertPressAuthors(entry.authors, datasetName, index);
    assertOptionalString(entry.publication, 'publication', datasetName, index);
  }
};

const validateCoverageDataset = (kind, payload, datasetName) => {
  for (let index = 0; index < payload.length; index += 1) {
    validateCoverageEntry(kind, payload[index], datasetName, index);
  }
};

const normalizeCoverageByKind = (kind, value) =>
  kind === 'press' ? normalizePressCoverage(value) : normalizeSpeakingEvents(value);

const parseJsonOrEmpty = async (filePath) => {
  const content = await readFileOrEmpty(filePath);
  if (!content.trim()) {
    return [];
  }

  return JSON.parse(content);
};

const run = async () => {
  await mkdir(dataDir, { recursive: true });

  const changed = [];

  for (const dataset of DATASETS) {
    const response = await fetch(dataset.url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${dataset.name}: ${response.status} ${response.statusText}`,
      );
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error(`${dataset.name} payload is not an array.`);
    }
    validateCoverageDataset(dataset.kind, payload, dataset.name);

    const nextItems = normalizeCoverageByKind(dataset.kind, payload);
    const prevPayload = await parseJsonOrEmpty(dataset.targetPath);
    const prevItems = normalizeCoverageByKind(dataset.kind, prevPayload);
    const nextContent = normalizeJson(nextItems);
    const prevContent = normalizeJson(prevItems);

    if (nextContent !== prevContent) {
      await writeFile(dataset.targetPath, nextContent, 'utf8');
      changed.push(dataset.targetPath);
      log(`[sync:coverage] Updated ${path.relative(repoRoot, dataset.targetPath)}`);
    } else {
      log(`[sync:coverage] No changes for ${dataset.name}`);
    }
  }

  if (changed.length === 0) {
    log('[sync:coverage] No dataset updates detected.');
  }
};

run().catch((error) => {
  logError(`[sync:coverage] Failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
