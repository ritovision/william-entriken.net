export interface SeoBlock {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalPath?: string;
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
