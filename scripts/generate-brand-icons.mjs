import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as simpleIcons from 'simple-icons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'src/components/ui/icons/brands');

// LinkedIn is unavailable in current simple-icons package; use a stable SVG path fallback.
const LINKEDIN_FALLBACK_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .773 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .773 23.2 0 22.222 0h.003z';

const iconSpecs = [
  { componentName: 'BrandXIcon', exportName: 'siX' },
  { componentName: 'BrandYoutubeIcon', exportName: 'siYoutube' },
  { componentName: 'BrandTwitchIcon', exportName: 'siTwitch' },
  { componentName: 'BrandGithubIcon', exportName: 'siGithub' },
  {
    componentName: 'BrandLinkedinIcon',
    exportName: 'siLinkedin',
    fallbackPath: LINKEDIN_FALLBACK_PATH,
  },
  { componentName: 'BrandClaudeIcon', exportName: 'siClaude' },
  { componentName: 'BrandPerplexityIcon', exportName: 'siPerplexity' },
];

const makeComponentSource = (pathData) => `---
interface Props {
  class?: string;
}

const { class: className = '' } = Astro.props;
---

<svg class={className} viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" d="${pathData}" />
</svg>
`;

await mkdir(outputDir, { recursive: true });

for (const spec of iconSpecs) {
  const icon = simpleIcons[spec.exportName];
  const pathData = icon?.path || spec.fallbackPath;

  if (!pathData) {
    throw new Error(`Missing icon path for ${spec.componentName} (${spec.exportName}).`);
  }

  const outputPath = path.join(outputDir, `${spec.componentName}.astro`);
  const source = makeComponentSource(pathData);
  await writeFile(outputPath, source, 'utf8');
}

process.stdout.write(
  `Generated ${iconSpecs.length} brand icon components in ${outputDir}\n`,
);
