
import { BlogPost } from "./types";
import BlogCategories from "./BlogCategories";
import BlogTags from "./BlogTags";
import BlogSubscribe from "./BlogSubscribe";
import { Link } from "react-router-dom";

interface BlogSidebarProps {
  blogPosts: BlogPost[];
  onTagClick: (tag: string) => void;
  currentCategory?: string;
}

const BlogSidebar = ({ blogPosts, onTagClick, currentCategory }: BlogSidebarProps) => {
  // Get all unique categories
  const categories = [...new Set(blogPosts.map(post => post.category))];
  
  // Get all unique tags and count occurrences
  const tagCounts: {[key: string]: number} = {};
  blogPosts.forEach(post => {
    post.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Get recent posts (5 most recent)
  const recentPosts = [...blogPosts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="lg:col-span-1">
      <BlogCategories categories={categories} currentCategory={currentCategory} />
      
      {/* Recent Posts Section */}
      <div className="mb-8 p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
        <h3 className="text-xl font-semibold mb-4 font-heading">Recent Posts</h3>
        <ul className="space-y-3">
          {recentPosts.map((post) => (
            <li key={post.id}>
              <Link 
                to={`/blog/${post.id}`}
                className="group flex flex-col transition-colors hover:text-aura-accent"
              >
                <span className="font-medium line-clamp-1">{post.title}</span>
                <span className="text-sm text-aura-textSecondary">{new Date(post.date).toLocaleDateString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <BlogTags tagCounts={tagCounts} onTagClick={onTagClick} />
      <BlogSubscribe />
    </div>
  );
};

export default BlogSidebar;
