
import { Link } from "react-router-dom";
import { Tag } from "lucide-react";

interface BlogTagsProps {
  tagCounts: {[key: string]: number};
  onTagClick: (tag: string) => void;
}

const BlogTags = ({ tagCounts, onTagClick }: BlogTagsProps) => {
  return (
    <div className="mb-8 p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
      <h3 className="text-xl font-semibold mb-4 font-heading text-white">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(tagCounts).map(([tag, count]) => (
          <Link
            key={tag}
            to={`/blog/tag/${tag.toLowerCase()}`}
            onClick={(e) => {
              e.preventDefault();
              onTagClick(tag);
            }}
            className="bg-aura-backgroundLight/50 text-white text-xs px-3 py-1.5 rounded-full border border-aura-accent/20 hover:bg-aura-accent/20 hover:border-aura-accent/40 transition-colors flex items-center gap-1"
          >
            <Tag className="h-3 w-3" />
            {tag}
            <span className="bg-aura-accent/20 text-white rounded-full h-4 w-4 inline-flex items-center justify-center text-[10px]">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogTags;
