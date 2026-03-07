export interface SeoBlock {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalPath?: string;
}

export type SchemaGraphNode = Record<string, unknown>;

export interface SchemaBreadcrumbItem {
  name: string;
  href: string;
}

export interface SchemaBlock {
  graph?: SchemaGraphNode[];
  breadcrumbItems?: SchemaBreadcrumbItem[];
}

export interface CtaBlock {
  label: string;
  href: string;
}

export interface HeroBlock {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  cta?: CtaBlock;
}
