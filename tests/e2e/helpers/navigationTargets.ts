import { siteRoutes, type SiteRoute } from '@config/site';

export interface NavigationTarget {
  slug: string;
  label: string;
  path: string;
}

const isInternalPath = (path: string): path is `/${string}` =>
  path.startsWith('/');

const internalPrimaryRoutes = siteRoutes
  .filter(
    (route): route is SiteRoute & { path: `/${string}` } =>
      route.navGroup === 'primary' && isInternalPath(route.path),
  )
  .sort((a, b) => a.order - b.order);

export const navigationTargets: NavigationTarget[] = internalPrimaryRoutes
  .filter((route) => route.path !== '/')
  .map((route) => ({
    slug: route.slug,
    label: route.label,
    path: route.path,
  }));

const escapePathForRegex = (path: string) =>
  path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const pathPattern = (path: string) =>
  new RegExp(`${escapePathForRegex(path)}(?:/)?(?:\\?.*)?(?:#.*)?$`);
