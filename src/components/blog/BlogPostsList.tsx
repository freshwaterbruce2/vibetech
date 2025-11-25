
import { BlogPost } from "./types";
import BlogPostCard from "./BlogPostCard";

interface BlogPostsListProps {
  posts: BlogPost[];
}

const BlogPostsList = ({ posts }: BlogPostsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
      
      {posts.length === 0 && (
        <div className="text-center py-10 col-span-2">
          <p className="text-aura-textSecondary">No posts found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default BlogPostsList;
