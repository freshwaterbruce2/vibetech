const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 5555;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const db = new sqlite3.Database('./database.sqlite');

// Create tables if they don't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
`);

// Security headers
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests");
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Origin-Agent-Cluster', '?1');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-XSS-Protection', '0');
    next();
});

// Billing Service (mock)
console.log('Initializing Billing Service...');
console.log('Started daily billing job');
setInterval(() => {
    console.log('[Billing] Running automated billing check...');
}, 60000);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ message: 'Email already exists' });
                    }
                    return res.status(500).json({ message: 'Registration failed' });
                }

                const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
                res.json({
                    token,
                    user: { id: this.lastID, email, name }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// DeepSeek/AI Chat endpoint (temporarily removing auth for testing)
app.post('/api/deepseek/chat', async (req, res) => {
    const { prompt, builderType, stream } = req.body;

    // Mock AI response - In production, this would call actual AI API
    const generateMockContent = (type, prompt) => {
        const templates = {
            ebook: `# AI-Generated Ebook Content

## ${prompt}

### Chapter 1: Introduction
This is the beginning of your AI-generated ebook about "${prompt}". The content has been crafted to provide valuable insights and engage your readers.

### Key Points Covered:
1. Foundation concepts and principles
2. Practical applications and examples
3. Step-by-step guidance
4. Expert insights and best practices
5. Future trends and considerations

### Chapter Outline:
- Chapter 1: Getting Started
- Chapter 2: Core Concepts
- Chapter 3: Advanced Techniques
- Chapter 4: Real-World Applications
- Chapter 5: Conclusion and Next Steps

The full content would be generated based on your specific requirements and topic depth.`,

            course: `# Course Curriculum

## ${prompt}

### Module 1: Foundation
**Duration:** 2 weeks
**Learning Objectives:**
- Understand fundamental concepts
- Apply basic principles
- Complete hands-on exercises

### Module 2: Intermediate Concepts
**Duration:** 3 weeks
**Learning Objectives:**
- Master intermediate techniques
- Develop practical skills
- Work on real projects

### Module 3: Advanced Topics
**Duration:** 3 weeks
**Learning Objectives:**
- Explore advanced concepts
- Implement complex solutions
- Create portfolio projects

### Assessments:
- Weekly quizzes
- Practical assignments
- Final project`,

            landing: `# Landing Page Copy

## Headline: ${prompt}

### Value Proposition
Transform your business with our cutting-edge solution that delivers real results.

### Benefits:
✓ Increase productivity by 50%
✓ Save time and resources
✓ Scale your operations effortlessly
✓ Get expert support 24/7

### Features:
- Advanced automation capabilities
- Intuitive user interface
- Seamless integrations
- Real-time analytics
- Enterprise-grade security

### Call to Action
Start your free trial today and experience the difference!

### Testimonials Section
"This solution transformed our business!" - Happy Customer
"Outstanding results from day one." - Satisfied User`,

            email: `Subject Line: ${prompt}

Preview Text: Discover something amazing inside...

Dear [Name],

We're excited to share something special with you today.

${prompt}

Here's what you need to know:
• Exclusive offer just for you
• Limited time availability
• Instant access upon signup

Don't miss this opportunity to transform your [specific area].

Click here to get started →

Best regards,
Your Team

P.S. This offer expires in 48 hours!`,

            social: `# Social Media Content

## Post 1 - ${prompt}
🚀 ${prompt}

Here's why this matters:
→ Point 1
→ Point 2
→ Point 3

What's your take? Comment below! 👇

#innovation #technology #growth

## Post 2
Did you know? [Interesting fact related to ${prompt}]

Follow for more insights!

## Post 3
Success story time! 🎉

[Brief case study related to ${prompt}]

#success #motivation`,

            app: `# App Prototype Specification

## ${prompt}

### Screen 1: Onboarding
- Welcome message
- Feature highlights
- Sign up/Login options

### Screen 2: Dashboard
- Key metrics display
- Quick actions menu
- Navigation tabs

### Screen 3: Main Feature
- Core functionality
- User interactions
- Data visualization

### User Flow:
1. User opens app → Onboarding
2. Authentication → Dashboard
3. Feature selection → Main screens
4. Actions → Results/Feedback

### UI Components:
- Navigation bar
- Cards and lists
- Forms and inputs
- Buttons and CTAs
- Modals and alerts`
        };

        return templates[type] || 'Generated content for your request...';
    };

    try {
        const content = generateMockContent(builderType, prompt);
        res.json({ content, message: 'Content generated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Generation failed' });
    }
});

// Project management
app.post('/api/projects/save', authenticateToken, (req, res) => {
    const { type, content } = req.body;
    const userId = req.user.id;

    db.run(
        'INSERT INTO projects (user_id, type, content) VALUES (?, ?, ?)',
        [userId, type, content],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Failed to save project' });
            }
            res.json({ id: this.lastID, message: 'Project saved successfully' });
        }
    );
});

app.get('/api/projects', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.all(
        'SELECT * FROM projects WHERE user_id = ? ORDER BY timestamp DESC',
        [userId],
        (err, projects) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to fetch projects' });
            }
            res.json(projects);
        }
    );
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-ultimate.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     Vibe-Creator Studio Server                ║
║     Running on http://localhost:${PORT}          ║
║                                                ║
║     API Endpoints:                             ║
║     - /api/health                              ║
║     - /api/auth/register                       ║
║     - /api/auth/login                          ║
║     - /api/deepseek/chat                       ║
║     - /api/projects/*                          ║
╚════════════════════════════════════════════════╝
    `);

    // Additional startup messages
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log('STRIPE_SECRET_KEY not set. Stripe functionality will be limited.');
    }
});