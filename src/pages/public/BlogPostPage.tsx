
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
      
      <h2>1. Immersive 3D Elements</h2>
      <p>As browsers become more powerful and WebGL technology advances, we're seeing a surge in the use of 3D elements in web and app interfaces. These elements create depth, engage users, and provide a more immersive experience.</p>
      
      <p>Rather than using 3D for purely decorative purposes, designers are integrating these elements in functional ways, such as product visualization, interactive storytelling, and spatial navigation systems.</p>
      
      <h2>2. Advanced Micro-Interactions</h2>
      <p>Micro-interactions have evolved beyond simple hover effects to become sophisticated feedback mechanisms that guide users through their journey. These subtle animations respond to user actions, providing context and reinforcing behavior.</p>
      
      <p>In 2023, we're seeing micro-interactions become more nuanced, with physics-based animations that mimic real-world movement, creating a more intuitive and satisfying user experience.</p>
      
      <h2>3. Dark Mode Evolution</h2>
      <p>Dark mode has transitioned from a trend to a standard feature. In 2023, designers are refining dark mode implementations with more sophisticated color systems that maintain accessibility and readability while reducing eye strain.</p>
      
      <p>We're also seeing the emergence of "smart" dark mode that adapts based on environmental conditions or time of day, providing an optimal viewing experience regardless of context.</p>
      
      <h2>4. Voice User Interfaces (VUI)</h2>
      <p>As voice recognition technology continues to improve, voice user interfaces are becoming more integrated with traditional graphical interfaces. Designers are developing hybrid interactions where voice complements rather than replaces visual and tactile controls.</p>
      
      <p>This evolution requires new design considerations, such as voice feedback, auditory cues, and seamless transitions between voice and touch interactions.</p>
      
      <h2>5. Personalized User Experiences</h2>
      <p>With advancements in AI and machine learning, interfaces can now adapt to individual users' preferences, behaviors, and needs. This goes beyond simple recommendations to include personalized layouts, interaction patterns, and content delivery.</p>
      
      <p>The challenge for designers is creating systems that feel personalized without being intrusive, maintaining user privacy while delivering tailored experiences.</p>
      
      <h2>6. Inclusive Design as Standard</h2>
      <p>Inclusivity has moved from a specialized concern to a fundamental design principle. Designers are embracing tools and methodologies that make accessibility inherent to the design process rather than an afterthought.</p>
      
      <p>This includes considerations for users with different abilities, as well as cultural, linguistic, and socioeconomic factors that influence how people interact with digital products.</p>
      
      <h2>7. Augmented Reality Integration</h2>
      <p>AR is increasingly being integrated into everyday applications beyond gaming and entertainment. From virtual try-on experiences in e-commerce to wayfinding in physical spaces, AR is enhancing digital experiences by blending them with the physical world.</p>
      
      <p>This trend requires designers to think in three dimensions and consider how digital interfaces interact with physical environments.</p>
      
      <h2>8. Minimalism with Personality</h2>
      <p>While minimalism remains popular, designers are finding ways to infuse it with distinctive brand personality. This often takes the form of subtle textures, unique typography, or strategic use of color and imagery.</p>
      
      <p>The goal is creating clean, functional interfaces that remain memorable and reflect the brand's identity without overwhelming users with unnecessary elements.</p>
      
      <h2>9. Data Visualization Evolution</h2>
      <p>As data becomes increasingly central to user experiences, designers are finding more sophisticated ways to visualize complex information. Interactive dashboards, animated graphs, and real-time visualizations are becoming more intuitive and accessible to non-technical users.</p>
      
      <p>The focus is on presenting data in ways that tell clear stories and enable users to derive meaningful insights without specialized knowledge.</p>
      
      <h2>10. Ethical Design Frameworks</h2>
      <p>With growing awareness of digital products' impact on mental health, privacy, and society, designers are adopting ethical frameworks that prioritize user wellbeing over engagement metrics.</p>
      
      <p>This includes considerations like cognitive load, potential for addiction, data collection practices, and the broader societal implications of design decisions.</p>
      
      <h2>Conclusion</h2>
      <p>The future of UI/UX design in 2023 is characterized by a blend of technological advancement and human-centered principles. While new technologies enable more immersive and personalized experiences, there's a parallel emphasis on inclusivity, ethics, and user wellbeing.</p>
      
      <p>Successful designers will be those who can leverage new capabilities while remaining grounded in fundamental principles of human psychology and behavior. As the field continues to evolve, adaptability and continuous learning will remain essential skills for design professionals.</p>
    `
  },
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
    content: `<p>This is a placeholder for the full blog post content about optimizing React applications for performance. The article would cover topics like memoization, code splitting, and efficient state management.</p>`
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
    content: `<p>This is a placeholder for the full blog post content about getting started with TypeScript. The article would cover TypeScript basics, its advantages over JavaScript, and best practices.</p>`
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
    content: `<p>This is a placeholder for the full blog post content about building accessible web applications. The article would cover the importance of accessibility and practical implementation techniques.</p>`
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
    content: `<p>This is a placeholder for the full blog post content about CSS Grid Layout. The article would cover the capabilities of CSS Grid and how to use it effectively in web design.</p>`
  }
];

const BlogPostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      const foundPost = blogPostsData.find(p => p.id === postId);
      setPost(foundPost);
      
      if (foundPost) {
        document.title = `${foundPost.title} | Aura Blog`;
        
        // Find related posts based on tags
        const related = blogPostsData
          .filter(p => p.id !== foundPost.id && p.tags.some(tag => foundPost.tags.includes(tag)))
          .slice(0, 3);
        
        setRelatedPosts(related);
      } else {
        document.title = "Post Not Found | Aura Blog";
      }
      
      setLoading(false);
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
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog" className="text-aura-accent hover:underline">
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
        <div className="container mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center text-aura-textSecondary hover:text-aura-accent mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Blog
          </Link>
          
          <div className="flex flex-wrap items-center text-sm text-aura-textSecondary mb-6">
            <span>{post.date}</span>
            <span className="mx-2">•</span>
            <span>{post.readTime}</span>
            <span className="mx-2">•</span>
            <span>By {post.author}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-8">{post.title}</h1>
          
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

      {/* Feature Image */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="rounded-xl overflow-hidden aspect-[21/9] max-h-[600px]">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Content */}
            <div className="w-full lg:w-2/3">
              <div 
                className="prose prose-invert prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-p:text-aura-textSecondary prose-p:mb-6 prose-p:text-lg prose-a:text-aura-accent hover:prose-a:underline max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              
              {/* Author Bio */}
              <div className="mt-16 p-6 aura-card rounded-xl">
                <div className="flex">
                  <img
                    src={post.authorImage}
                    alt={post.author}
                    className="w-16 h-16 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Written by {post.author}</h3>
                    <p className="text-aura-textSecondary">
                      Software engineer and technical writer passionate about web development, 
                      design patterns, and creating exceptional user experiences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="w-full lg:w-1/3">
              {/* Author Card */}
              <div className="aura-card p-6 mb-8">
                <h3 className="text-xl font-bold mb-4">About the Author</h3>
                <div className="flex items-center mb-4">
                  <img
                    src={post.authorImage}
                    alt={post.author}
                    className="w-16 h-16 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-semibold">{post.author}</h4>
                    <p className="text-aura-textSecondary text-sm">Web Developer & Designer</p>
                  </div>
                </div>
                <p className="text-aura-textSecondary mb-4">
                  I write about web development, design, and technology. Follow along for insights and tutorials.
                </p>
                <Link to="/about" className="text-aura-accent hover:underline">
                  Learn more about me →
                </Link>
              </div>
              
              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="aura-card p-6">
                  <h3 className="text-xl font-bold mb-4">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link to={`/blog/${relatedPost.id}`} key={relatedPost.id} className="block">
                        <div className="flex items-start space-x-3 group">
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
                            <img
                              src={relatedPost.image}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium group-hover:text-aura-accent transition-colors">
                              {relatedPost.title}
                            </h4>
                            <p className="text-sm text-aura-textSecondary">{relatedPost.date}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              <div className="aura-card p-6 mt-8">
                <h3 className="text-xl font-bold mb-4">Explore Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Link 
                      key={index}
                      to={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="text-sm px-3 py-1 rounded bg-aura-background/50 text-aura-textSecondary hover:bg-aura-background transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Articles */}
      <section className="py-16 bg-aura-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">More Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPostsData
              .filter(p => p.id !== post.id)
              .slice(0, 3)
              .map((post) => (
                <Link to={`/blog/${post.id}`} key={post.id} className="group">
                  <div className="aura-card overflow-hidden rounded-lg transition-all duration-300 hover:-translate-y-2 h-full">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center text-sm text-aura-textSecondary mb-2">
                        <span>{post.date}</span>
                        <span className="mx-2">•</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="font-bold mb-2 group-hover:text-aura-accent transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-aura-textSecondary line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center px-6 py-3 border border-aura-accent rounded-md text-aura-accent hover:bg-aura-accent/10 transition-colors"
            >
              View All Articles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPostPage;
