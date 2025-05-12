
import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { blogPosts } from "@/components/blog/blogData";
import BlogHero from "@/components/blog/BlogHero";
import BlogSearch from "@/components/blog/BlogSearch";
import BlogPostsList from "@/components/blog/BlogPostsList";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogCTA from "@/components/blog/BlogCTA";

const Blog = () => {
  useEffect(() => {
    document.title = "Blog | Vibe Tech";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = searchQuery
    ? blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : blogPosts;

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  return (
    <div className="min-h-screen bg-radial-tech bg-fixed bg-cover">
      <NavBar />
      
      <BlogHero />
      <BlogSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Blog Grid */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Blog Posts */}
            <div className="lg:col-span-2">
              <BlogPostsList posts={filteredPosts} />
            </div>

            {/* Sidebar */}
            <BlogSidebar 
              blogPosts={blogPosts}
              onTagClick={handleTagClick}
            />
          </div>
        </div>
      </section>

      <BlogCTA />
      <Footer />
    </div>
  );
};

export default Blog;
