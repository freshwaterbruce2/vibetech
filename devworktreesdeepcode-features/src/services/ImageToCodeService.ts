export interface ImageToCodeConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey: string;
  cacheTTL?: number;
}

export interface ImageData {
  base64: string;
  mimeType: string;
  url?: string;
}

export interface GeneratedComponent {
  code: string;
  componentName: string;
  dependencies: string[];
  metadata?: {
    responsive?: boolean;
    accessibility?: boolean;
    colors?: string[];
    suggestedComponents?: string[];
  };
}

export interface ComponentGenerationOptions {
  componentName?: string;
  typescript?: boolean;
  styling?: 'tailwind' | 'styled-components' | 'css-modules';
}

export interface DesignSystemAnalysis {
  commonComponents: string[];
  colorPalette: string[];
  typography: { fontFamilies: string[]; sizes: number[] };
  spacing: { scale: number[] };
}

export class ImageToCodeService {
  private config: ImageToCodeConfig;
  private cache: Map<string, GeneratedComponent>;
  private cacheExpiry: Map<string, number>;

  constructor(config: ImageToCodeConfig) {
    this.config = config;
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  async loadImage(pathOrUrl: string): Promise<ImageData> {
    if (pathOrUrl.startsWith('http')) {
      const response = await fetch(pathOrUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      return { base64, mimeType, url: pathOrUrl };
    }

    const fs = await import('fs/promises');
    const content = await fs.readFile(pathOrUrl);
    const base64 = content.toString('base64');
    const ext = pathOrUrl.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = this.getMimeType(ext);
    return { base64, mimeType };
  }

  async generateComponent(
    imagePath: string,
    options: ComponentGenerationOptions = {}
  ): Promise<GeneratedComponent> {
    const cacheKey = `${imagePath}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);
    const ttl = this.config.cacheTTL || 3600000;

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    const imageData = await this.loadImage(imagePath);
    const result = await this.callVisionAPI(imageData, options);

    this.cache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + ttl);

    return result;
  }

  async analyzeDesignSystem(imagePaths: string[]): Promise<DesignSystemAnalysis> {
    const images = await Promise.all(imagePaths.map((path) => this.loadImage(path)));
    const prompt = `Analyze UI screens and extract common components, color palette, typography, and spacing. Return JSON.`;
    const response = await this.callVisionAPIMultiple(images, prompt);

    return {
      commonComponents: response.commonComponents || [],
      colorPalette: response.colorPalette || [],
      typography: response.typography || { fontFamilies: [], sizes: [] },
      spacing: response.spacing || { scale: [] },
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  private async callVisionAPI(
    imageData: ImageData,
    options: ComponentGenerationOptions
  ): Promise<GeneratedComponent> {
    const systemPrompt = `You're an expert React developer. Convert UI mockups to production-ready React components using ${options.styling || 'tailwind'}.`;
    const userPrompt = `Convert this UI to a React component${options.componentName ? ` named "${options.componentName}"` : ''}. Return JSON with code, componentName, dependencies, and metadata.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: imageData.mimeType, data: imageData.base64 } },
              { type: 'text', text: userPrompt },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { code: '', componentName: 'Component', dependencies: [] };
  }

  private async callVisionAPIMultiple(images: ImageData[], prompt: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              ...images.map((img) => ({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.base64 } })),
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[ext] || 'image/png';
  }
}
