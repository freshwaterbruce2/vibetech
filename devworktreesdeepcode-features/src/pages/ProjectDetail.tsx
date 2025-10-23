
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { projects } from "@/components/portfolio/projectsData";
import { motion } from "framer-motion";

const ProjectDetail = () => {
  const { projectId } = useParams();
  
  // Find project by ID - handle both "project-1" format and direct "1" format
  const id = projectId?.replace('project-', '') || projectId;
  const project = projects.find(p => p.id.toString() === id);

  if (!project) {
    return (
      <PageLayout title="Project Not Found">
        <div className="pt-28 pb-20 px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-300 mb-8">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/portfolio">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portfolio
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={project.title}
      description={project.description}
      keywords={`${project.title}, ${project.tags.join(', ')}, portfolio project`}
    >
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link to="/portfolio">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Portfolio
              </Link>
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Project Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="glass-card p-2 border border-[color:var(--c-purple)/20]">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>

            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <span className="inline-block bg-aura-accent/20 text-aura-accent text-sm font-medium px-3 py-1 rounded-full mb-4">
                  {project.category}
                </span>
                <h1 className="text-4xl lg:text-5xl font-bold font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text mb-4">
                  {project.title}
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Tech Stack */}
              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="bg-[rgba(148,38,255,0.1)] text-white text-sm px-3 py-1.5 rounded-full border border-[color:var(--c-purple)/20]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary hover:from-aura-accent/80 hover:to-aura-accentSecondary/80"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live Demo
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View Code
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Project Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
              Project Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-6 border border-[color:var(--c-purple)/20] text-center">
                <h3 className="text-xl font-semibold mb-3 text-white">Modern Design</h3>
                <p className="text-gray-300">Clean, intuitive interface with attention to user experience and accessibility.</p>
              </div>
              <div className="glass-card p-6 border border-[color:var(--c-purple)/20] text-center">
                <h3 className="text-xl font-semibold mb-3 text-white">Responsive</h3>
                <p className="text-gray-300">Fully responsive design that works seamlessly across all devices and screen sizes.</p>
              </div>
              <div className="glass-card p-6 border border-[color:var(--c-purple)/20] text-center">
                <h3 className="text-xl font-semibold mb-3 text-white">Performance</h3>
                <p className="text-gray-300">Optimized for speed and performance with modern development practices.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProjectDetail;
