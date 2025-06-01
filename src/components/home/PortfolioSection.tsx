
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";

interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: "Hotel Booking Platform",
    description: "A modern booking platform with advanced search and real-time availability.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1800&auto=format"
  },
  {
    id: 2,
    title: "Vibe-Rentals",
    description: "A rental property listing platform where landlords can list properties free of charge.",
    image: "/lovable-uploads/0930ed3b-7a63-492d-87c3-9a547af4aa27.png"
  },
  {
    id: 3,
    title: "Neon Dashboard",
    description: "A React & Node.js platform that doubled engagement in 30 days.",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1800&auto=format"
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
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
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
