
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { ExternalLink, Code, Globe, Tag } from "lucide-react";

type Project = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
}

const Portfolio = () => {
  useEffect(() => {
    document.title = "Portfolio | Vibe Tech";
  }, []);

  const [filter, setFilter] = useState<string>("all");

  const projects: Project[] = [
    {
      id: 1,
      title: "Neon Dashboard",
      category: "Web App",
      description: "A modern dashboard with data visualization features and real-time analytics.",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
      tags: ["React", "TypeScript", "Tailwind CSS"]
    },
    {
      id: 2,
      title: "Quantum",
      category: "Mobile App",
      description: "A cross-platform mobile app for tracking personal productivity and habits.",
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81",
      tags: ["React Native", "Firebase", "Redux"]
    },
    {
      id: 3,
      title: "Synthwave",
      category: "Web App",
      description: "An AI-powered music generation platform with collaborative features.",
      image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb",
      tags: ["Vue.js", "Web Audio API", "TensorFlow.js"]
    },
    {
      id: 4,
      title: "Orbit",
      category: "Website",
      description: "A space-themed educational platform for teaching astronomy concepts.",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
      tags: ["HTML/CSS", "JavaScript", "Three.js"]
    },
    {
      id: 5,
      title: "Pulse",
      category: "IoT",
      description: "Smart home system with customizable automation and voice control.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
      tags: ["IoT", "Node.js", "MQTT"]
    },
    {
      id: 6,
      title: "Halo",
      category: "Website",
      description: "Corporate website with custom CMS and interactive elements.",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      tags: ["WordPress", "PHP", "GSAP"]
    }
  ];

  const categories = ["all", ...new Set(projects.map(project => project.category.toLowerCase()))];
  
  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(project => project.category.toLowerCase() === filter);

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading">
            Our <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Portfolio</span>
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-aura-accent to-purple-400 mb-6 rounded-full"></div>
          <p className="text-aura-textSecondary text-lg max-w-3xl">
            Explore our collection of projects spanning web development, mobile applications, and custom software solutions.
          </p>
        </div>
      </section>

      {/* Filter Controls */}
      <section className="pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {categories.map((category) => (
              <Button 
                key={category}
                variant={filter === category ? "default" : "outline"}
                onClick={() => setFilter(category)}
                className={`capitalize ${
                  filter === category 
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

      {/* Projects Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
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
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-aura-backgroundLight/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Web Development",
                icon: <Code className="h-10 w-10 text-aura-accent" />,
                description: "We create responsive, high-performance websites and web applications using modern frameworks and technologies."
              },
              {
                title: "Digital Strategy",
                icon: <Globe className="h-10 w-10 text-aura-accent" />,
                description: "We help businesses develop comprehensive digital strategies to meet their objectives and reach target audiences."
              },
              {
                title: "Brand Identity",
                icon: <Tag className="h-10 w-10 text-aura-accent" />,
                description: "We design cohesive brand identities that communicate your values and resonate with your audience."
              }
            ].map((service, index) => (
              <div 
                key={index} 
                className="p-8 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-shadow"
              >
                <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-aura-accent/10 border border-aura-accent/20">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 font-heading">{service.title}</h3>
                <p className="text-aura-textSecondary">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Have a Project in Mind?</h2>
          <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
            Whether you need a website, mobile app, or custom software solution, we're here to help turn your vision into reality.
          </p>
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
            <Link to="/contact">Start a Project</Link>
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Portfolio;
