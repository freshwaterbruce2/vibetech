
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Search, Calendar, Clock, ChevronRight, Tag } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  tags: string[];
}

const Blog = () => {
  useEffect(() => {
    document.title = "Blog | Vibe Tech";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "The Future of AI in Web Development",
      excerpt: "Exploring how artificial intelligence is transforming the way we build websites and web applications.",
      category: "Technology",
      date: "May 10, 2023",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
      tags: ["AI", "Web Development", "Future Tech"]
    },
    {
      id: 2,
      title: "Designing for Dark Mode: Best Practices",
      excerpt: "Tips and techniques for creating effective and appealing dark mode interfaces for your digital products.",
      category: "Design",
      date: "April 22, 2023",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      tags: ["UI/UX", "Dark Mode", "Design"]
    },
    {
      id: 3,
      title: "Understanding WebAssembly",
      excerpt: "A deep dive into WebAssembly and how it's changing the performance landscape of web applications.",
      category: "Programming",
      date: "March 15, 2023",
      readTime: "10 min read",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      tags: ["WebAssembly", "Performance", "JavaScript"]
    },
    {
      id: 4,
      title: "The Rise of Micro Frontends",
      excerpt: "How breaking down frontend monoliths into smaller, more manageable pieces is changing development teams.",
      category: "Architecture",
      date: "February 28, 2023",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
      tags: ["Micro Frontends", "Architecture", "Team Structure"]
    },
    {
      id: 5,
      title: "Implementing Secure Authentication",
      excerpt: "Best practices for implementing robust and secure authentication in your web applications.",
      category: "Security",
      date: "January 17, 2023",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      tags: ["Security", "Authentication", "Web Development"]
    },
    {
      id: 6,
      title: "CSS Grid vs Flexbox",
      excerpt: "A comprehensive comparison between CSS Grid and Flexbox for modern web layouts.",
      category: "CSS",
      date: "December 5, 2022",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      tags: ["CSS", "Layout", "Frontend"]
    }
  ];

  const filteredPosts = searchQuery
    ? blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : blogPosts;

  // Get all unique categories
  const categories = [...new Set(blogPosts.map(post => post.category))];
  
  // Get all unique tags and count occurrences
  const tagCounts: {[key: string]: number} = {};
  blogPosts.forEach(post => {
    post.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading">
            Our <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Blog</span>
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-aura-accent to-purple-400 mb-6 rounded-full"></div>
          <p className="text-aura-textSecondary text-lg max-w-3xl">
            Insights, tutorials, and updates from our team on web development, design, and technology.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-aura-textSecondary/50" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-aura-textSecondary"
            />
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Blog Posts */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <Link 
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="rounded-lg overflow-hidden border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-all duration-300 group"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-aura-accent/90 text-white text-xs font-medium px-2 py-1 rounded-full">
                        {post.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 font-heading group-hover:text-aura-accent transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center text-xs text-aura-textSecondary/70 mb-3">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span className="mr-3">{post.date}</span>
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                      <p className="text-sm text-aura-textSecondary mb-4">
                        {post.excerpt}
                      </p>
                      <div className="flex text-aura-accent group-hover:underline">
                        Read More <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-aura-textSecondary">No posts found matching your search.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Categories */}
              <div className="mb-8 p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
                <h3 className="text-xl font-semibold mb-4 font-heading">Categories</h3>
                <ul className="space-y-2">
                  {categories.map((category, index) => (
                    <li key={index}>
                      <Link 
                        to={`/blog/category/${category.toLowerCase()}`}
                        className="flex items-center justify-between text-aura-textSecondary hover:text-aura-accent transition-colors"
                      >
                        <span>{category}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Tags */}
              <div className="mb-8 p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
                <h3 className="text-xl font-semibold mb-4 font-heading">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tagCounts).map(([tag, count]) => (
                    <Link
                      key={tag}
                      to={`/blog/tag/${tag.toLowerCase()}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setSearchQuery(tag);
                      }}
                      className="bg-aura-backgroundLight/50 text-aura-textSecondary text-xs px-3 py-1.5 rounded-full border border-aura-accent/20 hover:bg-aura-accent/20 hover:border-aura-accent/40 transition-colors flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <span className="bg-aura-accent/20 text-aura-textSecondary rounded-full h-4 w-4 inline-flex items-center justify-center text-[10px]">
                        {count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
                <h3 className="text-xl font-semibold mb-4 font-heading">Subscribe</h3>
                <p className="text-aura-textSecondary text-sm mb-4">
                  Stay updated with our latest articles and insights. Subscribe to our newsletter.
                </p>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="bg-aura-backgroundLight/20 border-aura-accent/20 focus-visible:ring-aura-accent/30 text-aura-textSecondary"
                  />
                  <Button className="w-full bg-aura-accent hover:bg-aura-accent/90">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-aura-backgroundLight/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Have a Topic in Mind?</h2>
          <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
            Is there a specific topic you'd like us to cover in our blog? Let us know and we might write about it!
          </p>
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
            <Link to="/contact">Suggest a Topic</Link>
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Blog;
