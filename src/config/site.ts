export interface SiteRoute {
  slug: string;
  path: string;
  label: string;
}

export const siteRoutes: SiteRoute[] = [
  { slug: 'home', path: '/', label: "Home" },
  { slug: 'williams-legacy', path: '/williams-legacy', label: "William's Legacy" },
  { slug: 'speaking', path: '/speaking', label: 'Speaking' },
  { slug: 'services', path: '/services', label: 'Services' },
  { slug: 'press', path: '/press', label: 'Press' },
  { slug: 'buy-book', path: '/buy-book', label: 'Buy Book' },
  { slug: 'nfts', path: '/nfts', label: 'NFTs' },
  { slug: 'weekly-podcast', path: '/weekly-podcast', label: 'Weekly Podcast' },
  { slug: 'contact', path: '/contact', label: 'Contact' },
  { slug: 'about', path: '/about', label: 'About' },
  { slug: 'terms-of-service', path: '/terms-of-service', label: 'Terms of Service' },
  { slug: 'privacy-policy', path: '/privacy-policy', label: 'Privacy Policy' },
];
