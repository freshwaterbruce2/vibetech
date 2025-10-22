
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
      className="glass-card p-6 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 block h-full"
    >
      <div className="h-48 overflow-hidden relative -mx-6 -mt-6 mb-5 rounded-t-xl">
        <img 
          src={post.image} 
          alt={post.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-aura-accent/90 text-white text-xs font-medium px-2 py-1 rounded-full">
          {post.category}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">{post.title}</h3>
      <div className="flex items-center text-xs text-aura-textSecondary/70 mb-3">
        <Calendar className="h-3.5 w-3.5 mr-1" />
        <span className="mr-3">{post.date}</span>
        <Clock className="h-3.5 w-3.5 mr-1" />
        <span>{post.readTime}</span>
      </div>
      <p className="text-sm text-slate-200/90 mb-4">
        {post.excerpt}
      </p>
      <div className="flex items-center text-[#8d4dff] group-hover:underline mt-auto">
        Read More <ChevronRight className="h-4 w-4 ml-1" />
      </div>
    </Link>
  );
};

export default BlogPostCard;
