# AGENTS.md

## Purpose

This repository is a large multi-page Astro migration. Optimize for clean structure, strict consistency, and minimal rework during content integration.

## Stack Standards

- Framework: Astro (`.astro` routes/components)
- Interactivity: React islands only when needed (`.tsx` in `src/components/islands`)
- Package manager: `pnpm`
- Language mode: TypeScript strict
- Styling: Bootstrap SCSS + project tokens/utilities

## Routing and Page Structure

- Each non-root route should use a folder with `index.astro`; keep framework-level special routes like `src/pages/404.astro` as direct files.
- Each page folder must include:
  - `_content.json` for injected page content
  - `_components/` for page-local non-reusable components
- Reusable components must never be stored in page folders.

## Reusable Component Structure

- `src/components/layout`: global layout pieces
- `src/components/ui`: primitive UI components
- `src/components/sections`: reusable content sections
- `src/components/islands`: React interactive islands only
- `src/components/shared`: shared types and constants

## Import Alias Rules

- Use domain aliases for non-local imports:
  - `@components/*` -> `src/components/*`
  - `@layouts/*` -> `src/layouts/*`
  - `@ui/*` -> `src/components/ui/*`
  - `@sections/*` -> `src/components/sections/*`
  - `@config/*` -> `src/config/*`
  - `@styles/*` -> `src/styles/*`
  - `@islands/*` -> `src/components/islands/*`
  - `@shared/*` -> `src/components/shared/*`
- Keep same-folder imports relative (`./...`).
- Keep page-local imports relative (`./_content.json`, `./_components/...`).
- Do not use a generic `@/` fallback alias.
- Prefer replacing deep `../...` imports with approved aliases when touching files.

## Content Injection Rules

- Default content format is JSON (`_content.json`).
- Route `index.astro` files should map JSON blocks to section component props.
- Do not hardcode page copy in reusable components.

## Design Tokens and Brand Rules

Use tokens defined in `src/styles/tokens.css` as source of truth:

- Primary background: `#002754`
- Accent text/buttons/dividers: `#EAAA00`
- Secondary blue: `#6059D4`
- Heading container gray: `#33343F`
- Content block gray: `#242323`
- White and black for contrast contexts
- For Su Squares expansions, reuse `--font-susquares`, `--color-susquares-gold`, and `--gradient-susquares` before adding one-off theme values.

## Typography Rules

- Heading family: Avenir heavy fallback to Arial bold stack
- Body family: Avenir light fallback to Roboto/system sans stack
- Headings should be centered by default
- Use Title Case for headings (capitalize major words; keep short prepositions/conjunctions/articles lowercase unless first or last)
- Use black text on white backgrounds
- Prefer gold/white text on dark backgrounds

## Layout and Spacing Rules

- Mobile content width target is `95%`
- Prefer margin and width utilities over large internal padding
- Keep corners square by default
- Borders are usually gold; white is allowed for contrast contexts

## Buttons

- Navy button: dark blue background, white text, `8px` radius
- Gold button: gold background, dark blue text, `50px` radius

## Section Composition

- Section backgrounds can vary and alternate frequently.
- Gray containers (`#33343F` and `#242323`) may be combined on one page.
- Overlay content blocks over section backgrounds must remain readable on mobile.

## CSS Purging

- Purge scope is limited to:
  - Animate.css output
  - custom animation CSS
- Do not purge Bootstrap CSS in this foundation setup.
- Keep safelist patterns in `config/purge-safelist.cjs`.

## Asset Organization

- Page-specific content image assets belong in `src/assets/images/pages/<slug>/`.
- Shared/static brand assets belong in `public/images/...`.
- Avenir fonts belong in `public/fonts/avenir/`.

## Image Component Policy

- Use `src/components/ui/Picture.astro` for page and content raster images by default.
- Use `src/components/ui/Image.astro` for shared/public image paths when Astro optimization is not needed.
- Do not add raw `<img>` unless there is a documented exception.
- Keep shared/static brand assets (logos, icons, social marks) in `public/images/...`.
- Put non-shared content images that benefit from Astro optimization in `src/assets/...` (or a local `images/` folder near the page/component and import them).
- If an image is reused across multiple pages/components, move it to a shared asset location (`src/assets/shared/...` or `public/images/...`).
- Prefer `aspectRatio` on shared image components for layout stability.
- `alt` is required for meaningful images; use `alt=""` only for decorative images.

## Migration Workflow

1. Add/adjust page JSON content in the page folder.
2. Build page-local pieces under `src/pages/<slug>/_components` only when not reusable.
3. Promote repeated patterns to `src/components/sections` or `src/components/ui`.
4. Preserve tokenized styling and avoid one-off hex values where possible.

## Type Safety Rules

- Prefer explicit types and avoid `any`/implicit `any` in TypeScript and inline scripts.
- Prefer `unknown` instead of `any` when a type is not known yet; use `any` only as a last resort.
- If `any` is unavoidable, document why with a concise inline comment.

## Linting Workflow

- Run `pnpm run lint` after large or complex edits.
- If lint issues are straightforward and low risk, fix them as part of task completion.
- If lint fixes involve nuance, behavior changes, or tradeoffs, ask the user how they want the fixes handled before applying them.

## Formatting Workflow

- Follow `prettier.config.mjs` as the single source of truth for formatting.
- Do not hand-style formatting rules that conflict with Prettier output.
