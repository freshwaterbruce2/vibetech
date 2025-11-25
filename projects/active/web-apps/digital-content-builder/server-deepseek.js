const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const OpenAI = require('openai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5555;
const JWT_SECRET = process.env.JWT_SECRET || 'content-builder-secret-2025';

// Initialize DeepSeek with OpenAI client (DeepSeek is OpenAI-compatible)
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-test',
    baseURL: 'https://api.deepseek.com/v1'
});

// Alternative: Direct axios client for DeepSeek
const deepseekAxios = axios.create({
    baseURL: 'https://api.deepseek.com/v1',
    headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-test'}`,
        'Content-Type': 'application/json'
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Database Setup
const db = new sqlite3.Database('./database.sqlite');

// Initialize tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            plan TEXT DEFAULT 'free',
            tokens_used INTEGER DEFAULT 0,
            tokens_limit INTEGER DEFAULT 100000,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT NOT NULL,
            title TEXT,
            content TEXT NOT NULL,
            model TEXT DEFAULT 'deepseek-chat',
            tokens_used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS api_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            endpoint TEXT,
            tokens_used INTEGER,
            response_time INTEGER,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);
});

// API Routes

// Health check with DeepSeek status
app.get('/api/health', async (req, res) => {
    let deepseekStatus = 'unknown';

    try {
        // Test DeepSeek API connection
        const testResponse = await deepseek.models.list();
        deepseekStatus = 'connected';
    } catch (error) {
        deepseekStatus = 'disconnected';
    }

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        deepseek: deepseekStatus,
        features: {
            streaming: true,
            models: ['deepseek-chat', 'deepseek-coder'],
            maxTokens: 32768
        }
    });
});

// Main DeepSeek content generation endpoint
app.post('/api/deepseek/generate', async (req, res) => {
    const {
        prompt,
        type = 'general',
        contentType,
        model = 'deepseek-chat',
        temperature = 0.7,
        maxTokens,
        stream = false,
        systemPrompt = null
    } = req.body;

    // Use contentType if provided, otherwise fall back to type
    const actualType = contentType || type;

    // Set smart token limits based on content type if not explicitly provided
    const defaultTokenLimits = {
        'landing': 8000,
        'landingPage': 8000,
        'blog': 6000,
        'article': 6000,
        'email': 3000,
        'course': 8000,
        'ebook': 10000,
        'code': 4000,
        'social': 2000,
        'socialMedia': 2000,
        'general': 4000
    };

    const actualMaxTokens = maxTokens || defaultTokenLimits[actualType] || 4000;

    if (!prompt) {
        return res.status(400).json({
            success: false,
            message: 'Prompt is required'
        });
    }

    const startTime = Date.now();

    try {
        // Build system prompt based on content type
        const systemMessage = systemPrompt || getSystemPrompt(actualType);

        // Get enhanced prompt with detailed instructions
        const enhancedPrompt = getEnhancedPrompt(actualType, prompt);

        // Prepare messages for DeepSeek
        const messages = [
            {
                role: 'system',
                content: systemMessage
            },
            {
                role: 'user',
                content: enhancedPrompt
            }
        ];

        if (stream) {
            // Streaming response
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const stream = await deepseek.chat.completions.create({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: actualMaxTokens,
                stream: true
            });

            let fullContent = '';
            let tokenCount = 0;

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    tokenCount++;
                    res.write(`data: ${JSON.stringify({
                        content: content,
                        totalContent: fullContent,
                        tokens: tokenCount
                    })}\n\n`);
                }
            }

            // Clean and validate the final content for HTML content types
            const cleanedContent = cleanGeneratedContent(fullContent, actualType);
            const validatedContent = validateAndCompleteHTML(cleanedContent, actualType);

            res.write(`data: ${JSON.stringify({
                done: true,
                totalTokens: tokenCount,
                responseTime: Date.now() - startTime,
                finalContent: validatedContent
            })}\n\n`);
            res.end();

            // Log usage
            logApiUsage(null, '/api/deepseek/generate', tokenCount, Date.now() - startTime, 'success');

        } else {
            // Non-streaming response
            const completion = await deepseek.chat.completions.create({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: actualMaxTokens
            });

            const rawContent = completion.choices[0].message.content;
            const cleanedContent = cleanGeneratedContent(rawContent, actualType);
            const content = validateAndCompleteHTML(cleanedContent, actualType);
            const usage = completion.usage;

            // Log usage
            logApiUsage(null, '/api/deepseek/generate', usage?.total_tokens || 0, Date.now() - startTime, 'success');

            res.json({
                success: true,
                content: content,
                model: model,
                usage: {
                    promptTokens: usage?.prompt_tokens || 0,
                    completionTokens: usage?.completion_tokens || 0,
                    totalTokens: usage?.total_tokens || 0
                },
                responseTime: Date.now() - startTime,
                metadata: {
                    type: actualType,
                    contentType: actualType,
                    temperature: temperature,
                    maxTokens: actualMaxTokens
                }
            });
        }

    } catch (error) {
        console.error('DeepSeek API Error:', error);

        // Log failed usage
        logApiUsage(null, '/api/deepseek/generate', 0, Date.now() - startTime, 'failed');

        res.status(500).json({
            success: false,
            message: 'Content generation failed',
            error: error.message,
            details: error.response?.data || null
        });
    }
});

// Enhanced content generation with templates
app.post('/api/deepseek/chat', async (req, res) => {
    const { prompt, builderType = 'general' } = req.body;

    if (!prompt) {
        return res.status(400).json({
            success: false,
            message: 'Prompt is required'
        });
    }

    try {
        // Get specialized prompt based on builder type
        const enhancedPrompt = getEnhancedPrompt(builderType, prompt);

        // Call DeepSeek API
        const completion = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: getSystemPrompt(builderType)
                },
                {
                    role: 'user',
                    content: enhancedPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        const content = completion.choices[0].message.content;

        res.json({
            success: true,
            content: content,
            message: 'Content generated successfully'
        });

    } catch (error) {
        console.error('DeepSeek Error:', error);

        // Fallback to template if API fails
        const fallbackContent = getFallbackContent(builderType, prompt);

        res.json({
            success: true,
            content: fallbackContent,
            message: 'Content generated (fallback mode)',
            fallback: true
        });
    }
});

// Code generation endpoint (using deepseek-coder)
app.post('/api/deepseek/code', async (req, res) => {
    const {
        prompt,
        language = 'javascript',
        task = 'implementation'
    } = req.body;

    try {
        const systemPrompt = `You are DeepSeek Coder, an expert programming assistant. Generate high-quality, well-commented ${language} code for the following task: ${task}`;

        const completion = await deepseek.chat.completions.create({
            model: 'deepseek-coder',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 4000
        });

        const code = completion.choices[0].message.content;

        res.json({
            success: true,
            code: code,
            language: language,
            task: task
        });

    } catch (error) {
        console.error('Code generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Code generation failed',
            error: error.message
        });
    }
});

// Available models endpoint
app.get('/api/deepseek/models', async (req, res) => {
    try {
        const models = await deepseek.models.list();

        res.json({
            success: true,
            models: models.data.map(m => ({
                id: m.id,
                created: m.created,
                owned_by: m.owned_by
            })),
            recommended: {
                chat: 'deepseek-chat',
                code: 'deepseek-coder',
                reasoning: 'deepseek-reasoner'
            }
        });
    } catch (error) {
        res.json({
            success: false,
            models: [],
            fallback: [
                { id: 'deepseek-chat', description: 'General chat model' },
                { id: 'deepseek-coder', description: 'Code generation model' }
            ]
        });
    }
});

// Usage statistics endpoint
app.get('/api/stats', authenticateToken, (req, res) => {
    const userId = req.user ? req.user.id : null;

    const query = userId
        ? `SELECT
            COUNT(*) as total_requests,
            SUM(tokens_used) as total_tokens,
            AVG(response_time) as avg_response_time,
            endpoint,
            DATE(created_at) as date
         FROM api_usage
         WHERE user_id = ?
         GROUP BY DATE(created_at), endpoint
         ORDER BY date DESC
         LIMIT 30`
        : `SELECT
            COUNT(*) as total_requests,
            SUM(tokens_used) as total_tokens,
            AVG(response_time) as avg_response_time,
            endpoint,
            DATE(created_at) as date
         FROM api_usage
         GROUP BY DATE(created_at), endpoint
         ORDER BY date DESC
         LIMIT 30`;

    const params = userId ? [userId] : [];

    db.all(query, params,
        (err, stats) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }
            res.json({ success: true, stats });
        }
    );
});

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(); // Allow anonymous access but without user context
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return next(); // Invalid token, continue as anonymous
        }
        req.user = user;
        next();
    });
}

// Helper Functions

function cleanGeneratedContent(content, contentType) {
    // For HTML content types, ensure we get raw HTML
    if (['landing', 'landingPage', 'blog', 'article', 'email', 'course', 'ebook'].includes(contentType)) {
        // Remove markdown code blocks
        content = content.replace(/```html\s*/gi, '');
        content = content.replace(/```\s*$/gi, '');

        // Find the actual HTML content
        const doctypeMatch = content.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
        if (doctypeMatch) {
            content = doctypeMatch[1];
        }

        // If still no DOCTYPE, look for html tag
        const htmlMatch = content.match(/(<html[\s\S]*<\/html>)/i);
        if (htmlMatch && !content.includes('<!DOCTYPE')) {
            content = htmlMatch[1];
        }

        // Remove any explanatory text before HTML
        content = content.replace(/^[^<]*(?=<!DOCTYPE|<html)/i, '');

        // Remove any text after closing html tag
        content = content.replace(/(<\/html>)[\s\S]*$/i, '$1');
    }

    return content.trim();
}

function validateAndCompleteHTML(content, contentType) {
    // Only process HTML content types
    if (!['landing', 'landingPage', 'blog', 'article', 'email', 'course', 'ebook', 'social', 'socialMedia'].includes(contentType)) {
        return content;
    }

    let validatedContent = content.trim();

    // Check for DOCTYPE declaration
    if (!validatedContent.toLowerCase().includes('<!doctype html>')) {
        if (validatedContent.toLowerCase().startsWith('<html')) {
            validatedContent = '<!DOCTYPE html>\n' + validatedContent;
        }
    }

    // Check for complete HTML structure
    const hasHtmlTag = /<html[^>]*>/i.test(validatedContent);
    const hasHeadTag = /<head[^>]*>/i.test(validatedContent);
    const hasBodyTag = /<body[^>]*>/i.test(validatedContent);
    const hasClosingHtml = /<\/html>/i.test(validatedContent);

    // If missing essential structure, wrap content properly
    if (!hasHtmlTag || !hasHeadTag || !hasBodyTag || !hasClosingHtml) {
        // Extract title from content if available
        const titleMatch = validatedContent.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : `Generated ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;

        // Extract meta description if available
        const metaDescMatch = validatedContent.match(/<meta[^>]*name=['"']description['"'][^>]*content=['"']([^'"]*)['"'][^>]*>/i);
        const description = metaDescMatch ? metaDescMatch[1] : `Professional ${contentType} generated by AI`;

        // Create complete HTML structure with embedded styles
        validatedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        h1, h2, h3, h4, h5, h6 { margin-bottom: 0.5em; }
        p { margin-bottom: 1em; }
        img { max-width: 100%; height: auto; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; transition: background 0.3s; }
        .btn:hover { background: #0056b3; }
        @media (max-width: 768px) { .container { padding: 0 15px; } }
    </style>
</head>
<body>
    <div class="container">
        ${validatedContent.replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<\/?html[^>]*>/gi, '').replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '').replace(/<\/?body[^>]*>/gi, '').trim()}
    </div>
</body>
</html>`;
    }

    // Validate that essential meta tags exist
    if (!validatedContent.includes('<meta charset=')) {
        validatedContent = validatedContent.replace('<head>', '<head>\n    <meta charset="UTF-8">');
    }

    if (!validatedContent.includes('name="viewport"')) {
        validatedContent = validatedContent.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    return validatedContent;
}

function getSystemPrompt(type) {
    const prompts = {
        'ebook': 'You are a senior web developer creating production-ready ebook HTML documents. Generate complete, deployable HTML5 ebooks with embedded CSS and JavaScript. INCLUDE: Semantic HTML5 structure, responsive design (mobile/tablet/desktop), embedded <style> tags with modern CSS, SEO meta tags, Open Graph metadata, accessibility features (ARIA labels), professional typography system, table of contents with smooth scrolling, reading progress indicator, dark/light mode toggle. Output ONLY the complete HTML document ready for immediate deployment.',
        'course': 'You are a senior educational platform developer creating production-ready course HTML documents. Generate complete, deployable HTML5 course modules with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure, interactive course interface, embedded <style> and <script> tags, responsive design, progress tracking system, quiz functionality, navigation between modules, accessibility features, video/audio embed support, print-friendly styles. Output ONLY the complete HTML document ready for immediate deployment.',
        'landing': 'You are a senior web developer creating production-ready landing page HTML documents. Generate complete, deployable HTML5 landing pages with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure with DOCTYPE, responsive design (mobile/tablet/desktop), embedded <style> tags with modern CSS, embedded <script> tags for interactions, SEO meta tags, Open Graph metadata, structured data markup, hero section, features section, testimonials, contact form, conversion tracking, smooth scrolling, animations. Output ONLY the complete HTML document ready for immediate deployment.',
        'landingPage': 'You are a senior web developer creating production-ready landing page HTML documents. Generate complete, deployable HTML5 landing pages with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure with DOCTYPE, responsive design (mobile/tablet/desktop), embedded <style> tags with modern CSS, embedded <script> tags for interactions, SEO meta tags, Open Graph metadata, structured data markup, hero section, features section, testimonials, contact form, conversion tracking, smooth scrolling, animations. Output ONLY the complete HTML document ready for immediate deployment.',
        'blog': 'You are a senior web developer creating production-ready blog article HTML documents. Generate complete, deployable HTML5 blog articles with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure, semantic article markup, embedded <style> tags with modern CSS, SEO meta tags, Open Graph metadata, structured data markup, article schema, responsive design, social sharing buttons, related posts section, comment system integration, reading time estimate, author bio section. Output ONLY the complete HTML document ready for immediate deployment.',
        'article': 'You are a senior web developer creating production-ready article HTML documents. Generate complete, deployable HTML5 articles with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure, semantic article markup, embedded <style> tags with modern CSS, SEO meta tags, Open Graph metadata, structured data markup, responsive design, author information, publication date, social sharing, print styles, accessibility features. Output ONLY the complete HTML document ready for immediate deployment.',
        'email': 'You are a senior email template developer creating production-ready email HTML documents. Generate complete, deployable HTML email templates with embedded CSS. INCLUDE: Full HTML structure with DOCTYPE, table-based layout for compatibility, inline CSS for maximum client support, responsive design with media queries, proper alt text for images, fallback styling for all email clients, preheader text, unsubscribe footer, dark mode optimization. Output ONLY the complete HTML document ready for immediate deployment.',
        'social': 'You are a senior web developer creating production-ready social media HTML documents. Generate complete, deployable HTML5 social media content with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure, responsive design, embedded <style> and <script> tags, social media optimized layouts, Open Graph metadata, Twitter Card metadata, platform-specific styling, interactive elements, sharing functionality. Output ONLY the complete HTML document ready for immediate deployment.',
        'socialMedia': 'You are a senior web developer creating production-ready social media HTML documents. Generate complete, deployable HTML5 social media content with embedded CSS and JavaScript. INCLUDE: Full HTML5 structure, responsive design, embedded <style> and <script> tags, social media optimized layouts, Open Graph metadata, Twitter Card metadata, platform-specific styling, interactive elements, sharing functionality. Output ONLY the complete HTML document ready for immediate deployment.',
        'code': 'You are an expert software engineer. Generate complete, production-ready code files with proper structure, documentation, error handling, and best practices. Include all necessary dependencies, configuration, and usage examples.',
        'general': 'You are a versatile full-stack developer. Generate complete, production-ready deliverables based on the user\'s requirements. Always provide functional code, markup, or structured content that can be immediately used.'
    };

    return prompts[type] || prompts.general;
}

function getEnhancedPrompt(type, basePrompt) {
    const enhancements = {
        'ebook': `Generate a complete HTML5 ebook about "${basePrompt}". Requirements:

**HTML Structure:**
- Complete HTML5 document with DOCTYPE, head, and body
- Semantic structure with header, nav, main, sections, and footer
- Table of contents with clickable navigation
- 8-10 chapter sections with proper heading hierarchy (h1, h2, h3)
- Professional typography and readability

**CSS Styling (Embedded):**
- Modern, clean design with professional typography
- Responsive layout (mobile, tablet, desktop)
- Print-friendly styles with page breaks
- Smooth scrolling navigation
- Reading progress indicator
- Dark/light mode toggle

**Content Structure:**
- Compelling title and subtitle
- Executive summary
- Table of contents with anchor links
- Introduction that hooks the reader
- 8-10 detailed chapters (1000+ words each)
- Conclusion with key takeaways
- About the author section
- References/bibliography

**Interactive Features:**
- Collapsible sections
- Highlighting/note-taking functionality
- Search within content
- Bookmark system

Generate the complete HTML file ready for immediate use.`,

        'course': `Generate a complete HTML5 online course about "${basePrompt}". Requirements:

**HTML Structure:**
- Complete HTML5 document with responsive design
- Course dashboard with progress tracking
- Module navigation with lesson structure
- Interactive assessment forms
- Certificate generation section

**CSS & JavaScript (Embedded):**
- Modern LMS-style interface
- Progress bars and completion tracking
- Responsive design for all devices
- Interactive quiz functionality
- Video/audio player integration
- Smooth animations and transitions

**Course Content:**
- Course title and compelling description
- Clear learning objectives (5-7 goals)
- 6-8 comprehensive modules
- 3-5 lessons per module with practical exercises
- Interactive quizzes and assessments
- Downloadable resources section
- Certificate of completion template

**Interactive Features:**
- Progress tracking with localStorage
- Interactive quizzes with immediate feedback
- Note-taking functionality
- Bookmark important sections
- Discussion forum integration points
- Assignment submission forms

Generate the complete HTML course platform ready for deployment.`,

        'landing': `GENERATE ONLY THE COMPLETE HTML DOCUMENT FOR: "${basePrompt}". Output the raw HTML code starting with <!DOCTYPE html> and ending with </html>. Include embedded CSS and JavaScript. Create a high-converting landing page with hero section, features, testimonials, pricing, and contact form. Use modern responsive design with professional styling and conversion optimization. NO EXPLANATIONS, NO MARKDOWN, NO CODE BLOCKS - ONLY THE COMPLETE HTML FILE.`,

        'landingPage': `GENERATE ONLY THE COMPLETE HTML DOCUMENT FOR: "${basePrompt}". Output the raw HTML code starting with <!DOCTYPE html> and ending with </html>. Include embedded CSS and JavaScript. Create a high-converting landing page with hero section, features, testimonials, pricing, and contact form. Use modern responsive design with professional styling and conversion optimization. NO EXPLANATIONS, NO MARKDOWN, NO CODE BLOCKS - ONLY THE COMPLETE HTML FILE.`,

        'blog': `GENERATE ONLY THE COMPLETE HTML5 BLOG ARTICLE FOR: "${basePrompt}". Output the raw HTML code starting with <!DOCTYPE html> and ending with </html>. Include embedded CSS and JavaScript. Create a complete blog article with SEO meta tags, structured data, article content, sidebar, and footer. Use modern responsive design with professional typography. NO EXPLANATIONS, NO MARKDOWN, NO CODE BLOCKS - ONLY THE COMPLETE HTML FILE.`,

        'article': `GENERATE ONLY THE COMPLETE HTML5 ARTICLE FOR: "${basePrompt}". Output the raw HTML code starting with <!DOCTYPE html> and ending with </html>. Include embedded CSS and JavaScript. Create a complete editorial-quality article with SEO meta tags, structured data, professional typography, and responsive design. NO EXPLANATIONS, NO MARKDOWN, NO CODE BLOCKS - ONLY THE COMPLETE HTML FILE.`,

        'email': `GENERATE ONLY THE COMPLETE HTML EMAIL TEMPLATE FOR: "${basePrompt}". Output the raw HTML code starting with <!DOCTYPE html> and ending with </html>. Include inline CSS for email client compatibility. Create a complete email template with table-based layout, responsive design, CTA buttons, and cross-client compatibility. NO EXPLANATIONS, NO MARKDOWN, NO CODE BLOCKS - ONLY THE COMPLETE HTML EMAIL FILE.`,

        'social': `Generate complete HTML social media content templates for "${basePrompt}". Requirements:

**HTML Structure:**
- Complete HTML5 document with responsive design
- Platform-specific post templates
- Interactive engagement elements
- Media integration sections
- Analytics tracking setup

**Platform Templates:**
- Facebook post with optimal dimensions
- Instagram post with hashtag suggestions
- Twitter/X thread template
- LinkedIn professional post
- TikTok script and visual guidelines

**Content Elements:**
- Engaging hooks and captions
- Relevant hashtag research
- Call-to-action strategies
- User-generated content prompts
- Community engagement questions

**Visual Components:**
- Image dimension specifications
- Video aspect ratio guidelines
- Story template designs
- Carousel post layouts
- Brand consistency elements

Generate complete social media content package with HTML templates.`,

        'socialMedia': `Generate complete HTML social media content templates for "${basePrompt}". Requirements:

**HTML Structure:**
- Complete HTML5 document with responsive design
- Platform-specific post templates
- Interactive engagement elements
- Media integration sections
- Analytics tracking setup

**Platform Templates:**
- Facebook post with optimal dimensions
- Instagram post with hashtag suggestions
- Twitter/X thread template
- LinkedIn professional post
- TikTok script and visual guidelines

**Content Elements:**
- Engaging hooks and captions
- Relevant hashtag research
- Call-to-action strategies
- User-generated content prompts
- Community engagement questions

**Visual Components:**
- Image dimension specifications
- Video aspect ratio guidelines
- Story template designs
- Carousel post layouts
- Brand consistency elements

Generate complete social media content package with HTML templates.`,

        'code': `Generate complete, production-ready code for "${basePrompt}". Requirements:

**Code Structure:**
- Complete, executable code files
- Proper project structure and organization
- Configuration files and dependencies
- Documentation and README
- Test files and examples

**Quality Standards:**
- Clean, readable code with comments
- Error handling and validation
- Security best practices
- Performance optimization
- Cross-platform compatibility

**Documentation:**
- Installation instructions
- Usage examples
- API documentation
- Configuration options
- Troubleshooting guide

**Development Features:**
- Environment setup scripts
- Build and deployment configurations
- Testing framework integration
- Continuous integration setup
- Version control recommendations

Generate complete, deployable code package with all necessary files.`,

        'general': `Generate complete, production-ready deliverables for "${basePrompt}". Requirements:

**Output Format:**
- Complete HTML5 document with embedded CSS and JavaScript
- Responsive design for all devices
- Professional, modern appearance
- Interactive functionality where appropriate
- SEO and accessibility optimized

**Quality Standards:**
- Production-ready code
- Cross-browser compatibility
- Performance optimized
- Security considerations
- Best practices implementation

**Content Requirements:**
- Comprehensive, valuable content
- Professional presentation
- Clear structure and navigation
- Engaging user experience
- Actionable deliverables

Generate complete, immediately usable deliverable based on the specific requirements.`
    };

    return enhancements[type] || enhancements.general;
}

function getFallbackContent(type, prompt) {
    return `# ${prompt}

## Overview
This content addresses the topic of "${prompt}" with comprehensive coverage and practical insights.

### Key Points
1. **Foundation**: Understanding the core concepts
2. **Implementation**: Practical application strategies
3. **Best Practices**: Industry standards and recommendations
4. **Case Studies**: Real-world examples and success stories
5. **Future Outlook**: Trends and opportunities

### Detailed Analysis

The subject of ${prompt} represents a significant area of focus in today's landscape. This content provides actionable insights and strategies for success.

#### Section 1: Getting Started
- Define clear objectives
- Assess current state
- Identify key stakeholders
- Develop implementation roadmap

#### Section 2: Core Strategies
- Strategy A: Focus on efficiency
- Strategy B: Prioritize quality
- Strategy C: Ensure scalability
- Strategy D: Maintain flexibility

#### Section 3: Implementation Guide
1. Phase 1: Planning and preparation
2. Phase 2: Initial deployment
3. Phase 3: Testing and optimization
4. Phase 4: Full-scale rollout
5. Phase 5: Monitoring and maintenance

### Best Practices
- Start with pilot projects
- Measure everything
- Iterate based on feedback
- Document learnings
- Share knowledge across teams

### Common Challenges
- Challenge 1: Resource constraints
  - Solution: Prioritize high-impact areas
- Challenge 2: Technical complexity
  - Solution: Break down into manageable components
- Challenge 3: Stakeholder alignment
  - Solution: Regular communication and updates

### Success Metrics
- KPI 1: Efficiency improvement
- KPI 2: Quality enhancement
- KPI 3: User satisfaction
- KPI 4: ROI measurement
- KPI 5: Time to market

### Conclusion
Successfully implementing ${prompt} requires careful planning, systematic execution, and continuous optimization. By following the strategies outlined in this content, organizations can achieve significant improvements in their operations.

### Next Steps
1. Assess your current situation
2. Define clear objectives
3. Develop an implementation plan
4. Start with a pilot project
5. Scale based on results

---
*This content provides a foundation for understanding and implementing ${prompt}. For more detailed information, consider consulting with experts in the field.*`;
}

function logApiUsage(userId, endpoint, tokensUsed, responseTime, status) {
    db.run(
        'INSERT INTO api_usage (user_id, endpoint, tokens_used, response_time, status) VALUES (?, ?, ?, ?, ?)',
        [userId || 0, endpoint, tokensUsed, responseTime, status],
        (err) => {
            if (err) {
                console.error('Failed to log API usage:', err);
            }
        }
    );
}

// WebSocket for real-time features
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('generate-stream', async (data) => {
        const { prompt, type, model = 'deepseek-chat' } = data;

        try {
            const stream = await deepseek.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: getSystemPrompt(type) },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                stream: true
            });

            let fullContent = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    socket.emit('content-chunk', { content, fullContent });
                }
            }

            socket.emit('generation-complete', {
                fullContent,
                model,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            socket.emit('generation-error', {
                error: error.message,
                fallback: true
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                  ║
║         DEEPSEEK CONTENT BUILDER - AI PLATFORM                  ║
║                                                                  ║
║     Server running on http://localhost:${PORT}                     ║
║                                                                  ║
║     Features:                                                   ║
║     ✓ DeepSeek Chat & Coder Models                             ║
║     ✓ Streaming Response Support                               ║
║     ✓ Real-time WebSocket Integration                          ║
║     ✓ Multiple Content Types                                    ║
║     ✓ Usage Analytics & Tracking                               ║
║     ✓ Fallback Templates                                       ║
║                                                                  ║
║     API Endpoints:                                             ║
║     POST /api/deepseek/generate - Main generation              ║
║     POST /api/deepseek/chat - Template-based generation        ║
║     POST /api/deepseek/code - Code generation                  ║
║     GET  /api/deepseek/models - Available models               ║
║     GET  /api/stats - Usage statistics                         ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝

DeepSeek API Status: ${process.env.DEEPSEEK_API_KEY ? 'Configured ✓' : 'Not configured (using fallback)'}
    `);
});

module.exports = app;