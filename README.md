# William Entriken Site Foundation

## Development

- `pnpm dev` runs Astro on `0.0.0.0:4321`
- `pnpm build` runs CSS purge setup and builds static output
- `pnpm preview` serves the built site on `0.0.0.0:4321`

## Scripts

- `pnpm run prepare:styles` builds purged animation CSS assets used by the app shell.
- `pnpm run check` runs `astro check`.
- `pnpm run lint` runs ESLint across the repo.
- `pnpm run lint:fix` applies safe ESLint autofixes.
- `pnpm run format` runs Prettier write mode.
- `pnpm run format:check` validates Prettier formatting without writing.
- `pnpm run check:all` runs `astro check`, lint, and format check in sequence.
- `pnpm run generate:brand-icons` regenerates inline Astro brand SVG components from `simple-icons`.
  Run this after changing icon mappings in `scripts/generate-brand-icons.mjs`.
- `pnpm run ci:lint` runs lint checks with CI-aligned command defaults.
- `pnpm run ci:vitest` runs Vitest without coverage gating.
- `pnpm run ci:playwright:predeploy` runs Playwright against local predeploy preview.
- `pnpm run ci:playwright:live` runs Playwright against `PRODUCTION_URL`.
- `pnpm run link-check` builds the site and runs Linkinator checks against `dist` with `linkinator.config.json`.
- `pnpm run ci:deploy:vercel` performs Vercel production pull/build/deploy using required environment variables.

## Production Pipeline

Workflow: [`.github/workflows/production-pipeline.yml`](./.github/workflows/production-pipeline.yml)

Job sequence:

1. `validate-config`
2. `lint`
3. `vitest`
4. `link_check`
5. `playwright_predeploy`
6. `deploy`
7. `playwright_postdeploy`
8. `rollback_on_postdeploy_failure` (runs only when postdeploy Playwright fails)

### Link Checking

- Standalone workflow: [`.github/workflows/link-check.yml`](./.github/workflows/link-check.yml)
- Triggered on pull requests and manual dispatch.
- Scheduled workflow: [`.github/workflows/link-check-scheduled.yml`](./.github/workflows/link-check-scheduled.yml)
- Runs weekly on Sunday at 00:00 UTC and supports manual dispatch.
- Reuses local composite action: [`.github/actions/link-check/action.yml`](./.github/actions/link-check/action.yml)
- Linkinator config: [`linkinator.config.json`](./linkinator.config.json)
- Link checks skip coverage-heavy content routes (`/press` and `/speaking`) so unmanaged `src/data/press-coverage.json` and `src/data/speaking-events.json` links do not gate CI.
- `linkinator-report.md` is uploaded as the `link-check-report` artifact in both standalone and production pipeline runs (including failures).

### Required GitHub Configuration

Set these repository or environment secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Set this variable on the GitHub Environment named `production`:

- `PRODUCTION_URL` (example: `https://williamentriken.net`)

### Rollback Behavior

- If postdeploy Playwright passes, rollback is skipped.
- If postdeploy Playwright fails after deploy succeeds, the workflow runs Vercel rollback automatically using the deployment URL produced by the deploy step.

## Reusable Images

- Use `src/components/ui/Image.astro` for UI images.
- Supports both:
  - public string paths (example: `src="/images/brand/wordmark.png"`)
  - imported metadata images (example: `import hero from "../assets/hero.png"; src={hero}`)
- Defaults:
  - `loading="lazy"`
  - `decoding="async"`
  - `aspectRatio="1 / 1"`
  - `fit="contain"`
- Set `priority={true}` for above-the-fold images.
- Missing image sources automatically switch to the animated wave+haze fallback.
- Decorative images should use empty alt text (`alt=""`).

## Fonts

Self-host Avenir files under `public/fonts/avenir/`:

- `Avenir-Bold.ttf` (wired for headings)
- `Avenir-Light.ttf` (wired for body)

Fallback stacks are already configured in `src/styles/fonts.scss`.
