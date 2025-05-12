
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "./types";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <div 
      className="rounded-lg overflow-hidden border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-all duration-300 h-full group"
    >
      <Link to={`/portfolio/${project.id}`} className="block">
        <div className="h-52 overflow-hidden relative">
          <img 
            src={project.image} 
            alt={project.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-aura-accent/90 text-white text-xs font-medium px-2 py-1 rounded-full">
            {project.category}
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2 font-heading group-hover:text-aura-accent transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-aura-textSecondary mb-4">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-aura-backgroundLight text-xs px-2 py-1 rounded-full border border-aura-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-aura-accent hover:bg-aura-accent/10 p-0"
          >
            View Project <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </Link>
    </div>
  );
};

export default ProjectCard;
