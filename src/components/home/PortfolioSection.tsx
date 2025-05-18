
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";

interface Project {
  id: number;
  title: string;
  description: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Project Alpha",
    description: "A React & Node.js platform that doubled engagement in 30 days."
  },
  {
    id: 2,
    title: "Project Beta",
    description: "An accessible e-commerce build driving 40% more sales."
  },
  {
    id: 3,
    title: "Project Gamma",
    description: "A Flutter app noted for its seamless offline experience."
  }
];

const PortfolioSection = () => {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Spotlight on Recent Wins</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Link 
              key={project.id}
              to={`/portfolio/project-${project.id}`}
              className="group"
            >
              <div className="glass-card border border-[rgba(185,51,255,0.2)] hover:border-[rgba(185,51,255,0.4)] hover:shadow-neon-purple transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 h-full">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={`/placeholder.svg`} 
                    alt={`Project ${project.id}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
                    {project.title}
                  </h3>
                  <p className="text-white">
                    {project.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <NeonButton variant="gradient" asChild>
            <Link to="/portfolio">View All Projects</Link>
          </NeonButton>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
