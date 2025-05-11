
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BlogCategoriesProps {
  categories: string[];
}

const BlogCategories = ({ categories }: BlogCategoriesProps) => {
  return (
    <div className="mb-8 p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
      <h3 className="text-xl font-semibold mb-4 font-heading">Categories</h3>
      <ul className="space-y-2">
        {categories.map((category, index) => (
          <li key={index}>
            <Link 
              to={`/blog/category/${category.toLowerCase()}`}
              className="flex items-center justify-between text-aura-textSecondary hover:text-aura-accent transition-colors"
            >
              <span>{category}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlogCategories;
