export interface SeoBlock {
  title: string;
  description: string;
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
