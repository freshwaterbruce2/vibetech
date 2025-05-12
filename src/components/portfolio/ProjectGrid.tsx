
import ProjectCard from "./ProjectCard";
import { Project } from "./types";
import { motion } from "framer-motion";

interface ProjectGridProps {
  projects: Project[];
}

const ProjectGrid = ({ projects }: ProjectGridProps) => {
  return (
    <section className="pb-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        {projects.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-aura-textSecondary">No projects found matching the selected filter.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectGrid;
