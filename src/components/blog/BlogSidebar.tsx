
import { BlogPost } from "./types";
import BlogCategories from "./BlogCategories";
import BlogTags from "./BlogTags";
import BlogSubscribe from "./BlogSubscribe";

interface BlogSidebarProps {
  blogPosts: BlogPost[];
  onTagClick: (tag: string) => void;
}

const BlogSidebar = ({ blogPosts, onTagClick }: BlogSidebarProps) => {
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
    <div className="lg:col-span-1">
      <BlogCategories categories={categories} />
      <BlogTags tagCounts={tagCounts} onTagClick={onTagClick} />
      <BlogSubscribe />
    </div>
  );
};

export default BlogSidebar;
