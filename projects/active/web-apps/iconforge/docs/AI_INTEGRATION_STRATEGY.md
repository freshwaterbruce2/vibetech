# AI Integration Strategy for IconForge

> **Last Updated**: October 2025
> **Purpose**: Complete strategy for AI-powered icon generation
> **Phased Approach**: DALL-E 3 (MVP) → Stable Diffusion (Enterprise)

---

## Table of Contents

1. [Strategy Overview](#strategy-overview)
2. [Phase 1-3: DALL-E 3 (MVP)](#phase-1-3-dall-e-3-mvp)
3. [Phase 4+: Stable Diffusion (Enterprise)](#phase-4-stable-diffusion-enterprise)
4. [Cost Analysis](#cost-analysis)
5. [Implementation Guide](#implementation-guide)
6. [Prompt Engineering](#prompt-engineering)
7. [Post-Processing Pipeline](#post-processing-pipeline)
8. [Caching Strategy](#caching-strategy)
9. [Rate Limiting](#rate-limiting)
10. [Monitoring & Analytics](#monitoring--analytics)

---

## Strategy Overview

### Phased AI Approach

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1-3 (Months 1-9)                                      │
│ ─────────────────────────────────────────────────────────   │
│ DALL-E 3 Only                                               │
│ • Fast generation (8-10s)                                   │
│ • Simple API integration                                    │
│ • Clear commercial licensing                                │
│ • Target: All users (Free/Pro/Team)                        │
│ • Cost: $0.04 per icon                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 4+ (Month 10+)                                        │
│ ─────────────────────────────────────────────────────────   │
│ DALL-E 3 + Stable Diffusion                                 │
│ • DALL-E 3: Fast generation for all tiers                   │
│ • Stable Diffusion: Custom models for Enterprise           │
│ • Self-hosted SD for cost savings                           │
│ • Custom training for brand-specific icons                  │
│ • Target: Enterprise tier ($299+/month)                    │
└─────────────────────────────────────────────────────────────┘
```

### Decision Matrix

| Feature | DALL-E 3 | Stable Diffusion |
|---------|----------|------------------|
| **Speed** | 8-10s | 15-30s |
| **Quality (Icons)** | Excellent | Very Good |
| **Prompt Adherence** | Excellent | Good |
| **Cost per Image** | $0.04 | $0.01 (self-hosted) |
| **Setup Complexity** | Low | High |
| **Customization** | None | Full (LoRA, fine-tuning) |
| **Commercial Rights** | Clear | Depends on model |
| **Maintenance** | None | Medium-High |
| **Best For** | MVP, standard icons | Enterprise, custom brands |

---

## Phase 1-3: DALL-E 3 (MVP)

### Why DALL-E 3 First

✅ **Speed**: 3-4x faster than Stable Diffusion
✅ **Prompt Adherence**: Better understanding of icon requirements
✅ **Simplicity**: Single API call, no infrastructure
✅ **Commercial Rights**: Clear licensing, legal indemnification
✅ **Quality**: Excellent for clean, simple icon styles
✅ **Iteration Speed**: Fast MVP development

### Implementation

#### 1. OpenAI Service

```typescript
// src/services/ai/openai.service.ts
import OpenAI from 'openai';
import { env } from '../../config/env';
import { db } from '../../lib/db';

interface GenerateIconOptions {
  prompt: string;
  style: 'line' | 'filled' | 'duo-tone' | 'flat' | '3d';
  colorScheme?: {
    primary: string;
    secondary?: string;
  };
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

export class OpenAIService {
  private openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  async generateIcon(options: GenerateIconOptions, userId: string): Promise<{
    url: string;
    revisedPrompt: string;
    cost: number;
  }> {
    const enhancedPrompt = this.buildPrompt(options);

    const startTime = Date.now();

    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: 'natural', // or 'vivid' for more dramatic
        response_format: 'url'
      });

      const duration = Date.now() - startTime;
      const cost = this.calculateCost(options);

      // Log generation
      await this.logGeneration({
        userId,
        prompt: options.prompt,
        enhancedPrompt,
        revisedPrompt: response.data[0].revised_prompt || '',
        imageUrl: response.data[0].url || '',
        model: 'dall-e-3',
        cost,
        duration,
        style: options.style
      });

      return {
        url: response.data[0].url || '',
        revisedPrompt: response.data[0].revised_prompt || '',
        cost
      };
    } catch (error) {
      console.error('DALL-E 3 generation failed:', error);
      throw new Error('AI generation failed');
    }
  }

  private buildPrompt(options: GenerateIconOptions): string {
    const styleDescriptions = {
      line: 'minimalist line art style, single stroke weight, monochrome',
      filled: 'solid filled shapes, flat design, no outlines',
      'duo-tone': 'two-color design, bold shapes',
      flat: 'flat design, simple shapes, minimal detail',
      '3d': 'subtle 3D effect, depth and shadows, modern'
    };

    const colorInstruction = options.colorScheme
      ? `Use ${options.colorScheme.primary} as primary color${options.colorScheme.secondary ? ` and ${options.colorScheme.secondary} as secondary color` : ''}.`
      : 'Use a cohesive color scheme.';

    return `
Create a professional UI icon for: ${options.prompt}

Style: ${styleDescriptions[options.style]}
${colorInstruction}

Requirements:
- Simple, clean, and recognizable at small sizes (16x16 to 512x512)
- Centered composition with balanced whitespace
- Suitable for web and mobile applications
- Transparent or solid color background
- Crisp edges, no blur
- Professional and modern aesthetic
`.trim();
  }

  private calculateCost(options: GenerateIconOptions): number {
    const pricing = {
      'standard': {
        '1024x1024': 0.040,
        '1024x1792': 0.080,
        '1792x1024': 0.080
      },
      'hd': {
        '1024x1024': 0.080,
        '1024x1792': 0.120,
        '1792x1024': 0.120
      }
    };

    const quality = options.quality || 'standard';
    const size = options.size || '1024x1024';

    return pricing[quality][size];
  }

  private async logGeneration(data: {
    userId: string;
    prompt: string;
    enhancedPrompt: string;
    revisedPrompt: string;
    imageUrl: string;
    model: string;
    cost: number;
    duration: number;
    style: string;
  }) {
    await db.aiGeneration.create({
      data: {
        userId: data.userId,
        prompt: data.prompt,
        style: data.style,
        model: data.model,
        imageUrl: data.imageUrl,
        cost: data.cost,
        metadata: {
          enhancedPrompt: data.enhancedPrompt,
          revisedPrompt: data.revisedPrompt,
          duration: data.duration
        }
      }
    });
  }
}
```

#### 2. API Route

```typescript
// src/routes/ai.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { OpenAIService } from '../services/ai/openai.service';
import { aiQueue } from '../lib/queue';

const GenerateRequestSchema = Type.Object({
  prompt: Type.String({ minLength: 3, maxLength: 1000 }),
  style: Type.Union([
    Type.Literal('line'),
    Type.Literal('filled'),
    Type.Literal('duo-tone'),
    Type.Literal('flat'),
    Type.Literal('3d')
  ]),
  colorScheme: Type.Optional(Type.Object({
    primary: Type.String(),
    secondary: Type.Optional(Type.String())
  })),
  size: Type.Optional(Type.Union([
    Type.Literal('1024x1024'),
    Type.Literal('1024x1792'),
    Type.Literal('1792x1024')
  ])),
  quality: Type.Optional(Type.Union([
    Type.Literal('standard'),
    Type.Literal('hd')
  ]))
});

export default async function aiRoutes(app: FastifyInstance) {
  const aiService = new OpenAIService();

  // Synchronous generation (for testing)
  app.post('/generate', {
    schema: {
      body: GenerateRequestSchema,
      response: {
        200: Type.Object({
          url: Type.String(),
          revisedPrompt: Type.String(),
          cost: Type.Number()
        })
      }
    },
    preHandler: [
      app.clerkAuth,
      async (request, reply) => {
        // Check user's plan and limits
        const user = await db.user.findUnique({
          where: { id: request.auth.userId }
        });

        if (!user) {
          reply.code(401).send({ error: 'User not found' });
          return;
        }

        // Check monthly limit
        const thisMonth = new Date();
        thisMonth.setDate(1);

        const generationCount = await db.aiGeneration.count({
          where: {
            userId: user.id,
            createdAt: { gte: thisMonth }
          }
        });

        const limits = {
          free: 10,
          pro: 100,
          team: 500,
          enterprise: -1 // unlimited
        };

        const userLimit = limits[user.plan as keyof typeof limits] || 0;

        if (userLimit !== -1 && generationCount >= userLimit) {
          reply.code(429).send({
            error: 'Monthly AI generation limit reached',
            limit: userLimit,
            used: generationCount
          });
          return;
        }
      }
    ]
  }, async (request, reply) => {
    const userId = request.auth.userId;
    const result = await aiService.generateIcon(request.body, userId);
    return result;
  });

  // Async generation with queue
  app.post('/generate-async', {
    schema: {
      body: GenerateRequestSchema,
      response: {
        202: Type.Object({
          jobId: Type.String(),
          status: Type.String()
        })
      }
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const userId = request.auth.userId;

    const job = await aiQueue.add('generate-icon', {
      ...request.body,
      userId
    });

    reply.code(202);
    return {
      jobId: job.id,
      status: 'queued'
    };
  });

  // Check job status
  app.get('/status/:jobId', {
    schema: {
      params: Type.Object({
        jobId: Type.String()
      })
    },
    preHandler: app.clerkAuth
  }, async (request, reply) => {
    const { jobId } = request.params;
    const job = await aiQueue.getJob(jobId);

    if (!job) {
      reply.code(404).send({ error: 'Job not found' });
      return;
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === 'completed') {
      return {
        status: 'completed',
        result: job.returnvalue
      };
    } else if (state === 'failed') {
      return {
        status: 'failed',
        error: job.failedReason
      };
    } else {
      return {
        status: state,
        progress
      };
    }
  });
}
```

#### 3. Variations Generator

```typescript
// Generate multiple variations
async generateVariations(
  basePrompt: string,
  style: string,
  count: number = 4
): Promise<string[]> {
  const variations = [
    'slightly more detailed',
    'simpler and more minimal',
    'bolder and more striking',
    'softer and more subtle'
  ];

  const promises = variations.slice(0, count).map((variation, index) => {
    const enhancedPrompt = `${basePrompt}. Variation ${index + 1}: ${variation}`;
    return this.generateIcon({
      prompt: enhancedPrompt,
      style: style as any,
      quality: 'standard'
    }, userId);
  });

  const results = await Promise.all(promises);
  return results.map(r => r.url);
}
```

---

## Phase 4+: Stable Diffusion (Enterprise)

### Why Add Stable Diffusion

✅ **Custom Training**: Fine-tune for brand-specific icon sets
✅ **Cost Savings**: $0.01/icon vs $0.04 (at scale)
✅ **Full Control**: Self-hosted, no API dependencies
✅ **Enterprise Appeal**: White-label capability
✅ **Competitive Advantage**: Unique custom models

### Infrastructure Requirements

```yaml
# docker-compose.yml
version: '3.8'

services:
  stable-diffusion:
    image: stabilityai/stable-diffusion:latest
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    ports:
      - "7860:7860"
    environment:
      - CUDA_VISIBLE_DEVICES=0
    volumes:
      - ./models:/models
      - ./outputs:/outputs
```

### Implementation

#### 1. Stable Diffusion Service

```typescript
// src/services/ai/stablediffusion.service.ts
import axios from 'axios';
import sharp from 'sharp';

interface SDGenerateOptions {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  steps?: number;
  cfgScale?: number;
  width?: number;
  height?: number;
  seed?: number;
}

export class StableDiffusionService {
  private apiUrl = env.SD_API_URL || 'http://localhost:7860';

  async generateIcon(options: SDGenerateOptions): Promise<{
    url: string;
    seed: number;
  }> {
    const payload = {
      prompt: this.enhancePrompt(options.prompt),
      negative_prompt: options.negativePrompt || this.defaultNegativePrompt(),
      steps: options.steps || 30,
      cfg_scale: options.cfgScale || 7.5,
      width: options.width || 512,
      height: options.height || 512,
      seed: options.seed || -1,
      sampler_name: 'DPM++ 2M Karras',
      model: options.model || 'icon-xl-v1.0',
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/sdapi/v1/txt2img`,
        payload,
        { timeout: 120000 } // 2 min timeout
      );

      const imageBase64 = response.data.images[0];
      const seed = response.data.info.seed;

      // Upload to storage
      const buffer = Buffer.from(imageBase64, 'base64');
      const url = await this.uploadImage(buffer);

      return { url, seed };
    } catch (error) {
      console.error('Stable Diffusion generation failed:', error);
      throw new Error('SD generation failed');
    }
  }

  private enhancePrompt(prompt: string): string {
    return `${prompt}, professional icon, vector style, clean design, white background, trending on dribbble, high quality, masterpiece`;
  }

  private defaultNegativePrompt(): string {
    return 'blurry, low quality, distorted, ugly, bad anatomy, watermark, text, signature, jpeg artifacts';
  }

  private async uploadImage(buffer: Buffer): Promise<string> {
    // Optimize with Sharp
    const optimized = await sharp(buffer)
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();

    // Upload to Supabase
    // ... implementation
    return 'url';
  }

  // Custom model training (LoRA)
  async trainCustomModel(
    userId: string,
    projectId: string,
    trainingImages: string[]
  ): Promise<string> {
    // 1. Download training images
    // 2. Prepare dataset
    // 3. Start training job
    // 4. Monitor progress
    // 5. Save model

    const modelId = `custom-${projectId}-${Date.now()}`;

    // Queue training job
    await db.customModel.create({
      data: {
        userId,
        projectId,
        modelId,
        status: 'training',
        trainingImages: trainingImages.length
      }
    });

    return modelId;
  }
}
```

#### 2. Hybrid Approach

```typescript
// src/services/ai/ai.service.ts
import { OpenAIService } from './openai.service';
import { StableDiffusionService } from './stablediffusion.service';

export class AIService {
  private openai = new OpenAIService();
  private sd = new StableDiffusionService();

  async generateIcon(
    options: any,
    userId: string,
    tier: 'free' | 'pro' | 'team' | 'enterprise'
  ) {
    // Enterprise users with custom models use SD
    if (tier === 'enterprise') {
      const customModel = await this.getCustomModel(userId);

      if (customModel) {
        return this.sd.generateIcon({
          ...options,
          model: customModel.modelId
        });
      }
    }

    // Everyone else uses DALL-E 3
    return this.openai.generateIcon(options, userId);
  }

  private async getCustomModel(userId: string) {
    return db.customModel.findFirst({
      where: {
        userId,
        status: 'ready'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
```

---

## Cost Analysis

### DALL-E 3 Pricing

```typescript
const DALLE_PRICING = {
  standard: {
    '1024x1024': 0.040,
    '1024x1792': 0.080,
    '1792x1024': 0.080
  },
  hd: {
    '1024x1024': 0.080,
    '1024x1792': 0.120,
    '1792x1024': 0.120
  }
};

// Monthly cost per user tier
const MONTHLY_COSTS = {
  free: {
    generations: 10,
    cost: 10 * 0.04 = 0.40
  },
  pro: {
    generations: 100,
    cost: 100 * 0.04 = 4.00
  },
  team: {
    generations: 500,
    cost: 500 * 0.04 = 20.00
  }
};
```

### Break-Even Analysis

```
Pro Tier Economics:
- User pays: $9/month
- AI cost: $4/month (100 generations)
- Gross margin: $5/month (55%)
- Infrastructure: $0.20/user/month
- Net margin: $4.80/month (53%)

ROI: Positive ✅

10,000 Users (10% paid conversion):
- Revenue: 1,000 × $9 = $9,000/month
- AI costs: 1,000 × $4 = $4,000/month
- Infrastructure: $200/month
- Gross profit: $4,800/month
- Margin: 53%
```

### Stable Diffusion Economics (Enterprise)

```
Self-Hosted Stable Diffusion:
- GPU Server: $500/month (A100)
- Capacity: ~50,000 generations/month
- Cost per generation: $0.01

Enterprise Tier (5 users, unlimited):
- Revenue: $299/month
- Generations: ~500/month per user = 2,500 total
- SD Cost: 2,500 × $0.01 = $25
- Gross margin: $274/month (92%)

Break-even: 20 generations/month per enterprise user
Typical usage: 500+ generations/month
ROI: Excellent ✅
```

---

## Post-Processing Pipeline

### 1. Vectorization

```typescript
// src/services/vectorization.service.ts
import potrace from 'potrace';
import sharp from 'sharp';

export class VectorizationService {
  async rasterToVector(imageUrl: string): Promise<string> {
    // 1. Download image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // 2. Convert to high-contrast
    const processed = await sharp(Buffer.from(buffer))
      .greyscale()
      .threshold(128)
      .toBuffer();

    // 3. Trace with Potrace
    return new Promise((resolve, reject) => {
      potrace.trace(processed, (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });
  }
}
```

### 2. SVG Optimization

```typescript
// src/services/optimization.service.ts
import { optimize } from 'svgo';

export class OptimizationService {
  optimizeSVG(svgString: string): string {
    const result = optimize(svgString, {
      multipass: true,
      plugins: [
        'preset-default',
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'cleanupAttrs',
        'mergeStyles',
        'inlineStyles',
        'minifyStyles',
        'cleanupIds',
        'removeUselessDefs',
        'cleanupNumericValues',
        'convertColors',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'removeViewBox',
        'cleanupEnableBackground',
        'removeHiddenElems',
        'removeEmptyText',
        'convertShapeToPath',
        'moveElemsAttrsToGroup',
        'moveGroupAttrsToElems',
        'collapseGroups',
        'convertPathData',
        'convertTransform',
        'removeEmptyAttrs',
        'removeEmptyContainers',
        'mergePaths',
        'removeUnusedNS',
        'sortAttrs',
        'removeTitle',
        'removeDesc'
      ]
    });

    return result.data;
  }
}
```

---

## Caching Strategy

### 1. Redis Cache

```typescript
// src/services/cache.service.ts
import { redis } from '../lib/redis';
import crypto from 'crypto';

export class CacheService {
  private TTL = 60 * 60 * 24 * 7; // 7 days

  async cacheGeneration(prompt: string, style: string, result: any): Promise<void> {
    const cacheKey = this.getCacheKey(prompt, style);
    await redis.setex(cacheKey, this.TTL, JSON.stringify(result));
  }

  async getCachedGeneration(prompt: string, style: string): Promise<any | null> {
    const cacheKey = this.getCacheKey(prompt, style);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  private getCacheKey(prompt: string, style: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${prompt}:${style}`)
      .digest('hex');

    return `ai:generation:${hash}`;
  }
}

// Usage in AI service
async generateIcon(options: any, userId: string) {
  // Check cache first
  const cached = await this.cache.getCachedGeneration(
    options.prompt,
    options.style
  );

  if (cached) {
    console.log('Cache hit');
    return cached;
  }

  // Generate
  const result = await this.openai.generateIcon(options, userId);

  // Cache result
  await this.cache.cacheGeneration(options.prompt, options.style, result);

  return result;
}
```

---

## Rate Limiting

```typescript
// Per-user rate limiting
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:ai:${userId}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  return current <= 10; // 10 requests per minute
}
```

---

## Monitoring & Analytics

```typescript
// Track AI metrics
interface AIMetrics {
  totalGenerations: number;
  successRate: number;
  averageDuration: number;
  averageCost: number;
  popularStyles: Record<string, number>;
  errorRate: number;
}

async function getAIMetrics(startDate: Date, endDate: Date): Promise<AIMetrics> {
  const generations = await db.aiGeneration.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  // Calculate metrics
  return {
    totalGenerations: generations.length,
    successRate: 0.95, // from error logs
    averageDuration: 8500, // ms
    averageCost: 0.04,
    popularStyles: {
      flat: 450,
      line: 320,
      filled: 180,
      '3d': 50
    },
    errorRate: 0.05
  };
}
```

---

## Conclusion

This AI integration strategy provides:
- **Phase 1-3**: Fast MVP with DALL-E 3
- **Phase 4+**: Enterprise differentiation with Stable Diffusion
- **Cost-Effective**: Positive ROI at all tiers
- **Scalable**: Queue-based processing, caching
- **Flexible**: Multiple models, custom training

**Implementation Timeline**:
- Phase 1 (Month 1-3): DALL-E 3 integration
- Phase 2 (Month 4-6): Caching, optimization
- Phase 3 (Month 7-9): Variations, style transfer
- Phase 4 (Month 10+): Stable Diffusion, custom models

**Key Metrics to Track**:
- Generation success rate (target: >95%)
- Average generation time (target: <10s)
- Cost per generation
- User satisfaction with results
- Cache hit rate (target: >30%)

**Next Steps**:
1. Obtain OpenAI API key
2. Implement basic DALL-E 3 integration
3. Build prompt engineering system
4. Add post-processing pipeline
5. Implement caching layer
6. Plan Stable Diffusion infrastructure (Phase 4)
