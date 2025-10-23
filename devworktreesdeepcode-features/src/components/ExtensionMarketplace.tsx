import React, { useState, useEffect } from 'react';
import { ExtensionRegistry } from '../services/ExtensionRegistry';
import type { MarketplaceExtension, ExtensionSearchQuery } from '../types/marketplace';
import { EXTENSION_CATEGORIES } from '../types/marketplace';

interface ExtensionMarketplaceProps {
  registry: ExtensionRegistry;
  onInstall?: (extensionId: string) => Promise<void>;
  onUninstall?: (extensionId: string) => Promise<void>;
}

export const ExtensionMarketplace: React.FC<ExtensionMarketplaceProps> = ({
  registry,
  onInstall,
  onUninstall,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'downloads' | 'rating' | 'recent' | 'name'>('relevance');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [extensions, setExtensions] = useState<MarketplaceExtension[]>([]);
  const [selectedExtension, setSelectedExtension] = useState<MarketplaceExtension | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'installed' | 'updates'>('browse');
  const [installing, setInstalling] = useState<Set<string>>(new Set());

  useEffect(() => {
    performSearch();
  }, [searchQuery, selectedCategory, sortBy, featuredOnly]);

  const performSearch = () => {
    const query: ExtensionSearchQuery = {
      query: searchQuery || undefined,
      category: selectedCategory || undefined,
      sortBy,
      featuredOnly,
      page: 1,
      pageSize: 50,
    };

    const result = registry.search(query);
    setExtensions(result.extensions);
  };

  const handleInstall = async (extensionId: string) => {
    if (!onInstall) return;

    setInstalling(new Set(installing).add(extensionId));

    try {
      await onInstall(extensionId);
    } finally {
      const newInstalling = new Set(installing);
      newInstalling.delete(extensionId);
      setInstalling(newInstalling);
      performSearch(); // Refresh to update install status
    }
  };

  const handleUninstall = async (extensionId: string) => {
    if (!onUninstall) return;

    try {
      await onUninstall(extensionId);
      performSearch(); // Refresh
    } catch (error) {
      console.error('Uninstall failed:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= Math.round(rating) ? 'text-yellow-500' : 'text-gray-300'}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderExtensionCard = (ext: MarketplaceExtension) => {
    const isInstalled = registry.isInstalled(ext.manifest.id);
    const hasUpdate = registry.hasUpdate(ext.manifest.id);
    const isInstalling = installing.has(ext.manifest.id);

    return (
      <div
        key={ext.manifest.id}
        className="extension-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setSelectedExtension(ext)}
      >
        <div className="flex items-start gap-3">
          {ext.manifest.icon && (
            <img src={ext.manifest.icon} alt="" className="w-12 h-12 rounded" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{ext.manifest.name}</h3>
              {ext.metadata.verified && (
                <span className="text-blue-500 text-xs" title="Verified Publisher">
                  ✓
                </span>
              )}
              {ext.metadata.featured && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                  Featured
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {ext.manifest.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {renderStars(ext.metadata.rating)}
                <span className="ml-1">({ext.metadata.ratingCount})</span>
              </span>
              <span>{formatDownloads(ext.metadata.downloads)} downloads</span>
              <span>v{ext.manifest.version}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isInstalled ? (
              <>
                {hasUpdate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstall(ext.manifest.id);
                    }}
                    disabled={isInstalling}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Update
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUninstall(ext.manifest.id);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Uninstall
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstall(ext.manifest.id);
                }}
                disabled={isInstalling}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedExtension) return null;

    const isInstalled = registry.isInstalled(selectedExtension.manifest.id);
    const reviews = registry.getReviews(selectedExtension.manifest.id);

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedExtension(null)}
      >
        <div
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              {selectedExtension.manifest.icon && (
                <img src={selectedExtension.manifest.icon} alt="" className="w-16 h-16 rounded" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{selectedExtension.manifest.name}</h2>
                  {selectedExtension.metadata.verified && (
                    <span className="text-blue-500" title="Verified Publisher">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{selectedExtension.manifest.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>by {selectedExtension.manifest.publisher}</span>
                  <span>v{selectedExtension.manifest.version}</span>
                  <span>{formatDownloads(selectedExtension.metadata.downloads)} downloads</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedExtension(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{renderStars(selectedExtension.metadata.rating)}</span>
                <span className="text-lg font-semibold">{selectedExtension.metadata.rating.toFixed(1)}</span>
                <span className="text-gray-500">({selectedExtension.metadata.ratingCount} ratings)</span>
              </div>
            </div>

            {/* Install Button */}
            <div className="mb-6">
              {isInstalled ? (
                <button
                  onClick={() => handleUninstall(selectedExtension.manifest.id)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Uninstall
                </button>
              ) : (
                <button
                  onClick={() => handleInstall(selectedExtension.manifest.id)}
                  disabled={installing.has(selectedExtension.manifest.id)}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {installing.has(selectedExtension.manifest.id) ? 'Installing...' : 'Install'}
                </button>
              )}
            </div>

            {/* README */}
            {selectedExtension.readme && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Overview</h3>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{selectedExtension.readme}</pre>
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Reviews</h3>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{renderStars(review.rating)}</span>
                        <span className="font-semibold">{review.username}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && <p className="font-medium mb-1">{review.title}</p>}
                      <p className="text-sm text-gray-700">{review.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="extension-marketplace h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold mb-4">Extension Marketplace</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded ${
              activeTab === 'installed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Installed ({registry.getInstalledExtensions().length})
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2 rounded ${
              activeTab === 'updates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Updates ({registry.getAvailableUpdates().length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {EXTENSION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="downloads">Most Downloads</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Recently Updated</option>
            <option value="name">Name (A-Z)</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Featured only</span>
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {extensions.map((ext) => renderExtensionCard(ext))}
        </div>

        {extensions.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">No extensions found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
};
