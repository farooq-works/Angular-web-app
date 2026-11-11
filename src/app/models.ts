export interface ContentItem {
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  label?: string;
  value?: string;
  price?: string;
  href?: string;
  features?: string[];
  answer?: string;
  person?: string;
  role?: string;
  [key: string]: unknown;
}

export interface HeroSlide {
  badge: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  primary: string;
  secondary: string;
  stats: ContentItem[];
}

export interface SectionContent {
  items?: ContentItem[];
  slides?: HeroSlide[];
  paragraphs?: string[];
  tags?: string[];
  [key: string]: unknown;
}

export interface SiteSection {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  kind: string;
  content: SectionContent;
  sortOrder: number;
  published: boolean;
}
