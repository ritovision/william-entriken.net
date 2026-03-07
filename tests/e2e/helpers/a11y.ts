import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { siteRoutes, type SiteRoute } from '@config/site';

export interface A11yRouteTarget {
  slug: string;
  label: string;
  path: `/${string}`;
}

export interface A11yScanOptions {
  routePath: string;
  stateLabel: string;
}

const getExcludedSelectors = ({ routePath }: A11yScanOptions): string[] => {
  if (routePath === '/contact') {
    return [
      // Known false-positive in automated contrast checks for the contact routing block.
      '#contact-services > .contact-routing__title.text-gold',
      '#contact-services > .contact-routing__description.text-white',
      '.contact-routing__button.btn[href$="services"]',
    ];
  }

  if (routePath === '/about') {
    return [
      // Intentional stylistic choice: the author considers this subtitle pragmatically visible.
      '#about-rito-subtitle',
    ];
  }

  if (routePath === '/nfts') {
    return [
      // Known false-positive: the rendered NFT heading sequence is intentionally structured
      // and does not show a clear hierarchy issue in source markup.
      '#historical-significance > h3',
      // External iframe content can stall or distort recursive axe analysis on this page.
      '.su-squares-panel__iframe-frame',
    ];
  }

  return [];
};

const isInternalPath = (path: string): path is `/${string}` =>
  path.startsWith('/');

export const getPrimaryPageRoutes = (): A11yRouteTarget[] => {
  return siteRoutes
    .filter(
      (route): route is SiteRoute & { path: `/${string}` } =>
        route.navGroup === 'primary' && isInternalPath(route.path),
    )
    .sort((a, b) => a.order - b.order)
    .map((route) => ({
      slug: route.slug,
      label: route.label,
      path: route.path,
    }));
};

const formatViolationTarget = (target: readonly unknown[]) =>
  target.length > 0 ? target.map(String).join(' | ') : '(no target)';

type AxeViolations = Awaited<
  ReturnType<InstanceType<typeof AxeBuilder>['analyze']>
>['violations'];

const formatViolations = (violations: AxeViolations) =>
  violations
    .map((violation) => {
      const firstNode = violation.nodes[0];
      const firstTarget = firstNode
        ? formatViolationTarget(firstNode.target)
        : '(no node)';
      return `- [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} (target: ${firstTarget})`;
    })
    .join('\n');

export const runAxeScan = async (
  page: Page,
  options: A11yScanOptions,
): Promise<void> => {
  let builder = new AxeBuilder({ page });

  for (const selector of getExcludedSelectors(options)) {
    builder = builder.exclude(selector);
  }

  const results = await builder.analyze();
  const failureMessage = [
    `Axe violations found on ${options.routePath} [${options.stateLabel}]`,
    formatViolations(results.violations),
  ]
    .filter(Boolean)
    .join('\n');

  expect(results.violations, failureMessage).toHaveLength(0);
};
