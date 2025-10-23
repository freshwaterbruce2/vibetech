
import { motion } from "framer-motion";

interface ProjectFiltersProps {
  categories: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const ProjectFilters = ({ categories, activeFilter, onFilterChange }: ProjectFiltersProps) => {
  return (
    <motion.section 
      className="py-8 px-4 relative z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onFilterChange(category)}
              className={`px-5 py-2 text-sm rounded-full transition-all duration-300 relative ${
                activeFilter === category 
                  ? "text-white font-medium" 
                  : "text-white hover:text-white"
              }`}
            >
              {activeFilter === category && (
                <motion.span
                  layoutId="activePill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-aura-accent to-aura-accentSecondary/70 -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default ProjectFilters;
