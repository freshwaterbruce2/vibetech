import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageToCodeService } from '../../services/ImageToCodeService';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('ImageToCodeService', () => {
  let service: ImageToCodeService;

  beforeEach(() => {
    service = new ImageToCodeService({
      provider: 'anthropic',
      model: 'claude-3-7-sonnet-20250219',
      apiKey: 'test-key',
    });
    vi.clearAllMocks();
  });

  describe('Image Loading', () => {
    it('should load image from file path', async () => {
      const result = await service.loadImage('/test/mockup.png');
      expect(result).toHaveProperty('base64');
      expect(result.mimeType).toBe('image/png');
    });

    it('should load image from URL', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
        headers: { get: () => 'image/png' },
      });
      const result = await service.loadImage('https://example.com/mockup.png');
      expect(result).toHaveProperty('base64');
    });
  });

  describe('Component Generation', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '{"code":"test","componentName":"Test","dependencies":[]}' }],
        }),
      });
    });

    it('should generate React component from image', async () => {
      const result = await service.generateComponent('/test/form.png');
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('componentName');
    });

    it('should use custom component name', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: '{"code":"test","componentName":"PrimaryButton","dependencies":[]}' }],
        }),
      });
      const result = await service.generateComponent('/test/button.png', { componentName: 'PrimaryButton' });
      expect(result.componentName).toBe('PrimaryButton');
    });

    it('should support TypeScript generation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: '{"code":"interface Props {}","componentName":"Card","dependencies":[]}' }],
        }),
      });
      const result = await service.generateComponent('/test/card.png', { typescript: true });
      expect(result.code).toContain('interface');
    });

    it('should support Tailwind CSS', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: '{"code":"<div className=\\"test\\">","componentName":"Hero","dependencies":["tailwindcss"]}' }],
        }),
      });
      const result = await service.generateComponent('/test/hero.png', { styling: 'tailwind' });
      expect(result.code).toContain('className');
      expect(result.dependencies).toContain('tailwindcss');
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '{"code":"cached","componentName":"Test","dependencies":[]}' }],
        }),
      });
    });

    it('should cache generated components', async () => {
      const result1 = await service.generateComponent('/test/cached.png');
      const result2 = await service.generateComponent('/test/cached.png');
      expect(result1.code).toBe(result2.code);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', () => {
      service.clearCache();
      expect(service.getCacheSize()).toBe(0);
    });
  });

  describe('Design System Analysis', () => {
    it('should analyze multiple screens', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: '{"commonComponents":["Button"],"colorPalette":["#fff"],"typography":{"fontFamilies":[],"sizes":[]},"spacing":{"scale":[]}}' }],
        }),
      });
      const result = await service.analyzeDesignSystem(['/test/login.png']);
      expect(result).toHaveProperty('commonComponents');
      expect(result.commonComponents).toContain('Button');
    });
  });
});
