
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BlogCategoriesProps {
  categories: string[];
  currentCategory?: string;
}

const BlogCategories = ({ categories, currentCategory }: BlogCategoriesProps) => {
  const { categoryName } = useParams();
  
  // Use either the passed currentCategory or the URL param
  const activeCategoryName = currentCategory || categoryName;
  
  return (
    <div className="mb-8 p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
      <h3 className="text-xl font-semibold mb-4 font-heading">Categories</h3>
      <ul className="space-y-2">
        {categories.map((category, index) => {
          const isActive = activeCategoryName?.toLowerCase() === category.toLowerCase();
          
          return (
            <li key={index}>
              <Link 
                to={`/blog/category/${category.toLowerCase()}`}
                className={`flex items-center justify-between transition-colors ${
                  isActive 
                    ? "text-aura-accent font-medium" 
                    : "text-aura-textSecondary hover:text-aura-accent"
                }`}
              >
                <span>{category}</span>
                <ChevronRight className={`h-4 w-4 ${isActive ? "text-aura-accent" : ""}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BlogCategories;
