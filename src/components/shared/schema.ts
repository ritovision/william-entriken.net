import type { SiteRoute } from '@config/site';
import { SEO_DEFAULTS } from '@shared/constants';
import type {
  SchemaBlock,
  SchemaBreadcrumbItem,
  SchemaGraphNode,
} from '@shared/types';

interface BuildSchemaGraphInput {
  canonicalHref: string;
  currentPath: string;
  pageTitle: string;
  pageDescription: string;
  siteBaseUrl: URL;
  routes: SiteRoute[];
  schema?: SchemaBlock;
}

const normalizePath = (path: string): string =>
  path === '/' ? '/' : path.replace(/\/+$/, '');

const isAbsoluteUrl = (value: string): boolean =>
  value.startsWith('http://') || value.startsWith('https://');

const toAbsoluteHref = (value: string, siteBaseUrl: URL): string =>
  isAbsoluteUrl(value) ? new URL(value).href : new URL(value, siteBaseUrl).href;

const getSiteHref = (siteBaseUrl: URL): string => new URL('/', siteBaseUrl).href;

const getRouteLabel = (
  currentPath: string,
  routes: SiteRoute[],
  pageTitle: string,
): string => {
  const matched = routes.find(
    (route) =>
      !isAbsoluteUrl(route.path) && normalizePath(route.path) === currentPath,
  );

  if (matched) {
    return matched.label;
  }

  const siteSuffix = ` | ${SEO_DEFAULTS.siteName}`;
  const trimmedTitle = pageTitle.trim();
  if (trimmedTitle.endsWith(siteSuffix)) {
    return trimmedTitle.slice(0, -siteSuffix.length).trim();
  }

  return trimmedTitle || 'Page';
};

const buildNavigationNode = (
  routes: SiteRoute[],
  siteBaseUrl: URL,
): SchemaGraphNode => {
  const siteHref = getSiteHref(siteBaseUrl);
  const navigationRoutes = routes
    .filter((route) => route.navGroup !== 'none')
    .sort((a, b) => a.order - b.order);

  return {
    '@type': 'ItemList',
    '@id': `${siteHref}#site-navigation`,
    name: 'Site Navigation',
    itemListElement: navigationRoutes.map((route, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SiteNavigationElement',
        name: route.label,
        url: toAbsoluteHref(route.path, siteBaseUrl),
      },
    })),
  };
};

const buildDefaultBreadcrumbItems = (
  currentPath: string,
  canonicalHref: string,
  siteBaseUrl: URL,
  routes: SiteRoute[],
  pageTitle: string,
): SchemaBreadcrumbItem[] => {
  if (currentPath === '/') {
    return [];
  }

  const siteHref = getSiteHref(siteBaseUrl);
  const currentLabel = getRouteLabel(currentPath, routes, pageTitle);

  return [
    {
      name: 'Home',
      href: siteHref,
    },
    {
      name: currentLabel,
      href: canonicalHref,
    },
  ];
};

const buildBreadcrumbNode = (
  items: SchemaBreadcrumbItem[],
  canonicalHref: string,
  siteBaseUrl: URL,
): SchemaGraphNode | null => {
  if (items.length < 2) {
    return null;
  }

  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalHref}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteHref(item.href, siteBaseUrl),
    })),
  };
};

const buildWebSiteNode = (siteBaseUrl: URL): SchemaGraphNode => {
  const siteHref = getSiteHref(siteBaseUrl);

  return {
    '@type': 'WebSite',
    '@id': `${siteHref}#website`,
    url: siteHref,
    name: SEO_DEFAULTS.siteName,
  };
};

const buildWebPageNode = (
  canonicalHref: string,
  pageTitle: string,
  pageDescription: string,
  breadcrumbItems: SchemaBreadcrumbItem[],
  siteBaseUrl: URL,
): SchemaGraphNode => {
  const siteHref = getSiteHref(siteBaseUrl);
  const webPage: SchemaGraphNode = {
    '@type': 'WebPage',
    '@id': `${canonicalHref}#webpage`,
    url: canonicalHref,
    name: pageTitle,
    description: pageDescription,
    isPartOf: {
      '@id': `${siteHref}#website`,
    },
  };

  if (breadcrumbItems.length >= 2) {
    webPage.breadcrumb = {
      '@id': `${canonicalHref}#breadcrumb`,
    };
  }

  return webPage;
};

const normalizeBreadcrumbItems = (
  breadcrumbItems: SchemaBreadcrumbItem[] | undefined,
): SchemaBreadcrumbItem[] =>
  (breadcrumbItems ?? [])
    .map((item) => ({
      name: item.name.trim(),
      href: item.href.trim(),
    }))
    .filter((item) => item.name.length > 0 && item.href.length > 0);

export const buildSchemaGraph = ({
  canonicalHref,
  currentPath,
  pageTitle,
  pageDescription,
  siteBaseUrl,
  routes,
  schema,
}: BuildSchemaGraphInput): SchemaGraphNode[] => {
  const breadcrumbItems = normalizeBreadcrumbItems(schema?.breadcrumbItems);
  const effectiveBreadcrumbItems =
    breadcrumbItems.length > 0
      ? breadcrumbItems
      : buildDefaultBreadcrumbItems(
          currentPath,
          canonicalHref,
          siteBaseUrl,
          routes,
          pageTitle,
        );

  const graph: SchemaGraphNode[] = [
    buildWebSiteNode(siteBaseUrl),
    buildNavigationNode(routes, siteBaseUrl),
    buildWebPageNode(
      canonicalHref,
      pageTitle,
      pageDescription,
      effectiveBreadcrumbItems,
      siteBaseUrl,
    ),
  ];

  const breadcrumbNode = buildBreadcrumbNode(
    effectiveBreadcrumbItems,
    canonicalHref,
    siteBaseUrl,
  );
  if (breadcrumbNode) {
    graph.push(breadcrumbNode);
  }

  if (Array.isArray(schema?.graph)) {
    graph.push(...schema.graph);
  }

  return graph;
};

export const buildSchemaPayload = (
  graph: SchemaGraphNode[],
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@graph': graph,
});
