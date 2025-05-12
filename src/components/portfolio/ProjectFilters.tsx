
import { Button } from "@/components/ui/button";

interface ProjectFiltersProps {
  categories: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const ProjectFilters = ({ categories, activeFilter, onFilterChange }: ProjectFiltersProps) => {
  return (
    <section className="pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {categories.map((category) => (
            <Button 
              key={category}
              variant={activeFilter === category ? "default" : "outline"}
              onClick={() => onFilterChange(category)}
              className={`capitalize ${
                activeFilter === category 
                  ? "bg-aura-accent hover:bg-aura-accent/90" 
                  : "border-aura-accent/40 text-aura-textSecondary hover:bg-aura-accent/10"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectFilters;
