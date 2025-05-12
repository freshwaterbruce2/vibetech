
import { Link } from "react-router-dom";
import { ExternalLink, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "./types";
import { motion } from "framer-motion";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="rounded-lg overflow-hidden border border-aura-accent/20 bg-aura-backgroundLight/50 hover:shadow-neon-blue-soft transition-all duration-300 h-full group relative backdrop-blur-sm"
    >
      <Link to={`/portfolio/${project.id}`} className="block">
        <div className="h-60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-aura-background/30 z-10"></div>
          <img 
            src={project.image} 
            alt={project.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 right-3 bg-aura-accent/90 text-white text-xs font-medium px-3 py-1 rounded-full z-10 backdrop-blur-sm">
            {project.category}
          </div>
          
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-aura-background/60 transition-opacity duration-300 z-10">
            <Button 
              variant="ghost" 
              size="icon"
              className="bg-aura-accent/20 text-white hover:bg-aura-accent/40 rounded-full"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-6 relative z-10">
          <h3 className="text-xl font-semibold mb-3 font-heading group-hover:text-aura-accent transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-aura-textSecondary mb-4 line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-aura-background/50 text-xs px-2.5 py-1 rounded-full border border-aura-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-aura-accent hover:bg-aura-accent/10 p-0 group"
          >
            View Project <ExternalLink className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;
