import { siteRoutes } from '@config/site';
import type { SchemaBlock } from '@shared/types';
import { buildSchemaGraph, buildSchemaPayload } from './schema';

const siteBaseUrl = new URL('https://williamentriken.net');

const getNodeByType = (
  graph: Record<string, unknown>[],
  type: string,
): Record<string, unknown> | undefined =>
  graph.find((node) => node['@type'] === type);

describe('schema helpers', () => {
  it('builds default website, navigation, and webpage nodes', () => {
    const graph = buildSchemaGraph({
      canonicalHref: 'https://williamentriken.net/',
      currentPath: '/',
      pageTitle: 'William Entriken',
      pageDescription: 'Homepage',
      siteBaseUrl,
      routes: siteRoutes,
    });

    const website = getNodeByType(graph, 'WebSite');
    const navigation = getNodeByType(graph, 'ItemList');
    const webpage = getNodeByType(graph, 'WebPage');
    const breadcrumb = getNodeByType(graph, 'BreadcrumbList');

    expect(website).toBeDefined();
    expect(navigation).toBeDefined();
    expect(webpage).toBeDefined();
    expect(breadcrumb).toBeUndefined();
  });

  it('builds default two-level breadcrumb for non-home routes', () => {
    const graph = buildSchemaGraph({
      canonicalHref: 'https://williamentriken.net/services',
      currentPath: '/services',
      pageTitle: 'Services | William Entriken',
      pageDescription: 'Services page',
      siteBaseUrl,
      routes: siteRoutes,
    });

    const breadcrumb = getNodeByType(graph, 'BreadcrumbList');
    const items = (breadcrumb?.itemListElement as Record<string, unknown>[]) ?? [];

    expect(items).toHaveLength(2);
    expect(items[0]?.name).toBe('Home');
    expect(items[1]?.name).toBe('Services');
  });

  it('supports custom breadcrumb overrides and extra graph nodes', () => {
    const schema: SchemaBlock = {
      breadcrumbItems: [
        { name: 'Home', href: 'https://williamentriken.net/' },
        { name: 'About', href: '/about' },
        { name: 'Rito', href: '/about/rito' },
      ],
      graph: [
        {
          '@type': 'Person',
          '@id': 'https://williamentriken.net/about/rito#person',
          name: 'Rito',
        },
      ],
    };

    const graph = buildSchemaGraph({
      canonicalHref: 'https://williamentriken.net/about/rito',
      currentPath: '/about/rito',
      pageTitle: 'About Rito | William Entriken',
      pageDescription: 'Profile page',
      siteBaseUrl,
      routes: siteRoutes,
      schema,
    });

    const breadcrumb = getNodeByType(graph, 'BreadcrumbList');
    const breadcrumbItems =
      (breadcrumb?.itemListElement as Record<string, unknown>[]) ?? [];
    const person = getNodeByType(graph, 'Person');

    expect(breadcrumbItems).toHaveLength(3);
    expect(breadcrumbItems[1]?.name).toBe('About');
    expect(person?.name).toBe('Rito');
  });

  it('builds schema.org payload with @graph', () => {
    const payload = buildSchemaPayload([{ '@type': 'Thing', name: 'Example' }]);
    expect(payload['@context']).toBe('https://schema.org');
    expect(Array.isArray(payload['@graph'])).toBe(true);
  });
});
