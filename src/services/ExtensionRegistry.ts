import type {
  MarketplaceExtension,
  ExtensionSearchQuery,
  ExtensionSearchResult,
  ExtensionReview,
  ExtensionInstallation,
  MarketplaceEventType,
  MarketplaceEvent,
  MarketplaceEventHandler,
} from '../types/marketplace';

/**
 * ExtensionRegistry
 * Manages marketplace extensions, search, ratings, and installation tracking
 */
export class ExtensionRegistry {
  private extensions: Map<string, MarketplaceExtension> = new Map();
  private installations: Map<string, ExtensionInstallation> = new Map();
  private reviews: Map<string, ExtensionReview[]> = new Map();
  private eventHandlers: Map<MarketplaceEventType, Set<MarketplaceEventHandler>> = new Map();

  /**
   * Register or update a marketplace extension
   */
  register(extension: MarketplaceExtension): void {
    this.extensions.set(extension.manifest.id, extension);
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): MarketplaceExtension | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Search extensions
   */
  search(query: ExtensionSearchQuery): ExtensionSearchResult {
    let results = Array.from(this.extensions.values());

    // Filter by query text
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(
        (ext) =>
          ext.manifest.name.toLowerCase().includes(searchTerm) ||
          ext.manifest.description?.toLowerCase().includes(searchTerm) ||
          ext.manifest.keywords?.some((kw) => kw.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by category
    if (query.category) {
      results = results.filter((ext) => ext.manifest.categories?.includes(query.category!));
    }

    // Filter featured only
    if (query.featuredOnly) {
      results = results.filter((ext) => ext.metadata.featured);
    }

    // Filter verified only
    if (query.verifiedOnly) {
      results = results.filter((ext) => ext.metadata.verified);
    }

    // Sort results
    results = this.sortResults(results, query.sortBy || 'relevance');

    // Pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedResults = results.slice(startIndex, endIndex);

    this.emit('searchPerformed', { query, resultCount: results.length });

    return {
      extensions: paginatedResults,
      totalCount: results.length,
      page,
      pageSize,
      hasMore: endIndex < results.length,
    };
  }

  /**
   * Sort search results
   */
  private sortResults(
    results: MarketplaceExtension[],
    sortBy: 'relevance' | 'downloads' | 'rating' | 'recent' | 'name'
  ): MarketplaceExtension[] {
    switch (sortBy) {
      case 'downloads':
        return results.sort((a, b) => b.metadata.downloads - a.metadata.downloads);

      case 'rating':
        return results.sort((a, b) => b.metadata.rating - a.metadata.rating);

      case 'recent':
        return results.sort(
          (a, b) =>
            new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime()
        );

      case 'name':
        return results.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));

      case 'relevance':
      default:
        // For relevance, prioritize: featured > rating > downloads
        return results.sort((a, b) => {
          if (a.metadata.featured !== b.metadata.featured) {
            return a.metadata.featured ? -1 : 1;
          }
          if (Math.abs(a.metadata.rating - b.metadata.rating) > 0.5) {
            return b.metadata.rating - a.metadata.rating;
          }
          return b.metadata.downloads - a.metadata.downloads;
        });
    }
  }

  /**
   * Mark extension as installed
   */
  markAsInstalled(extensionId: string, version: string, source: 'marketplace' | 'local' | 'git' = 'marketplace'): void {
    const installation: ExtensionInstallation = {
      extensionId,
      version,
      installedAt: new Date().toISOString(),
      source,
      autoUpdate: true,
      status: 'installed',
    };

    this.installations.set(extensionId, installation);
    this.emit('extensionInstalled', { extensionId, version });
  }

  /**
   * Mark extension as uninstalled
   */
  markAsUninstalled(extensionId: string): void {
    this.installations.delete(extensionId);
    this.emit('extensionUninstalled', { extensionId });
  }

  /**
   * Check if extension is installed
   */
  isInstalled(extensionId: string): boolean {
    return this.installations.has(extensionId);
  }

  /**
   * Get installed version
   */
  getInstalledVersion(extensionId: string): string | undefined {
    return this.installations.get(extensionId)?.version;
  }

  /**
   * Get all installed extensions
   */
  getInstalledExtensions(): ExtensionInstallation[] {
    return Array.from(this.installations.values());
  }

  /**
   * Get available updates
   */
  getAvailableUpdates(): Array<{
    extensionId: string;
    currentVersion: string;
    availableVersion: string;
  }> {
    const updates: Array<{ extensionId: string; currentVersion: string; availableVersion: string }> = [];

    for (const [extensionId, installation] of this.installations) {
      const marketplaceExt = this.extensions.get(extensionId);
      if (marketplaceExt && marketplaceExt.manifest.version !== installation.version) {
        // Simple version comparison (in production, use semver)
        if (this.compareVersions(marketplaceExt.manifest.version, installation.version) > 0) {
          updates.push({
            extensionId,
            currentVersion: installation.version,
            availableVersion: marketplaceExt.manifest.version,
          });
        }
      }
    }

    return updates;
  }

  /**
   * Check if specific extension has update
   */
  hasUpdate(extensionId: string): boolean {
    const installation = this.installations.get(extensionId);
    if (!installation) return false;

    const marketplaceExt = this.extensions.get(extensionId);
    if (!marketplaceExt) return false;

    return this.compareVersions(marketplaceExt.manifest.version, installation.version) > 0;
  }

  /**
   * Simple version comparison (production should use semver library)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * Add a review
   */
  addReview(review: ExtensionReview): void {
    if (!this.reviews.has(review.extensionId)) {
      this.reviews.set(review.extensionId, []);
    }

    this.reviews.get(review.extensionId)!.push(review);
    this.emit('reviewSubmitted', { extensionId: review.extensionId, review });
  }

  /**
   * Get reviews for extension
   */
  getReviews(extensionId: string): ExtensionReview[] {
    return this.reviews.get(extensionId) || [];
  }

  /**
   * Calculate average rating from reviews
   */
  getAverageRating(extensionId: string): number {
    const reviews = this.reviews.get(extensionId);
    if (!reviews || reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  /**
   * Mark review as helpful
   */
  markReviewHelpful(reviewId: string): void {
    for (const reviews of this.reviews.values()) {
      const review = reviews.find((r) => r.id === reviewId);
      if (review) {
        review.helpfulCount++;
        return;
      }
    }
  }

  /**
   * Get featured extensions
   */
  getFeaturedExtensions(): MarketplaceExtension[] {
    return Array.from(this.extensions.values()).filter((ext) => ext.metadata.featured);
  }

  /**
   * Get popular extensions (by downloads)
   */
  getPopularExtensions(limit: number = 10): MarketplaceExtension[] {
    return Array.from(this.extensions.values())
      .sort((a, b) => b.metadata.downloads - a.metadata.downloads)
      .slice(0, limit);
  }

  /**
   * Get recently updated extensions
   */
  getRecentlyUpdated(limit: number = 10): MarketplaceExtension[] {
    return Array.from(this.extensions.values())
      .sort(
        (a, b) =>
          new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Get top rated extensions
   */
  getTopRated(limit: number = 10): MarketplaceExtension[] {
    return Array.from(this.extensions.values())
      .filter((ext) => ext.metadata.ratingCount >= 10) // Minimum ratings threshold
      .sort((a, b) => b.metadata.rating - a.metadata.rating)
      .slice(0, limit);
  }

  /**
   * Register event handler
   */
  on(event: MarketplaceEventType, handler: MarketplaceEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister event handler
   */
  off(event: MarketplaceEventType, handler: MarketplaceEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to all registered handlers
   */
  private emit(type: MarketplaceEventType, data: any): void {
    const event: MarketplaceEvent = {
      type,
      extensionId: data.extensionId,
      timestamp: Date.now(),
      data,
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.extensions.clear();
    this.installations.clear();
    this.reviews.clear();
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): MarketplaceExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extension count
   */
  getExtensionCount(): number {
    return this.extensions.size;
  }

  /**
   * Get total downloads across all extensions
   */
  getTotalDownloads(): number {
    return Array.from(this.extensions.values()).reduce(
      (total, ext) => total + ext.metadata.downloads,
      0
    );
  }
}
