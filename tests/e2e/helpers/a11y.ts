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

const formatViolationTarget = (target: string[]) =>
  target.length > 0 ? target.join(' | ') : '(no target)';

const formatViolations = (violations: AxeBuilder.AxeResults['violations']) =>
  violations
    .map((violation) => {
      const firstNode = violation.nodes[0];
      const firstTarget = firstNode ? formatViolationTarget(firstNode.target) : '(no node)';
      return `- [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} (target: ${firstTarget})`;
    })
    .join('\n');

export const runAxeScan = async (
  page: Page,
  options: A11yScanOptions,
): Promise<void> => {
  const results = await new AxeBuilder({ page }).analyze();
  const failureMessage = [
    `Axe violations found on ${options.routePath} [${options.stateLabel}]`,
    formatViolations(results.violations),
  ]
    .filter(Boolean)
    .join('\n');

  expect(results.violations, failureMessage).toHaveLength(0);
};
