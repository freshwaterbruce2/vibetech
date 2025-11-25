const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5555;

// Middleware
app.use(cors());
app.use(express.json());

console.log('Starting Simple Server...');

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Content generation endpoint - NO AUTH REQUIRED
app.post('/api/deepseek/chat', async (req, res) => {
    const { prompt, builderType } = req.body;
    console.log('Received request:', { prompt, builderType });

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

    const content = templates[builderType] || 'Generated content for your request...';

    res.json({
        content: content,
        message: 'Content generated successfully',
        success: true
    });
});

// Serve the main HTML file FIRST
app.get('/', (req, res) => {
    console.log('Serving index-ultimate-pro.html');
    res.sendFile(path.join(__dirname, 'index-ultimate-pro.html'));
});

// Then serve static files for CSS/JS/images
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║     Simple Content Builder Server             ║
║     Running on http://localhost:${PORT}          ║
║                                                ║
║     API Endpoints:                             ║
║     - /api/health                              ║
║     - /api/deepseek/chat (NO AUTH)            ║
╚════════════════════════════════════════════════╝
    `);
});