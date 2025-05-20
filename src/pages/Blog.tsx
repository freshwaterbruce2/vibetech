
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { blogPosts } from "@/components/blog/blogData";
import BlogHero from "@/components/blog/BlogHero";
import BlogSearch from "@/components/blog/BlogSearch";
import BlogPostsList from "@/components/blog/BlogPostsList";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogCTA from "@/components/blog/BlogCTA";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { categoryName, tagName } = useParams();
  const navigate = useNavigate();
  
  // Reset search when navigating between categories/tags
  useEffect(() => {
    setSearchQuery("");
  }, [categoryName, tagName]);

  const filterPosts = () => {
    let filtered = blogPosts;
    
    // Filter by category if viewing a category page
    if (categoryName) {
      filtered = filtered.filter(post => 
        post.category.toLowerCase() === categoryName.toLowerCase()
      );
    }
    
    // Filter by tag if viewing a tag page
    if (tagName) {
      filtered = filtered.filter(post => 
        post.tags.some(tag => tag.toLowerCase() === tagName.toLowerCase())
      );
    }
    
    // Apply search query filtering on top of category/tag filtering
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredPosts = filterPosts();

  const handleTagClick = (tag: string) => {
    navigate(`/blog/tag/${tag.toLowerCase()}`);
  };

  return (
    <PageLayout 
      title={categoryName ? `${categoryName} Blog Posts` : tagName ? `Posts tagged with ${tagName}` : "Blog"} 
      description="Explore the latest insights, trends, and updates from Vibe Tech. Our blog covers web development, UI/UX design, tech innovations, and digital strategy."
      keywords="tech blog, web development insights, UI/UX trends, tech news, digital strategy, Bruce Freshwater blog"
    >
      <BlogHero />
      
      {/* Breadcrumb navigation */}
      <div className="px-4 py-2 max-w-6xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
            </BreadcrumbItem>
            {categoryName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-aura-accent">Category: {categoryName}</span>
                </BreadcrumbItem>
              </>
            )}
            {tagName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-aura-accent">Tag: {tagName}</span>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <BlogSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Blog Grid */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Blog Posts */}
            <div className="lg:col-span-2">
              {(categoryName || tagName) && (
                <h2 className="text-2xl font-heading mb-6 text-white">
                  {categoryName ? `Posts in ${categoryName}` : `Posts tagged with "${tagName}"`}
                  <span className="text-sm ml-2 text-aura-textSecondary">
                    ({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})
                  </span>
                </h2>
              )}
              <BlogPostsList posts={filteredPosts} />
            </div>

            {/* Sidebar */}
            <BlogSidebar 
              blogPosts={blogPosts}
              onTagClick={handleTagClick}
              currentCategory={categoryName}
            />
          </div>
        </div>
      </section>

      <BlogCTA />
    </PageLayout>
  );
};

export default Blog;
