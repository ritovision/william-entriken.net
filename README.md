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
