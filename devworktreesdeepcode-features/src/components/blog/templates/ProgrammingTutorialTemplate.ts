import { BlogPost, AffiliateRecommendation } from '../types';
import { affiliateLibrary } from '../enhancedBlogData';

export const createProgrammingTutorialTemplate = (
  title: string,
  techStack: string[],
  customAffiliates?: AffiliateRecommendation[]
): Partial<BlogPost> => {
  // Select relevant affiliates based on tech stack
  const defaultAffiliates = [
    affiliateLibrary[0], // Vercel Pro
    affiliateLibrary[1], // GitHub Copilot
    affiliateLibrary[3], // React Course
    affiliateLibrary[4]  // Frontend Masters
  ];

  return {
    title,
    category: "Programming",
    tags: [...techStack, "Tutorial", "Development"],
    author: "Vibe Tech",
    featured: false,
    affiliateRecommendations: customAffiliates || defaultAffiliates,
    content: `# ${title}

In this comprehensive tutorial, we'll build a ${techStack.join(' + ')} application from scratch. This guide covers everything from setup to deployment with best practices and real-world examples.

## What You'll Learn

- Setting up a modern ${techStack[0]} development environment
- Implementing core functionality with ${techStack.join(', ')}
- Best practices for code organization and architecture
- Testing strategies and quality assurance
- Deployment and production optimization

## Prerequisites

Before we start, make sure you have:
- Node.js (v18+) installed on your machine
- Basic understanding of ${techStack[0]}
- A code editor (I recommend VS Code)

## Project Setup

Let's start by creating our project structure:

\`\`\`bash
npm create vite@latest my-${techStack[0].toLowerCase()}-app -- --template react-ts
cd my-${techStack[0].toLowerCase()}-app
npm install
\`\`\`

## Core Implementation

### 1. Basic Structure

First, let's set up our main components:

\`\`\`tsx
// src/App.tsx
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>${title}</h1>
      </header>
      <main>
        {/* Main content goes here */}
      </main>
    </div>
  );
}

export default App;
\`\`\`

### 2. Adding Core Features

Now let's implement the main functionality:

\`\`\`tsx
// Implementation details will vary based on your specific project
// This is where you'd add your main features
\`\`\`

## Best Practices

Throughout this project, I follow these important principles:

- **Type Safety**: Using TypeScript for better developer experience
- **Component Composition**: Building reusable, maintainable components  
- **Performance**: Optimizing for speed and user experience
- **Testing**: Writing tests for reliability

## Tools I Recommend

For development workflow optimization, I highly recommend the tools linked in the sidebar. They significantly improve productivity and code quality.

## Deployment

For hosting, **Vercel** (affiliate link above) provides the best developer experience with zero-configuration deployment.

## Conclusion

We've successfully built a complete ${techStack.join(' + ')} application. The combination of modern tools and best practices makes this a solid foundation for any project.

## Next Steps

- Explore advanced ${techStack[0]} patterns
- Add more sophisticated features
- Consider the recommended courses for deeper learning

Ready to take your skills further? Check out the educational resources in the recommended section!`,
    excerpt: `Learn how to build a complete ${techStack.join(' + ')} application from setup to deployment. Includes best practices, testing strategies, and modern development workflows.`,
    seoDescription: `Complete ${title.toLowerCase()} tutorial covering ${techStack.join(', ')} development with step-by-step instructions and best practices.`
  };
};

export default createProgrammingTutorialTemplate;