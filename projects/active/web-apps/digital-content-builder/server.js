#!/usr/bin/env node
/**
 * Digital Content Builder - Production Server
 * Modern, secure Express.js server with DeepSeek AI integration
 * Follows 2025 security best practices with minimal dependencies
 *
 * @version 2.0.0
 * @author Vibe-Tech.org
 * @license MIT
 */

import axios from 'axios';
import cors from 'cors';
import createDOMPurify from 'dompurify';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import { JSDOM } from 'jsdom';
import { dirname } from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { cacheMiddleware, cacheStats, getCacheHealth, warmCache } from './cache.js';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = ['DEEPSEEK_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

// Configuration
const nodeEnv = process.env.NODE_ENV || 'development';
const isTestEnv = nodeEnv === 'test';

const config = {
    port: parseInt(process.env.PORT) || 3005,
    nodeEnv: nodeEnv,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    rateLimits: {
        general: {
            windowMs: 15 * 60 * 1000,
            max: isTestEnv ? 1000 : 100  // 1000 for tests, 100 for production
        },
        api: {
            windowMs: 10 * 60 * 1000,
            max: isTestEnv ? 200 : 20    // 200 for tests, 20 for production
        },
        auth: { windowMs: 10 * 60 * 1000, max: 5 }       // 5 auth attempts per 10 minutes
    }
};

// OpenAPI/Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Digital Content Builder API',
            version: '2.0.0',
            description: 'Production-grade AI-powered content generation platform with DeepSeek integration',
            contact: {
                name: 'Vibe-Tech.org',
                url: 'https://vibe-tech.org'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${config.port}`,
                description: 'Development server'
            },
            {
                url: 'https://api.vibe-tech.org',
                description: 'Production server'
            }
        ],
        components: {
            schemas: {
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'healthy' },
                        version: { type: 'string', example: '2.0.0' },
                        timestamp: { type: 'string', format: 'date-time' },
                        uptime: { type: 'integer', example: 3600 },
                        deepseek: { type: 'string', enum: ['connected', 'not_configured'] },
                        features: {
                            type: 'object',
                            properties: {
                                streaming: { type: 'boolean' },
                                models: { type: 'array', items: { type: 'string' } },
                                maxTokens: { type: 'integer' }
                            }
                        }
                    }
                },
                GenerateRequest: {
                    type: 'object',
                    required: ['prompt', 'contentType'],
                    properties: {
                        prompt: {
                            type: 'string',
                            minLength: 10,
                            maxLength: 5000,
                            description: 'Content generation prompt',
                            example: 'Create a landing page for a tech startup'
                        },
                        contentType: {
                            type: 'string',
                            enum: ['landing', 'blog', 'article', 'email', 'course', 'ebook', 'code', 'social', 'socialMedia', 'general'],
                            description: 'Type of content to generate',
                            example: 'landing'
                        },
                        model: {
                            type: 'string',
                            enum: ['deepseek-chat', 'deepseek-coder'],
                            default: 'deepseek-chat',
                            description: 'AI model to use'
                        },
                        temperature: {
                            type: 'number',
                            minimum: 0,
                            maximum: 2,
                            default: 0.7,
                            description: 'Creativity level (0-2)'
                        },
                        maxTokens: {
                            type: 'integer',
                            default: 4000,
                            description: 'Maximum tokens to generate'
                        },
                        stream: {
                            type: 'boolean',
                            default: false,
                            description: 'Enable streaming response'
                        }
                    }
                },
                GenerateResponse: {
                    type: 'object',
                    properties: {
                        content: { type: 'string', description: 'Generated content' },
                        sanitizedContent: { type: 'string', description: 'XSS-safe content' },
                        metadata: {
                            type: 'object',
                            properties: {
                                model: { type: 'string' },
                                contentType: { type: 'string' },
                                tokensUsed: { type: 'integer' },
                                processingTime: { type: 'integer' },
                                temperature: { type: 'number' },
                                maxTokens: { type: 'integer' }
                            }
                        }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Validation failed' },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    value: { type: 'string' },
                                    msg: { type: 'string' },
                                    path: { type: 'string' },
                                    location: { type: 'string' }
                                }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                ServerStats: {
                    type: 'object',
                    properties: {
                        uptime: { type: 'integer' },
                        requests: { type: 'integer' },
                        errors: { type: 'integer' },
                        totalTokens: { type: 'integer' },
                        averageResponseTime: { type: 'number' }
                    }
                }
            },
            responses: {
                ValidationError: {
                    description: 'Validation error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ValidationError' }
                        }
                    }
                },
                ServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: { type: 'string' },
                                    timestamp: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./server.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Initialize Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Security middleware - Helmet with strict CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"], // Removed 'unsafe-inline' for October 2025 security
            scriptSrcAttr: ["'none'"], // Explicitly block inline event handlers
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: config.nodeEnv === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false // Allow iframe embedding for preview
}));

// CORS configuration
const corsOptions = {
    origin: config.nodeEnv === 'production'
        ? ['https://vibe-tech.org', 'https://www.vibe-tech.org']
        : true,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting middleware
const createRateLimiter = (options, message = 'Too many requests') => {
    return rateLimit({
        ...options,
        message: { error: message, retryAfter: Math.ceil(options.windowMs / 1000) },
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) => {
            console.warn(`Rate limit exceeded for IP: ${req.ip}, Route: ${req.path}`);
            res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil(options.windowMs / 1000),
                timestamp: new Date().toISOString()
            });
        }
    });
};

// Apply rate limiters
app.use(createRateLimiter(config.rateLimits.general, 'Too many requests from this IP'));
app.use('/api/', createRateLimiter(config.rateLimits.api, 'Too many API requests'));

// Body parsing with size limits
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Initialize DOMPurify for HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// DeepSeek API client
const deepseekClient = axios.create({
    baseURL: config.deepseekBaseUrl,
    timeout: 60000, // 60 second timeout
    headers: {
        'Authorization': `Bearer ${config.deepseekApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DigitalContentBuilder/2.0.0'
    }
});

// Content validation schemas
const contentValidation = [
    body('prompt')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Prompt must be between 10 and 5000 characters')
        .escape(),
    body('contentType')
        .isIn(['landing', 'blog', 'article', 'email', 'course', 'ebook', 'code', 'social', 'socialMedia', 'general'])
        .withMessage('Invalid content type'),
    body('model')
        .optional()
        .isIn(['deepseek-chat', 'deepseek-coder'])
        .withMessage('Invalid model'),
    body('temperature')
        .optional()
        .isFloat({ min: 0, max: 2 })
        .withMessage('Temperature must be between 0 and 2'),
    body('maxTokens')
        .optional()
        .isInt({ min: 100, max: 8000 })
        .withMessage('Max tokens must be between 100 and 8000'),
    body('stream')
        .optional()
        .isBoolean()
        .withMessage('Stream must be a boolean')
];

// Error handling utility
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn('Validation errors:', errors.array());
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// Content processing based on content type - 2025 optimized
const processContentByType = (content, contentType) => {
    try {
        // Content types that should remain as plain text/structured content
        const textOnlyTypes = ['social', 'video', 'podcast'];

        if (textOnlyTypes.includes(contentType)) {
            // For text-based content, just clean and structure
            return {
                content: content.trim(),
                isHTML: false,
                needsWrapper: true
            };
        }

        // HTML content types - sanitize but preserve structure
        const htmlTypes = ['blog', 'landing', 'email', 'ebook', 'course', 'code'];

        if (htmlTypes.includes(contentType)) {
            // Sanitize HTML content with appropriate settings
            const cleanHTML = DOMPurify.sanitize(content, {
                WHOLE_DOCUMENT: true,
                ALLOWED_TAGS: [
                    'html', 'head', 'body', 'title', 'meta', 'link', 'style',
                    'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main',
                    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'hr',
                    'ol', 'ul', 'li', 'dl', 'dt', 'dd', 'figure', 'figcaption',
                    'a', 'abbr', 'b', 'br', 'cite', 'code', 'em', 'i', 'kbd', 'mark',
                    'q', 's', 'small', 'strong', 'sub', 'sup', 'time', 'u', 'var',
                    'img', 'picture', 'source', 'svg', 'path', 'g', 'circle', 'rect',
                    'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
                    'form', 'fieldset', 'legend', 'label', 'input', 'button', 'select',
                    'option', 'textarea'
                ],
                ALLOWED_ATTR: [
                    'id', 'class', 'style', 'title', 'lang', 'dir', 'role',
                    'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
                    'name', 'value', 'placeholder', 'type', 'for', 'colspan', 'rowspan',
                    'charset', 'content', 'http-equiv', 'property', 'viewBox', 'fill', 'stroke'
                ],
                KEEP_CONTENT: true,
                SANITIZE_DOM: true
            });

            // Add DOCTYPE if missing for complete HTML documents
            if (cleanHTML.toLowerCase().includes('<html') &&
                !cleanHTML.toLowerCase().includes('<!doctype html>')) {
                return {
                    content: `<!DOCTYPE html>\n${cleanHTML}`,
                    isHTML: true,
                    needsWrapper: false
                };
            }

            return {
                content: cleanHTML,
                isHTML: true,
                needsWrapper: !cleanHTML.toLowerCase().includes('<html')
            };
        }

        // Default processing for unknown types
        return {
            content: content.trim(),
            isHTML: false,
            needsWrapper: true
        };

    } catch (error) {
        console.error('Content processing error:', error);
        throw new Error('Content processing failed');
    }
};

// Create complete HTML document with content-type specific styling
const createCompleteHTML = (content, contentType) => {
    const title = extractTitle(content) || `Generated ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Content`;
    const description = extractDescription(content) || `Professional ${contentType} content generated with AI`;

    // Content type specific styling
    const contentStyles = {
        social: `
            .social-post { margin: 2rem 0; padding: 1.5rem; border-left: 4px solid #1da1f2; background: #f8f9fa; }
            .platform { font-weight: bold; color: #1da1f2; margin-bottom: 0.5rem; }
            .hashtags { color: #1da1f2; font-weight: 500; }
        `,
        video: `
            .script-section { margin: 2rem 0; }
            .timestamp { background: #ff6b6b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85em; }
            .visual-cue { background: #51cf66; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-style: italic; }
        `,
        podcast: `
            .episode-section { margin: 2rem 0; padding: 1rem; border: 1px solid #e9ecef; border-radius: 8px; }
            .show-notes { background: #f8f9fa; padding: 1rem; border-radius: 6px; }
        `,
        default: ''
    };

    const typeStyle = contentStyles[contentType] || contentStyles.default;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="generator" content="DigitalContentBuilder/2.0.0">
    <meta name="robots" content="index, follow">

    <!-- Open Graph -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">

    <!-- Security headers -->
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">

    <!-- Performance optimizations -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <style>
        /* Modern CSS Reset */
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        html, body { height: 100%; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            color: #333;
            background: #fff;
        }
        img, picture, video, canvas, svg { display: block; max-width: 100%; }
        input, button, textarea, select { font: inherit; }
        p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }

        /* Content container */
        .content-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Typography */
        h1 { color: #2c3e50; margin-bottom: 1rem; }
        h2 { color: #34495e; margin-top: 2rem; margin-bottom: 1rem; }
        h3 { color: #34495e; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        p { margin-bottom: 1rem; }

        /* Content type specific styles */
        ${typeStyle}

        /* Responsive design */
        @media (max-width: 768px) {
            .content-container { padding: 1rem; }
        }
    </style>
</head>
<body>
    <div class="content-container">
        ${formatContentForHTML(content, contentType)}
    </div>

    <!-- Performance monitoring -->
    <script>
        if ('performance' in window) {
            window.addEventListener('load', () => {
                console.log('Content loaded in:', Math.round(performance.now()), 'ms');
            });
        }
        console.log('Generated by DigitalContentBuilder v2.0.0');
    </script>
</body>
</html>`;
};

// Format content for HTML display based on content type
const formatContentForHTML = (content, contentType) => {
    // If content is already HTML, return as-is
    if (content.includes('<html>') || content.includes('<body>')) {
        return content;
    }

    // Format plain text content for different types
    switch (contentType) {
        case 'social':
            return formatSocialContent(content);
        case 'video':
            return formatVideoScript(content);
        case 'podcast':
            return formatPodcastContent(content);
        default:
            return `<div class="content">${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;
    }
};

// Format social media content
const formatSocialContent = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    let formatted = '<div class="social-content">';

    let currentPlatform = '';
    for (const line of lines) {
        if (line.match(/^(Twitter|Facebook|Instagram|LinkedIn|TikTok):/i)) {
            if (currentPlatform) formatted += '</div>';
            currentPlatform = line.split(':')[0];
            formatted += `<div class="social-post"><div class="platform">${currentPlatform}:</div>`;
        } else if (line.includes('#')) {
            formatted += `<p class="hashtags">${line}</p>`;
        } else if (line.trim()) {
            formatted += `<p>${line}</p>`;
        }
    }

    if (currentPlatform) formatted += '</div>';
    formatted += '</div>';
    return formatted;
};

// Format video script content
const formatVideoScript = (content) => {
    let formatted = '<div class="video-script">';
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
        if (line.match(/^\d+:\d+/)) {
            formatted += `<p><span class="timestamp">${line.split(' ')[0]}</span> ${line.substring(line.indexOf(' ') + 1)}</p>`;
        } else if (line.match(/\[.*\]/)) {
            formatted += `<p><span class="visual-cue">${line}</span></p>`;
        } else if (line.trim()) {
            formatted += `<p>${line}</p>`;
        }
    }

    formatted += '</div>';
    return formatted;
};

// Format podcast content
const formatPodcastContent = (content) => {
    const sections = content.split('\n\n');
    let formatted = '<div class="podcast-content">';

    for (const section of sections) {
        if (section.trim()) {
            if (section.includes('Show Notes') || section.includes('Episode')) {
                formatted += `<div class="episode-section">${section.replace(/\n/g, '<br>')}</div>`;
            } else {
                formatted += `<div class="show-notes">${section.replace(/\n/g, '<br>')}</div>`;
            }
        }
    }

    formatted += '</div>';
    return formatted;
};

// Utility functions
const extractTitle = (html) => {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || html.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : null;
};

const extractDescription = (html) => {
    const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
    return pMatch ? pMatch[1].replace(/<[^>]*>/g, '').substring(0, 160).trim() : null;
};

// System prompts for content generation - Optimized for 2025 standards
const getSystemPrompt = (contentType) => {
    const prompts = {
        'blog': 'You are a professional content writer. Create a complete, production-ready blog post with proper HTML structure. Generate clean HTML with embedded CSS styling. Include: DOCTYPE, responsive design, SEO meta tags, structured headings (h1, h2, h3), engaging introduction, well-organized body content, conclusion with call-to-action. Focus on readability and engagement. Output complete HTML document.',

        'landing': 'You are a conversion-focused web developer. Create a high-converting landing page with clean HTML and embedded CSS. Include: Hero section with compelling headline, value proposition, key benefits (3-5 points), social proof/testimonials, clear call-to-action buttons, contact form, responsive design. Use modern CSS with gradients and professional styling. Output complete HTML document.',

        'email': 'You are an email marketing specialist. Create email-optimized HTML with inline CSS for maximum compatibility. Include: Email-safe HTML structure, inline CSS styles, compelling subject line, engaging header, clear value proposition, scannable content, prominent call-to-action button, footer with unsubscribe link. Use table-based layout for email clients. Output complete HTML email template.',

        'social': 'You are a social media strategist. Create engaging social media content optimized for multiple platforms. Generate: Compelling hook/opening line, engaging body text, relevant hashtags (#), clear call-to-action, platform variations (Twitter: 280 chars, LinkedIn: professional tone, Instagram: visual-focused, Facebook: community-oriented). Format as clean HTML with platform sections.',

        'ebook': 'You are a digital publishing expert. Create professional eBook content with proper structure and styling. Include: Title page, table of contents, chapter headings, well-formatted paragraphs, quotes/callouts, author bio, professional typography with embedded CSS. Focus on readability and print-friendly design. Output complete HTML document.',

        'course': 'You are an instructional designer. Create structured course content with clear learning objectives. Include: Course overview, learning objectives, module breakdown, lesson content with headers, key takeaways, practice exercises, progress indicators, next steps. Use educational formatting with embedded CSS. Output complete HTML document.',

        'code': 'You are a technical documentation expert. Create comprehensive code documentation with syntax highlighting. Include: Clear overview, code examples with proper formatting, API references, usage instructions, best practices, troubleshooting section. Use code-friendly CSS with syntax highlighting styles. Output complete HTML document.',

        'video': 'You are a video script writer. Create a professional video script with clear structure and timing. Include: Hook/intro (0-15s), main content outline, key talking points, visual cues [in brackets], call-to-action, outro. Format as clean HTML with timestamp markers and visual direction notes.',

        'podcast': 'You are a podcast content creator. Create comprehensive podcast episode materials. Include: Episode title, description, show notes outline, key topics with timestamps, guest introduction (if applicable), sponsor mentions, call-to-action, social media promotion text. Format as structured HTML content.',

        'general': 'You are a professional content creator. Generate high-quality, well-structured content that is clear, engaging, and valuable. Focus on proper formatting, logical flow, and actionable insights. Use appropriate HTML structure with clean styling.'
    };

    return prompts[contentType] || prompts.general;
};

// Statistics tracking
let serverStats = {
    totalRequests: 0,
    totalTokens: 0,
    averageResponseTime: 0,
    errors: 0,
    startTime: Date.now()
};

// Swagger Documentation Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Digital Content Builder API Docs',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// API Routes

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server and DeepSeek integration
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/api/health', cacheMiddleware('health'), (req, res) => {
    const uptime = Date.now() - serverStats.startTime;
    const cacheHealth = getCacheHealth();

    res.json({
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000),
        deepseek: config.deepseekApiKey ? 'connected' : 'not_configured',
        features: {
            streaming: true,
            models: ['deepseek-chat', 'deepseek-coder'],
            maxTokens: 8000
        },
        cache: {
            status: cacheHealth.status,
            hitRatio: `${cacheStats.hitRatio}%`,
            memoryUsage: `${cacheStats.memoryUsage}MB`
        }
    });
});

/**
 * @swagger
 * /api/deepseek/models:
 *   get:
 *     summary: Get available AI models
 *     description: Returns a list of available DeepSeek AI models for content generation
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: deepseek-chat
 *                       name:
 *                         type: string
 *                         example: DeepSeek Chat
 *                       description:
 *                         type: string
 *                         example: General purpose conversational AI model
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/api/deepseek/models', cacheMiddleware('models'), (req, res) => {
    res.json({
        models: [
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat',
                description: 'General purpose content generation',
                maxTokens: 8000,
                contextWindow: 32768
            },
            {
                id: 'deepseek-coder',
                name: 'DeepSeek Coder',
                description: 'Code and technical content generation',
                maxTokens: 8000,
                contextWindow: 16384
            }
        ]
    });
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get server statistics
 *     description: Returns server performance metrics and usage statistics
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Server statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerStats'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
app.get('/api/stats', (req, res) => {
    const uptime = Date.now() - serverStats.startTime;
    const cacheHealth = getCacheHealth();

    res.json({
        ...serverStats,
        uptime: Math.floor(uptime / 1000),
        requestsPerMinute: Math.round((serverStats.totalRequests / (uptime / 60000)) * 100) / 100,
        cache: {
            ...cacheHealth.stats,
            hitRatio: `${cacheStats.hitRatio}%`,
            status: cacheHealth.status,
            memoryUsage: `${cacheStats.memoryUsage}MB`
        }
    });
});

/**
 * @swagger
 * /api/deepseek/generate:
 *   post:
 *     summary: Generate AI content
 *     description: Generate high-quality content using DeepSeek AI models with comprehensive validation and sanitization
 *     tags: [Content Generation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateRequest'
 *           examples:
 *             landing_page:
 *               summary: Landing page generation
 *               value:
 *                 prompt: "Create a modern landing page for a SaaS startup"
 *                 contentType: "landing"
 *                 model: "deepseek-chat"
 *                 temperature: 0.7
 *                 maxTokens: 4000
 *                 stream: false
 *             blog_post:
 *               summary: Blog post generation
 *               value:
 *                 prompt: "Write a technical blog post about AI trends"
 *                 contentType: "blog"
 *                 model: "deepseek-chat"
 *                 temperature: 0.8
 *                 maxTokens: 3000
 *             code_generation:
 *               summary: Code generation
 *               value:
 *                 prompt: "Create a React component for user authentication"
 *                 contentType: "code"
 *                 model: "deepseek-coder"
 *                 temperature: 0.3
 *                 maxTokens: 2000
 *     responses:
 *       200:
 *         description: Content generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerateResponse'
 *           text/event-stream:
 *             description: Streaming response (when stream=true)
 *             schema:
 *               type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid API key
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Rate limit exceeded
 *                 retryAfter:
 *                   type: integer
 *                   example: 600
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Main content generation endpoint
app.post('/api/deepseek/generate',
    contentValidation,
    handleValidationErrors,
    cacheMiddleware('content'),
    async (req, res) => {
        const startTime = Date.now();

        try {
            const {
                prompt,
                contentType = 'general',
                model = 'deepseek-chat',
                temperature = 0.7,
                maxTokens = 4000,
                stream = false
            } = req.body;

            console.log(`Generating ${contentType} content with ${model} model`);

            const systemPrompt = getSystemPrompt(contentType);

            const requestData = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: parseFloat(temperature),
                max_tokens: parseInt(maxTokens),
                stream: stream
            };

            if (stream) {
                // Streaming response
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.setHeader('Access-Control-Allow-Origin', '*');

                try {
                    const response = await deepseekClient.post('/chat/completions', {
                        ...requestData,
                        stream: true
                    }, {
                        responseType: 'stream'
                    });

                    let fullContent = '';

                    response.data.on('data', (chunk) => {
                        const lines = chunk.toString().split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6).trim();

                                if (data === '[DONE]') {
                                    // Process and sanitize final content
                                    try {
                                        const processed = processContentByType(fullContent, contentType);
                                        let finalContent = processed.content;
                                        if (processed.needsWrapper) {
                                            finalContent = createCompleteHTML(processed.content, contentType);
                                        }

                                        res.write(`data: ${JSON.stringify({
                                            type: 'content_processed',
                                            content: finalContent,
                                            metadata: {
                                                contentType,
                                                model,
                                                tokens: fullContent.length,
                                                processingTime: Date.now() - startTime,
                                                isHTML: processed.isHTML,
                                                hasWrapper: processed.needsWrapper
                                            }
                                        })}\n\n`);
                                    } catch (error) {
                                        console.error('Content processing error:', error);
                                        res.write(`data: ${JSON.stringify({
                                            type: 'error',
                                            error: 'Content processing failed'
                                        })}\n\n`);
                                    }

                                    res.write('data: [DONE]\n\n');
                                    res.end();

                                    // Update stats
                                    serverStats.totalRequests++;
                                    serverStats.totalTokens += fullContent.length;
                                    const responseTime = Date.now() - startTime;
                                    serverStats.averageResponseTime =
                                        (serverStats.averageResponseTime + responseTime) / 2;

                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                        const content = parsed.choices[0].delta.content;
                                        fullContent += content;
                                        res.write(`data: ${JSON.stringify({
                                            type: 'content',
                                            content: content
                                        })}\n\n`);
                                    }
                                } catch {
                                    // Skip malformed JSON
                                }
                            }
                        }
                    });

                    response.data.on('error', (error) => {
                        console.error('Stream error:', error);
                        res.write(`data: ${JSON.stringify({
                            type: 'error',
                            error: 'Stream interrupted'
                        })}\n\n`);
                        res.end();
                        serverStats.errors++;
                    });

                } catch (streamError) {
                    console.error('Streaming request failed:', streamError);
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        error: 'Failed to connect to DeepSeek API'
                    })}\n\n`);
                    res.end();
                    serverStats.errors++;
                }

            } else {
                // Non-streaming response
                const response = await deepseekClient.post('/chat/completions', requestData);

                const rawContent = response.data.choices[0].message.content;

                // Process content based on type
                const processed = processContentByType(rawContent, contentType);

                // Create final content based on processing result
                let finalContent = processed.content;
                if (processed.needsWrapper) {
                    finalContent = createCompleteHTML(processed.content, contentType);
                }

                // Update stats
                serverStats.totalRequests++;
                serverStats.totalTokens += response.data.usage?.total_tokens || rawContent.length;
                const responseTime = Date.now() - startTime;
                serverStats.averageResponseTime =
                    (serverStats.averageResponseTime + responseTime) / 2;

                res.json({
                    content: finalContent,
                    rawContent: rawContent,
                    sanitizedContent: processed.content,
                    metadata: {
                        contentType,
                        model,
                        temperature,
                        maxTokens,
                        tokens: response.data.usage?.total_tokens || rawContent.length,
                        tokensUsed: response.data.usage?.total_tokens || rawContent.length,
                        processingTime: responseTime,
                        isHTML: processed.isHTML,
                        hasWrapper: processed.needsWrapper,
                        contentLength: rawContent.length,
                        processingType: processed.isHTML ? 'html' : 'text'
                    },
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Content generation error:', error);
            serverStats.errors++;

            const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
            const statusCode = error.response?.status || 500;

            res.status(statusCode).json({
                error: 'Content generation failed',
                details: errorMessage,
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Handle unsupported HTTP methods for /api/deepseek/generate
app.all('/api/deepseek/generate', (req, res) => {
    res.status(405).json({
        error: 'Method not allowed',
        message: `${req.method} method is not supported for this endpoint. Use POST instead.`,
        timestamp: new Date().toISOString()
    });
});

// Serve static files
app.use(express.static(__dirname, {
    index: 'index.html',
    setHeaders: (res, path) => {
        // Set cache headers for static assets
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(js|css|png|jpg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
        }
    }
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, _next) => {
    console.error('Global error handler:', err);

    serverStats.errors++;

    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    const uptime = Date.now() - serverStats.startTime;
    console.log(`Server statistics:`);
    console.log(`- Uptime: ${Math.floor(uptime / 1000)}s`);
    console.log(`- Total requests: ${serverStats.totalRequests}`);
    console.log(`- Total tokens: ${serverStats.totalTokens}`);
    console.log(`- Average response time: ${Math.round(serverStats.averageResponseTime)}ms`);
    console.log(`- Errors: ${serverStats.errors}`);

    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export for testing
let server;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    // Start server
    server = app.listen(config.port, () => {
        console.log('\n' + '='.repeat(70));
        console.log('🚀 DIGITAL CONTENT BUILDER v2.0.0 - PRODUCTION SERVER');
        console.log('='.repeat(70));
        console.log(`📡 Server: http://localhost:${config.port}`);
        console.log(`🌍 Environment: ${config.nodeEnv}`);
        console.log(`🔒 Security: Helmet + Rate Limiting + Input Validation`);
        console.log(`🤖 DeepSeek API: ${config.deepseekApiKey ? '✅ Connected' : '❌ Not configured'}`);
        console.log(`📊 Health Check: http://localhost:${config.port}/api/health`);
        console.log(`📱 Web Interface: http://localhost:${config.port}`);        console.log(`📱 Production Interface: http://localhost:${config.port}/index.html`);
        console.log(`📖 API Documentation: http://localhost:${config.port}/api-docs`);
        console.log(`📋 OpenAPI Schema: http://localhost:${config.port}/api-docs.json`);
        console.log('='.repeat(70));
        console.log('Features:');
        console.log('✓ Multi-view interface (Preview/Code/Split)');
        console.log('✓ Professional export system (HTML/MD/PDF/JSON)');
        console.log('✓ Production-ready HTML generation');
        console.log('✓ Security headers & rate limiting');
        console.log('✓ Input validation & sanitization');
        console.log('✓ Real-time streaming & non-streaming modes');
        console.log('✓ Comprehensive error handling');
        console.log('✓ Performance monitoring');
        console.log('✓ OpenAPI/Swagger documentation');
        console.log('✓ Interactive API testing interface');
        console.log('✓ Production-grade caching layer');
        console.log('='.repeat(70) + '\n');

        // Initialize cache warming
        warmCache();
    });

    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${config.port} is already in use`);
            console.error('Please check if another instance is running or change the PORT environment variable');
        } else {
            console.error('❌ Server error:', error);
        }
        process.exit(1);
    });
}

// Export both app and server for testing
export { app, server };
