/**
 * Extension Marketplace Types
 * Registry and marketplace system for extension discovery and installation
 */

import type { ExtensionManifest } from './extension';

export interface MarketplaceExtension {
  /** Extension manifest */
  manifest: ExtensionManifest;

  /** Marketplace metadata */
  metadata: {
    /** Total downloads */
    downloads: number;

    /** Average rating (0-5) */
    rating: number;

    /** Number of ratings */
    ratingCount: number;

    /** Last updated timestamp */
    lastUpdated: string;

    /** First published timestamp */
    publishedAt: string;

    /** Featured/promoted status */
    featured: boolean;

    /** Verified publisher */
    verified: boolean;
  };

  /** Download URL for .vsix package */
  downloadUrl: string;

  /** Extension README content (markdown) */
  readme?: string;

  /** Extension changelog */
  changelog?: string;

  /** Screenshots/media */
  media?: {
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }[];
}

export interface ExtensionReview {
  /** Review ID */
  id: string;

  /** Extension ID this review is for */
  extensionId: string;

  /** Reviewer username */
  username: string;

  /** Rating (1-5 stars) */
  rating: number;

  /** Review title */
  title?: string;

  /** Review content */
  content: string;

  /** Review timestamp */
  createdAt: string;

  /** Helpful votes count */
  helpfulCount: number;
}

export interface ExtensionSearchQuery {
  /** Search text (name, description, keywords) */
  query?: string;

  /** Filter by category */
  category?: string;

  /** Sort order */
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'recent' | 'name';

  /** Only show featured extensions */
  featuredOnly?: boolean;

  /** Only show verified publishers */
  verifiedOnly?: boolean;

  /** Pagination */
  page?: number;
  pageSize?: number;
}

export interface ExtensionSearchResult {
  /** Matching extensions */
  extensions: MarketplaceExtension[];

  /** Total results count */
  totalCount: number;

  /** Current page */
  page: number;

  /** Page size */
  pageSize: number;

  /** Has more pages */
  hasMore: boolean;
}

export interface ExtensionInstallation {
  /** Extension ID */
  extensionId: string;

  /** Installed version */
  version: string;

  /** Installation timestamp */
  installedAt: string;

  /** Installation source (marketplace, local, git) */
  source: 'marketplace' | 'local' | 'git';

  /** Auto-update enabled */
  autoUpdate: boolean;

  /** Installation status */
  status: 'installing' | 'installed' | 'updating' | 'failed';
}

export type MarketplaceEventType =
  | 'extensionInstalled'
  | 'extensionUninstalled'
  | 'extensionUpdated'
  | 'searchPerformed'
  | 'reviewSubmitted';

export interface MarketplaceEvent {
  type: MarketplaceEventType;
  extensionId?: string;
  timestamp: number;
  data?: any;
}

export type MarketplaceEventHandler = (event: MarketplaceEvent) => void;

/**
 * Extension categories (VS Code standard)
 */
export const EXTENSION_CATEGORIES = [
  'Programming Languages',
  'Snippets',
  'Linters',
  'Themes',
  'Debuggers',
  'Formatters',
  'Keymaps',
  'SCM Providers',
  'Other',
  'Extension Packs',
  'Language Packs',
  'Data Science',
  'Machine Learning',
  'Visualization',
  'Notebooks',
] as const;

export type ExtensionCategory = typeof EXTENSION_CATEGORIES[number];
