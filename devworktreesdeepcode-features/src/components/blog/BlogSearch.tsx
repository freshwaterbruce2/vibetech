
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface BlogSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const BlogSearch = ({ searchQuery, setSearchQuery }: BlogSearchProps) => {
  return (
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
  );
};

export default BlogSearch;
