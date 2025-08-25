import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import BlogPostContent from "@/components/blog/BlogPostContent";
import { BlogPost } from "@/components/blog/types";
import { blogPosts as staticBlogPosts } from "@/components/blog/enhancedBlogData";

// Fallback static data - this will be replaced by database posts
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
    content: `Modern web development practices for building efficient applications.`
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
    content: `UI/UX design trends shaping the digital landscape.`
  }
];

const BlogPostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      document.title = "Blog Post | Vibe Tech";
      
      try {
        // First try to fetch from database
        const response = await fetch(`http://localhost:9001/api/blog/${postId}`);
        if (response.ok) {
          const dbPost = await response.json();
          setPost(dbPost);
          document.title = `${dbPost.title} | Vibe Tech`;
        } else {
          // Fallback to static posts (for existing content)
          const foundPost = [...staticBlogPosts, ...blogPostsData].find(p => 
            p.id?.toString() === postId || p.slug === postId
          );
          if (foundPost) {
            // Convert old format to new format
            const convertedPost = {
              ...foundPost,
              id: foundPost.id || parseInt(postId || '0'),
              affiliateRecommendations: foundPost.affiliateRecommendations || []
            } as BlogPost;
            setPost(convertedPost);
            document.title = `${foundPost.title} | Vibe Tech`;
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        // Fallback to static posts
        const foundPost = [...staticBlogPosts, ...blogPostsData].find(p => 
          p.id?.toString() === postId || p.slug === postId
        );
        if (foundPost) {
          const convertedPost = {
            ...foundPost,
            id: foundPost.id || parseInt(postId || '0'),
            affiliateRecommendations: foundPost.affiliateRecommendations || []
          } as BlogPost;
          setPost(convertedPost);
          document.title = `${foundPost.title} | Vibe Tech`;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
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
    <PageLayout>
      <BlogPostContent post={post} />
    </PageLayout>
  );
};

export default BlogPostPage;