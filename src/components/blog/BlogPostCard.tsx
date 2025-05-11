
import { Link } from "react-router-dom";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { BlogPost } from "./types";

interface BlogPostCardProps {
  post: BlogPost;
}

const BlogPostCard = ({ post }: BlogPostCardProps) => {
  return (
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
  );
};

export default BlogPostCard;
