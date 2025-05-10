
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// Example blog posts data (same as in BlogPage)
const blogPostsData = [
  {
    id: "1",
    title: "10 Essential Tips for Modern Web Development",
    date: "May 5, 2023",
    author: "Your Name",
    authorImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    excerpt: "Explore the most important practices for building modern, efficient web applications that scale well and provide excellent user experiences.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTime: "5 min read",
    tags: ["Web Development", "Programming", "React"],
    content: `
      <h2>Introduction</h2>
      <p>Modern web development is constantly evolving, with new technologies, frameworks, and best practices emerging all the time. Staying on top of these changes can be challenging, but implementing the right approaches can significantly improve your workflow and the quality of your applications.</p>
      
      <p>In this article, we'll explore ten essential tips that can help you build better web applications in today's fast-paced development environment.</p>
      
      <h2>1. Embrace Component-Based Architecture</h2>
      <p>Breaking your UI into reusable components has become a standard practice in modern web development. Whether you're using React, Vue, Angular, or any other framework, thinking in components helps create more maintainable and scalable code.</p>
      
      <p>Components encapsulate their own logic, styling, and structure, making them easy to reuse and test. This approach also enables better collaboration among team members, as different developers can work on different components simultaneously.</p>
      
      <h2>2. Optimize Performance from the Start</h2>
      <p>Performance should be a consideration from the beginning of your project, not an afterthought. Techniques like code splitting, lazy loading, and tree shaking can significantly reduce initial load times.</p>
      
      <p>Use tools like Lighthouse or WebPageTest to identify performance bottlenecks, and establish performance budgets to ensure your application remains fast as it grows.</p>
      
      <h2>3. Implement Responsive Design Properly</h2>
      <p>With the wide variety of devices and screen sizes in use today, responsive design is no longer optional. Use flexible layouts, CSS Grid, and media queries to ensure your application looks and functions well on all devices.</p>
      
      <p>Consider a mobile-first approach, starting with the mobile layout and then progressively enhancing the experience for larger screens.</p>
      
      <h2>4. Prioritize Accessibility</h2>
      <p>Building accessible applications is not just about compliance—it's about creating products that everyone can use. Follow WCAG guidelines, use semantic HTML, provide alternative text for images, and ensure keyboard navigation works properly.</p>
      
      <p>Testing tools like axe or Lighthouse can help identify accessibility issues, but there's no substitute for testing with actual assistive technologies.</p>
      
      <h2>5. Use TypeScript for Better Code Quality</h2>
      <p>TypeScript adds static typing to JavaScript, catching errors at compile time rather than runtime. This leads to more robust code, better intellisense in your IDE, and improved documentation for your codebase.</p>
      
      <p>While there's a learning curve, the long-term benefits in terms of code quality and maintainability make TypeScript worth considering for most projects.</p>
      
      <h2>6. Implement Effective State Management</h2>
      <p>As applications grow, managing state becomes increasingly complex. Whether you choose Redux, Zustand, MobX, or the built-in state management of your framework, having a clear strategy is crucial.</p>
      
      <p>Consider what state needs to be global versus local, and use tools like React Context or Vue's Provide/Inject for state that needs to be shared among components but doesn't necessarily need to be global.</p>
      
      <h2>7. Adopt Modern CSS Techniques</h2>
      <p>CSS has evolved significantly in recent years. Features like Custom Properties (variables), Grid Layout, and Flexbox have made complex layouts easier to implement. Consider using CSS-in-JS solutions or utility-first frameworks like Tailwind CSS for better maintainability.</p>
      
      <p>Regardless of your approach, organization and consistency are key to preventing CSS from becoming unmanageable as your project grows.</p>
      
      <h2>8. Implement Comprehensive Testing</h2>
      <p>A solid testing strategy is essential for maintaining code quality. This includes unit tests for individual functions and components, integration tests for how components work together, and end-to-end tests for complete user flows.</p>
      
      <p>Tools like Jest, Testing Library, and Cypress can help you implement effective testing at different levels of your application.</p>
      
      <h2>9. Optimize Your Build Process</h2>
      <p>A well-configured build process can significantly improve both developer experience and end-user performance. Use bundlers like webpack, Vite, or Parcel to optimize your assets, and set up hot module replacement for faster development cycles.</p>
      
      <p>Consider implementing CI/CD pipelines to automate testing and deployment, reducing the risk of introducing bugs and making it easier to release updates.</p>
      
      <h2>10. Stay Security-Conscious</h2>
      <p>Security vulnerabilities can have serious consequences. Stay updated on common security threats, implement proper authentication and authorization, validate user input, and use HTTPS for all communications.</p>
      
      <p>Regularly update your dependencies to patch known vulnerabilities, and consider using tools like npm audit or Snyk to identify potential security issues in your dependencies.</p>
      
      <h2>Conclusion</h2>
      <p>Modern web development requires a multifaceted approach, balancing performance, accessibility, user experience, and code quality. By implementing these ten tips, you'll be well on your way to building better, more maintainable web applications.</p>
      
      <p>Remember that the field is constantly evolving, so staying curious and continuing to learn is perhaps the most important tip of all.</p>
    `
  },
  {
    id: "2",
    title: "The Future of UI/UX Design in 2023",
    date: "April 18, 2023",
    author: "Your Name",
    authorImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    excerpt: "Discover the emerging trends that will shape the future of digital design, from advanced animations to inclusive design practices.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTime: "7 min read",
    tags: ["UI/UX Design", "Design Trends", "User Experience"],
    content: `
      <h2>Introduction</h2>
      <p>The field of UI/UX design is constantly evolving, with new trends, tools, and methodologies emerging each year. As we move through 2023, several key trends are shaping the future of digital design, influencing how we create interfaces and experiences for users around the world.</p>
      
      <p>In this article, we'll explore the most significant UI/UX design trends of 2023 and how they're changing the digital landscape.</p>
      
      <h2>1. Advanced Micro-Interactions and Animations</h2>
      <p>Micro-interactions have evolved beyond simple hover effects and button animations. In 2023, we're seeing increasingly sophisticated animations that respond to user behavior in meaningful ways, creating more engaging and intuitive interfaces.</p>
      
      <p>The key is to use these animations purposefully, enhancing the user experience rather than distracting from it. Look for smooth transitions between states, playful loading animations, and subtle feedback that acknowledges user actions.</p>
      
      <h2>2. Immersive 3D Elements</h2>
      <p>With improvements in browser capabilities and hardware performance, 3D elements are becoming more common in web and mobile interfaces. These can range from subtle depth effects to fully interactive 3D models.</p>
      
      <p>This trend is particularly evident in e-commerce, where 3D product visualization allows users to examine items from all angles, and in educational applications, where complex concepts can be illustrated more effectively in three dimensions.</p>
      
      <h2>3. Dark Mode and Color Theory Evolution</h2>
      <p>Dark mode has evolved from a novelty feature to a standard expectation. Users appreciate both the aesthetic appeal and the reduced eye strain, particularly in low-light environments.</p>
      
      <p>Along with this, we're seeing more sophisticated use of color theory in UI design. Designers are moving beyond simple complementary color schemes to explore more nuanced palettes, including gradients and duotones that create depth and visual interest.</p>
      
      <h2>4. Voice User Interfaces (VUI)</h2>
      <p>As voice recognition technology improves, voice interfaces are becoming more prevalent. Designers are now tasked with creating experiences that blend visual and voice interactions seamlessly.</p>
      
      <p>This requires new approaches to feedback and affordance—users need to understand what they can say, and how the system will respond, without always relying on visual cues.</p>
      
      <h2>5. Advanced Personalization</h2>
      <p>Users have come to expect experiences tailored to their preferences and behavior. In 2023, personalization is becoming more sophisticated, with AI-driven systems that adapt interfaces based on user patterns, preferences, and contexts.</p>
      
      <p>This goes beyond simply showing recommended content—it can include adjusting layouts, highlighting different features, or changing the tone of communication based on individual users.</p>
      
      <h2>6. Inclusive Design as a Standard</h2>
      <p>Inclusive design is no longer an add-on consideration but a fundamental aspect of the design process. Designers are increasingly aware of the diverse needs of users, including those with disabilities, different language backgrounds, or varying technological access.</p>
      
      <p>This shift is reflected in more flexible interfaces that adapt to different needs, more thoughtful use of color and contrast, and broader consideration of how design choices affect all potential users.</p>
      
      <h2>7. Augmented Reality Integration</h2>
      <p>AR features are becoming more common in mainstream apps and websites. From virtual try-on experiences in retail to interactive learning tools, AR is enhancing digital experiences by blending them with the physical world.</p>
      
      <p>Designers are developing new patterns and conventions for these mixed-reality interfaces, creating intuitive ways for users to interact with virtual elements in real-world contexts.</p>
      
      <h2>8. Minimalism 2.0</h2>
      <p>Minimalism continues to be a dominant design philosophy, but it's evolving beyond the stark simplicity of earlier approaches. The new minimalism balances clean layouts with carefully chosen details that add character and warmth.</p>
      
      <p>This might include subtle textures, thoughtful typography choices, or strategically placed illustrations that enhance the user experience without cluttering the interface.</p>
      
      <h2>9. Data Visualization Advancements</h2>
      <p>As data becomes increasingly central to many applications, designers are developing more sophisticated and intuitive ways to visualize complex information.</p>
      
      <p>Interactive data visualizations allow users to explore information at their own pace, while advancements in animation help illustrate changes over time or relationships between different data points.</p>
      
      <h2>10. Ethical Design Focus</h2>
      <p>There's a growing awareness of the ethical implications of design choices. Designers are considering how their work affects user well-being, privacy, and autonomy, and developing approaches that respect these considerations.</p>
      
      <p>This includes more transparent information about data usage, design patterns that discourage addictive behavior, and interfaces that empower users rather than manipulating them.</p>
      
      <h2>Conclusion</h2>
      <p>The UI/UX trends of 2023 reflect both technological advancements and evolving user expectations. As designers, our challenge is to embrace these new possibilities while maintaining a focus on creating interfaces that are intuitive, accessible, and genuinely useful for our users.</p>
      
      <p>By balancing innovation with user-centered principles, we can create digital experiences that are not just visually impressive but also meaningful and valuable.</p>
    `
  },
  // Additional blog posts with similar structure...
  {
    id: "3",
    title: "Optimizing React Applications for Performance",
    date: "March 22, 2023",
    author: "Your Name",
    authorImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    excerpt: "Learn techniques to improve your React application's performance, from code splitting to memoization and efficient state management.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTime: "8 min read",
    tags: ["React", "Performance", "JavaScript"],
    content: `<p>This is a placeholder for the full content of the "Optimizing React Applications for Performance" article.</p>`
  },
  {
    id: "4",
    title: "Getting Started with TypeScript in 2023",
    date: "February 15, 2023",
    author: "Your Name",
    authorImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    excerpt: "A beginner's guide to TypeScript, covering the basics, advantages, and best practices for using TypeScript in modern web development.",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTime: "6 min read",
    tags: ["TypeScript", "JavaScript", "Programming"],
    content: `<p>This is a placeholder for the full content of the "Getting Started with TypeScript in 2023" article.</p>`
  },
  {
    id: "5",
    title: "Building Accessible Web Applications",
    date: "January 8, 2023",
    author: "Your Name",
    authorImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    excerpt: "Why accessibility matters and how to ensure your web applications are usable by everyone, including people with disabilities.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTime: "5 min read",
    tags: ["Accessibility", "Web Development", "Inclusive Design"],
    content: `<p>This is a placeholder for the full content of the "Building Accessible Web Applications" article.</p>`
  },
  {
    id: "6",
    title: "The Power of CSS Grid Layout",
    date: "December 12, 2022",
    author: "Your Name",
    authorImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    excerpt: "Explore the capabilities of CSS Grid Layout and how it can transform the way you design and implement web layouts.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTime: "4 min read",
    tags: ["CSS", "Web Design", "Frontend"],
    content: `<p>This is a placeholder for the full content of the "The Power of CSS Grid Layout" article.</p>`
  }
];

const BlogPostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    document.title = "Blog Post | Aura";
    
    // Simulate API fetch with a timeout
    const timer = setTimeout(() => {
      const foundPost = blogPostsData.find(p => p.id === postId);
      setPost(foundPost);
      setLoading(false);
      
      if (foundPost) {
        document.title = `${foundPost.title} | Aura`;
        
        // Find related posts based on tags
        const related = blogPostsData
          .filter(p => p.id !== postId && p.tags.some(tag => foundPost.tags.includes(tag)))
          .slice(0, 3);
        setRelatedPosts(related);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-aura-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-aura-textSecondary mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/blog"
            className="px-6 py-3 bg-aura-accent text-white rounded-md hover:bg-aura-accent/90 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="py-16 md:py-24 hero-glow">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/blog" className="inline-flex items-center text-aura-textSecondary hover:text-aura-accent mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Blog
          </Link>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{post.title}</h1>
          
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
              <img src={post.authorImage} alt={post.author} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-medium">{post.author}</div>
              <div className="text-sm text-aura-textSecondary flex items-center">
                <span>{post.date}</span>
                <span className="mx-2">•</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag, index) => (
              <Link 
                key={index}
                to={`/blog?tag=${encodeURIComponent(tag)}`}
                className="text-sm px-3 py-1 rounded bg-aura-accent/20 text-aura-accent hover:bg-aura-accent/30 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="mb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="aspect-[16/9] rounded-lg overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Post Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <article 
            className="prose prose-invert prose-headings:text-white prose-p:text-aura-textSecondary prose-a:text-aura-accent max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          {/* Share Links */}
          <div className="mt-12 pt-8 border-t border-aura-border">
            <h3 className="text-xl font-semibold mb-4">Share this article</h3>
            <div className="flex space-x-4">
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noreferrer noopener" className="bg-aura-background hover:bg-aura-card rounded-full p-3 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aura-accent">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer noopener" className="bg-aura-background hover:bg-aura-card rounded-full p-3 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aura-accent">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}`} target="_blank" rel="noreferrer noopener" className="bg-aura-background hover:bg-aura-card rounded-full p-3 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aura-accent">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-aura-card/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Related Articles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link to={`/blog/${relatedPost.id}`} key={relatedPost.id}>
                  <div className="aura-card overflow-hidden rounded-lg transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center text-sm text-aura-textSecondary mb-2">
                        <span>{relatedPost.date}</span>
                        <span className="mx-2">•</span>
                        <span>{relatedPost.readTime}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-3">{relatedPost.title}</h3>
                      <p className="text-aura-textSecondary mb-4 line-clamp-2">{relatedPost.excerpt}</p>
                      <div className="mt-auto text-aura-accent font-medium">Read More →</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link 
                to="/blog"
                className="px-6 py-3 border border-aura-border text-white rounded-md hover:bg-aura-card transition-colors"
              >
                View All Articles
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPostPage;
