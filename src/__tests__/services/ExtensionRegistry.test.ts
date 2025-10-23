import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExtensionRegistry } from '../../services/ExtensionRegistry';
import type { MarketplaceExtension, ExtensionSearchQuery } from '../../types/marketplace';

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry();
    vi.clearAllMocks();
  });

  describe('Extension Registration', () => {
    it('should register a marketplace extension', () => {
      const extension: MarketplaceExtension = {
        manifest: {
          id: 'test.extension',
          name: 'Test Extension',
          version: '1.0.0',
          publisher: 'test',
          main: './index.js',
        },
        metadata: {
          downloads: 1000,
          rating: 4.5,
          ratingCount: 50,
          lastUpdated: '2025-01-01',
          publishedAt: '2024-01-01',
          featured: false,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/test.extension.vsix',
      };

      registry.register(extension);

      const found = registry.getExtension('test.extension');
      expect(found).toBeDefined();
      expect(found?.manifest.name).toBe('Test Extension');
    });

    it('should update existing extension on re-registration', () => {
      const v1: MarketplaceExtension = {
        manifest: {
          id: 'test.ext',
          name: 'Test',
          version: '1.0.0',
          publisher: 'test',
          main: './index.js',
        },
        metadata: {
          downloads: 100,
          rating: 4.0,
          ratingCount: 10,
          lastUpdated: '2025-01-01',
          publishedAt: '2024-01-01',
          featured: false,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/test.vsix',
      };

      const v2: MarketplaceExtension = {
        ...v1,
        manifest: { ...v1.manifest, version: '2.0.0' },
        metadata: { ...v1.metadata, downloads: 200 },
      };

      registry.register(v1);
      registry.register(v2);

      const found = registry.getExtension('test.ext');
      expect(found?.manifest.version).toBe('2.0.0');
      expect(found?.metadata.downloads).toBe(200);
    });
  });

  describe('Extension Search', () => {
    beforeEach(() => {
      // Register sample extensions
      registry.register({
        manifest: {
          id: 'react.tools',
          name: 'React Tools',
          version: '1.0.0',
          publisher: 'facebook',
          main: './index.js',
          description: 'React development tools',
          keywords: ['react', 'jsx', 'components'],
          categories: ['Programming Languages'],
        },
        metadata: {
          downloads: 50000,
          rating: 4.8,
          ratingCount: 500,
          lastUpdated: '2025-01-15',
          publishedAt: '2023-01-01',
          featured: true,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/react.tools.vsix',
      });

      registry.register({
        manifest: {
          id: 'python.linter',
          name: 'Python Linter',
          version: '2.0.0',
          publisher: 'python',
          main: './index.js',
          description: 'Python code linting',
          keywords: ['python', 'lint', 'quality'],
          categories: ['Linters'],
        },
        metadata: {
          downloads: 10000,
          rating: 4.2,
          ratingCount: 100,
          lastUpdated: '2025-01-10',
          publishedAt: '2024-06-01',
          featured: false,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/python.linter.vsix',
      });
    });

    it('should search extensions by query text', () => {
      const query: ExtensionSearchQuery = { query: 'react' };
      const result = registry.search(query);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].manifest.id).toBe('react.tools');
    });

    it('should filter by category', () => {
      const query: ExtensionSearchQuery = { category: 'Linters' };
      const result = registry.search(query);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].manifest.id).toBe('python.linter');
    });

    it('should sort by downloads', () => {
      const query: ExtensionSearchQuery = { sortBy: 'downloads' };
      const result = registry.search(query);

      expect(result.extensions[0].manifest.id).toBe('react.tools'); // 50000 downloads
      expect(result.extensions[1].manifest.id).toBe('python.linter'); // 10000 downloads
    });

    it('should sort by rating', () => {
      const query: ExtensionSearchQuery = { sortBy: 'rating' };
      const result = registry.search(query);

      expect(result.extensions[0].metadata.rating).toBe(4.8);
      expect(result.extensions[1].metadata.rating).toBe(4.2);
    });

    it('should filter featured extensions only', () => {
      const query: ExtensionSearchQuery = { featuredOnly: true };
      const result = registry.search(query);

      expect(result.extensions).toHaveLength(1);
      expect(result.extensions[0].manifest.id).toBe('react.tools');
    });

    it('should paginate results', () => {
      const query: ExtensionSearchQuery = { page: 1, pageSize: 1 };
      const result = registry.search(query);

      expect(result.extensions).toHaveLength(1);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('Extension Installation Tracking', () => {
    it('should track installed extensions', () => {
      registry.markAsInstalled('test.extension', '1.0.0');

      expect(registry.isInstalled('test.extension')).toBe(true);
    });

    it('should get installed version', () => {
      registry.markAsInstalled('test.extension', '1.0.0');

      const version = registry.getInstalledVersion('test.extension');
      expect(version).toBe('1.0.0');
    });

    it('should list all installed extensions', () => {
      registry.markAsInstalled('ext1', '1.0.0');
      registry.markAsInstalled('ext2', '2.0.0');

      const installed = registry.getInstalledExtensions();
      expect(installed).toHaveLength(2);
    });

    it('should mark extension as uninstalled', () => {
      registry.markAsInstalled('test.ext', '1.0.0');
      registry.markAsUninstalled('test.ext');

      expect(registry.isInstalled('test.ext')).toBe(false);
    });
  });

  describe('Extension Updates', () => {
    beforeEach(() => {
      registry.register({
        manifest: {
          id: 'test.ext',
          name: 'Test',
          version: '2.0.0',
          publisher: 'test',
          main: './index.js',
        },
        metadata: {
          downloads: 100,
          rating: 4.0,
          ratingCount: 10,
          lastUpdated: '2025-01-15',
          publishedAt: '2024-01-01',
          featured: false,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/test.vsix',
      });

      registry.markAsInstalled('test.ext', '1.0.0');
    });

    it('should detect available updates', () => {
      const updates = registry.getAvailableUpdates();

      expect(updates).toHaveLength(1);
      expect(updates[0].extensionId).toBe('test.ext');
      expect(updates[0].currentVersion).toBe('1.0.0');
      expect(updates[0].availableVersion).toBe('2.0.0');
    });

    it('should check if specific extension has update', () => {
      const hasUpdate = registry.hasUpdate('test.ext');
      expect(hasUpdate).toBe(true);
    });

    it('should not show update if versions match', () => {
      registry.markAsInstalled('test.ext', '2.0.0');

      const hasUpdate = registry.hasUpdate('test.ext');
      expect(hasUpdate).toBe(false);
    });
  });

  describe('Extension Reviews', () => {
    it('should add a review', () => {
      registry.addReview({
        id: 'review-1',
        extensionId: 'test.ext',
        username: 'user123',
        rating: 5,
        title: 'Great extension!',
        content: 'Works perfectly',
        createdAt: '2025-01-15',
        helpfulCount: 0,
      });

      const reviews = registry.getReviews('test.ext');
      expect(reviews).toHaveLength(1);
      expect(reviews[0].rating).toBe(5);
    });

    it('should calculate average rating from reviews', () => {
      registry.addReview({
        id: 'r1',
        extensionId: 'test.ext',
        username: 'user1',
        rating: 5,
        content: 'Great',
        createdAt: '2025-01-15',
        helpfulCount: 0,
      });

      registry.addReview({
        id: 'r2',
        extensionId: 'test.ext',
        username: 'user2',
        rating: 3,
        content: 'Good',
        createdAt: '2025-01-15',
        helpfulCount: 0,
      });

      const avgRating = registry.getAverageRating('test.ext');
      expect(avgRating).toBe(4.0);
    });

    it('should mark review as helpful', () => {
      registry.addReview({
        id: 'review-1',
        extensionId: 'test.ext',
        username: 'user',
        rating: 5,
        content: 'Great',
        createdAt: '2025-01-15',
        helpfulCount: 0,
      });

      registry.markReviewHelpful('review-1');

      const reviews = registry.getReviews('test.ext');
      expect(reviews[0].helpfulCount).toBe(1);
    });
  });

  describe('Marketplace Events', () => {
    it('should emit event when extension is installed', () => {
      const handler = vi.fn();
      registry.on('extensionInstalled', handler);

      registry.markAsInstalled('test.ext', '1.0.0');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'extensionInstalled',
          extensionId: 'test.ext',
        })
      );
    });

    it('should emit event when review is submitted', () => {
      const handler = vi.fn();
      registry.on('reviewSubmitted', handler);

      registry.addReview({
        id: 'r1',
        extensionId: 'test.ext',
        username: 'user',
        rating: 5,
        content: 'Great',
        createdAt: '2025-01-15',
        helpfulCount: 0,
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reviewSubmitted',
          extensionId: 'test.ext',
        })
      );
    });
  });

  describe('Featured Extensions', () => {
    it('should get featured extensions', () => {
      registry.register({
        manifest: {
          id: 'featured.ext',
          name: 'Featured',
          version: '1.0.0',
          publisher: 'test',
          main: './index.js',
        },
        metadata: {
          downloads: 1000,
          rating: 4.5,
          ratingCount: 50,
          lastUpdated: '2025-01-15',
          publishedAt: '2024-01-01',
          featured: true,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/featured.vsix',
      });

      const featured = registry.getFeaturedExtensions();
      expect(featured).toHaveLength(1);
      expect(featured[0].manifest.id).toBe('featured.ext');
    });

    it('should get popular extensions (by downloads)', () => {
      registry.register({
        manifest: {
          id: 'popular.ext',
          name: 'Popular',
          version: '1.0.0',
          publisher: 'test',
          main: './index.js',
        },
        metadata: {
          downloads: 100000,
          rating: 4.5,
          ratingCount: 1000,
          lastUpdated: '2025-01-15',
          publishedAt: '2024-01-01',
          featured: false,
          verified: true,
        },
        downloadUrl: 'https://marketplace.com/popular.vsix',
      });

      const popular = registry.getPopularExtensions(5);
      expect(popular[0].manifest.id).toBe('popular.ext');
    });
  });
});
