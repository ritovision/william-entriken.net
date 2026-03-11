# William Entriken

![William Entriken Site OG Image](public/images/brand/OG/OG-image.png)

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwilliamentriken.net&up_message=live&down_message=down&label=website)](https://williamentriken.net)
[![Case Study](https://img.shields.io/badge/case%20study-RitoVision-012035)](https://ritovision.com/projects/entriken)
[![Pipeline](https://github.com/ritovision/william-entriken.net/actions/workflows/production-pipeline.yml/badge.svg)](https://github.com/ritovision/william-entriken.net/actions/workflows/production-pipeline.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-4D7A97)](LICENSE)


> Among the Few Influential Pioneers who Built Foundations for Multi-Billion Dollar Ecosystems
>
> Leaving an enduring legacy in Digital Ownership, Finance & Cybersecurity

## Overview

This project is a narrative-forward Astro site for William Entriken. It positions a broad body of work, including civic hacking, strategy, software architecture, public thinking, and cybersecurity, around the contribution most legible in the public record: ERC-721, the first mainstream NFT standard and a catalyst for the digital asset ownership economy.

The site serves as a public-facing artifact, an SEO surface, an AI-readable reference point, and a funnel for speaking and advisory opportunities. It also complements [phor.net](https://phor.net) and related subdomains by giving William's broader work a more intentional, navigable, and legible narrative home.

## Narrative Positioning

This site is designed to establish William Entriken's broader background in context with his highest-signal contribution. ERC-721 is the entry point because it makes the rest of the story legible: standards work, digital ownership, public-interest hacking, fintech infrastructure, cybersecurity credibility, and advisory relevance all become easier to understand when grounded in the achievement most people already recognize.

That is the project's deliberate "mythologizing" center. The framing is intentionally assertive, but it is not meant to flatten history. It foregrounds the standard, the language around NFTs, and the downstream ecosystem effects so the surrounding work has a clear frame instead of reading like an unrelated list of domain accomplishments.

## Historical Context

The site is an authored homage to William's legacy and seminal influence, but the larger history matters. ERC-721 was a community effort. The work started with Dieter Shirley, then evolved, was shaped, and was ultimately shepherded by William Entriken with community support. He acted as a central steward and catalyst within that broader collective effort, helping shape a standard that went on to influence major waves of innovation and industry. He was seminal, but he was not the sole author of the ecosystem that followed.

## Authorship Perspective

This site reflects both the maintainer's distillation of publicly sourced information and firsthand knowledge gained through years of collaboration with William. It is designed to make William Entriken's broad and technical body of work clear to both technical and non-technical audiences.

The maintainer, Rito, has known and collaborated with William over the years, including co-authoring the planned ERC [Universal Asset Signing](https://ritovision.com/projects/uas), attending NFT.NYC with him, and participating in his podcast sessions of [Community Service Hours](https://hour.gg). Rito has also contributed to the `hour.gg` experience itself, including [mobile UX and navigation improvements](https://github.com/community-service/hour.gg/pull/36).

As a cross-functional operator himself, Rito approaches the site through the lens of someone who recognizes and relates to William’s eclectic, multi-disciplinary nature, despite their distinct backgrounds.


## Intentional Design

- Multi-page Astro site built to feel editorial rather than app-like.
- Desktop sidebar and mobile drawer both expose in-page table of contents navigation so long pages stay cleanly navigable.
- "Ask your AI" flow opens provider deep links for ChatGPT, Claude, and Perplexity.
- Users can also copy the current page as Markdown for AI tools that do not support deep links.
- `robots.txt` allows crawlers, and the project deliberately treats AI readability and shareability as product concerns rather than afterthoughts.

## Architecture and Content Model

- Framework: Astro multi-page architecture with route folders and `index.astro` pages.
- Styling: Bootstrap primitives plus project tokens and utilities.
- Content model: page content is injected from local `_content.json` files instead of being hardcoded into reusable components.
- Interactivity: React islands are used only where the experience actually needs them.
- Navigation and shared UI live in reusable component layers; page-specific composition stays local to each route.
- Images are handled through shared Astro image components instead of ad hoc raw image markup.

This keeps the content portable, the page architecture consistent, and the presentation layer easy to evolve without rewriting copy-rich sections by hand.

## Feed Strategy

Press and speaking coverage originate on `phor.net` (source repo: [fulldecent/phor.net](https://github.com/fulldecent/phor.net)). William publishes and maintains the canonical feed data there, and this site pulls from that upstream source rather than maintaining a separate editorial copy.

The setup has two redundant paths, by design.

- A scheduled GitHub Actions workflow runs `sync:coverage` daily, fetches the upstream feed JSON from the `phor.net` repo, normalizes it, writes the results into `src/data/feeds/press-coverage.json` and `src/data/feeds/speaking-events.json`, and opens a pull request when those datasets change. This is the preferred path. Feeds don't change often enough to justify real-time pipelines, polling, webhooks, or client-triggered repo updates — a conservative scheduled check is the right fit for controlling what gets committed.
- At runtime, each feed component renders with the embedded local dataset first, then performs a delayed `cache: 'no-store'` fetch against the same upstream source. The payload is normalized and compared against the embedded items, and the UI only updates when there is an actual diff. This acts as a real-time fallback to surface changes between syncs and deploys, but it only updates the browser — it does not trigger PRs or modify the repo. The source of truth is updated exclusively through the CI path.

## Forms and Email Handling

The site supports three form flows:

- `contact`
- `services`
- `speaking`

Validation is handled on the client with Zod-backed schemas. The goal is sensible protection, not performative complexity: required fields are enforced, field-specific constraints are applied, email formats are checked, and oversized submissions are rejected before they ever hit the network.

Delivery is intentionally separated from the Astro app. The frontend submits JSON payloads to a Cloudflare Worker endpoint, and email handling lives behind that boundary with an SMTP host on the delivery side. That keeps the site thin while preserving a real submission path for production use.

There are two important testing modes:

- Mock mode: set `PUBLIC_FORMS_MOCK=true`
- Live mode: set `PUBLIC_FORMS_MOCK=false`

The form runtime also supports two special message conventions:

- `This message will fail.` forces a mock failure path for UI and test workflows.
- `This is a test. No email.` is the live-safe test phrase. The worker is expected to recognize that message and return a success response without sending mail, so production wiring can be exercised without spamming real inboxes.

This makes the forms testable in CI and safer to validate against live infrastructure.

## CI/CD

The pipeline is methodical and thorough.

Testing is practical — it covers what matters without chasing full coverage:

- Vitest covers the critical logic paths: feed normalization, schema generation, form env/runtime behavior, submission logic, AI deep links, Markdown copy behavior, and other shared runtime utilities.
- Playwright covers essential components and user tasks.
- Accessibility checks run in Playwright using `@axe-core/playwright` so core flows get automated a11y coverage as part of end-to-end testing.

Production deploys run through a staged GitHub Actions pipeline:

1. `validate-config`
2. `lint`
3. `vitest`
4. `link_check`
5. `playwright_predeploy`
6. `deploy`
7. `playwright_postdeploy`
8. `rollback_on_postdeploy_failure`

Playwright runs the same suite before and after deploy to catch production-specific regressions. Deployments go to Vercel. If post-deploy checks fail, the workflow rolls the deployment back automatically.

### Playwright Form Modes

Predeploy mode runs against a local preview build:

- `PUBLIC_FORMS_MOCK=true`
- `PUBLIC_FORMS_ENDPOINT` is injected by the action
- happy-path form submissions use `This is a test. No email.`
- targeted failure tests use `This message will fail.`

Postdeploy mode runs against the live site:

- `PUBLIC_FORMS_MOCK=false`
- form tests still use `This is a test. No email.`
- `This message will fail.` should not be used in postdeploy specs

## Local Development

Refer to AGENTS.md for site development guidelines.

To run the build locally after cloning:

```bash
pnpm dev
```

This starts Astro on `0.0.0.0:4321` and prepares the purged animation styles used by the shell.

Common workflows:

- `pnpm build` builds the site
- `pnpm preview` serves the built output on `0.0.0.0:4321`
- `pnpm run check:all` runs the main static checks together
- `pnpm run test:run` runs the Vitest suite once
- `pnpm run test:e2e` runs the Playwright suite
- `pnpm run sync:coverage` refreshes upstream press and speaking feed data
- `pnpm run link-check` builds the site and validates links in `dist`

## Notes

- The production site URL is `https://williamentriken.net`.
- Link checks intentionally skip the coverage-heavy `/press` and `/speaking` routes so unmanaged external links in feed data do not gate deployment.
- The site uses `src/components/ui/Image.astro` for reusable image handling and self-hosted font assets in `public/fonts`.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

Apache 2.0 does not grant rights to use any third-party names, trademarks, or branding that may appear in this repository.
