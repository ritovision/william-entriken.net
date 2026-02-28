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

- Each non-root route must use a folder with `index.astro`.
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

## Typography Rules

- Heading family: Avenir heavy fallback to Arial bold stack
- Body family: Avenir light fallback to Roboto/system sans stack
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

- Page-specific image assets belong in `public/images/pages/<slug>/`.
- Avenir fonts belong in `public/fonts/avenir/`.

## Migration Workflow

1. Add/adjust page JSON content in the page folder.
2. Build page-local pieces under `src/pages/<slug>/_components` only when not reusable.
3. Promote repeated patterns to `src/components/sections` or `src/components/ui`.
4. Preserve tokenized styling and avoid one-off hex values where possible.
