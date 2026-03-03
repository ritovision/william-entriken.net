export interface SiteRoute {
  slug: string;
  path: string;
  label: string;
  navGroup: "primary" | "legal" | "none";
  order: number;
}

export const siteRoutes: SiteRoute[] = [
  {
    slug: "home",
    path: "/",
    label: "William's Legacy",
    navGroup: "primary",
    order: 1,
  },
  {
    slug: "speaking",
    path: "/speaking",
    label: "Speaking",
    navGroup: "primary",
    order: 2,
  },
  {
    slug: "services",
    path: "/services",
    label: "Services",
    navGroup: "primary",
    order: 3,
  },
  {
    slug: "press",
    path: "/press",
    label: "Press",
    navGroup: "primary",
    order: 4,
  },
  { slug: "nfts", path: "/nfts", label: "NFTs", navGroup: "primary", order: 5 },
  {
    slug: "weekly-podcast",
    path: "/weekly-podcast",
    label: "Weekly Podcast",
    navGroup: "primary",
    order: 6,
  },
  {
    slug: "contact",
    path: "/contact",
    label: "Contact",
    navGroup: "primary",
    order: 7,
  },
  {
    slug: "about",
    path: "/about",
    label: "About",
    navGroup: "primary",
    order: 8,
  },
  {
    slug: "portfolio-site",
    path: "https://phor.net",
    label: "Portfolio Site",
    navGroup: "primary",
    order: 9,
  },
  {
    slug: "terms-of-service",
    path: "/terms-of-service",
    label: "Terms of Service",
    navGroup: "legal",
    order: 10,
  },
  {
    slug: "privacy-policy",
    path: "/privacy-policy",
    label: "Privacy Policy",
    navGroup: "legal",
    order: 11,
  },
];
