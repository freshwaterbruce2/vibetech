
export interface AffiliateRecommendation {
  name: string;
  url: string;
  description: string;
  category: string;
  commission?: string;
  isPrimary?: boolean; // Featured affiliate link
  placement: 'sidebar' | 'inline' | 'footer'; // Where to display in post
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
  content?: string; // Full blog post content
  author?: string;
  slug?: string; // URL-friendly version of title
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  affiliateRecommendations?: AffiliateRecommendation[];
  relatedProducts?: string[]; // Product categories for automatic affiliate matching
  focusKeyword?: string; // Primary SEO keyword
  canonicalUrl?: string; // Canonical URL for duplicate content prevention
  noIndex?: boolean; // Prevent search engine indexing
  noFollow?: boolean; // No follow links directive
}

export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  color: string;
  count: number;
}
