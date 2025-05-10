
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    document.title = "Aura | Home";
  }, []);

  const placeholderAvatar = "/placeholder.svg";

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
          {/* Left side - Avatar */}
          <div className="w-full md:w-1/3 mb-10 md:mb-0 spotlight">
            <div className="relative w-64 h-64 mx-auto">
              <img 
                src={placeholderAvatar} 
                alt="Avatar" 
                className="rounded-full object-cover animate-glow"
              />
            </div>
          </div>
          
          {/* Right side - Text */}
          <div className="w-full md:w-2/3 md:pl-12">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Hello! I'm <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Your Name</span>
            </h1>
            <div className="mb-6 flex items-center">
              <span className="text-2xl md:text-3xl font-semibold">
                I'm a <span className="text-aura-accent">Software Engineer</span>
              </span>
              <span className="ml-1 text-3xl animate-pulse">|</span>
            </div>
            <p className="text-aura-textSecondary text-lg mb-8 max-w-2xl">
              Currently, I'm a Software Engineer at Facebook. I specialize in building exceptional digital experiences that are fast, accessible, and visually appealing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
                <Link to="/portfolio">View My Work</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-aura-accent text-aura-accent hover:bg-aura-accent/10">
                <Link to="/contact">Get In Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-aura-backgroundLight/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">Services I Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Web Development",
                description: "Modern, responsive websites built with the latest technologies and best practices for optimal performance."
              },
              {
                title: "UI/UX Design",
                description: "Intuitive interfaces and user experiences that balance aesthetics with functionality."
              },
              {
                title: "Custom Software",
                description: "Tailored software solutions that address specific business challenges and objectives."
              },
              {
                title: "App Development",
                description: "Native and cross-platform mobile applications with seamless user experiences."
              }
            ].map((service, index) => (
              <div 
                key={index} 
                className="p-6 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-3 font-heading">{service.title}</h3>
                <p className="text-aura-textSecondary">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Highlights */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">Recent Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((project) => (
              <Link 
                key={project}
                to={`/portfolio/project-${project}`}
                className="group"
              >
                <div className="rounded-lg overflow-hidden border border-aura-accent/20 bg-aura-background hover:shadow-lg transition-all duration-300 h-full">
                  <div className="h-48 bg-aura-backgroundLight/50 overflow-hidden">
                    <img 
                      src={`/placeholder.svg`} 
                      alt={`Project ${project}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 font-heading group-hover:text-aura-accent transition-colors">
                      Project Title {project}
                    </h3>
                    <p className="text-sm text-aura-textSecondary">
                      Brief description of the project and the technologies used.
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild className="bg-aura-accent hover:bg-aura-accent/90">
              <Link to="/portfolio">View All Projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-16 px-4 bg-aura-backgroundLight/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((post) => (
              <Link 
                key={post}
                to={`/blog/post-${post}`}
                className="group"
              >
                <div className="rounded-lg overflow-hidden border border-aura-accent/20 bg-aura-background hover:shadow-lg transition-all duration-300 h-full p-6">
                  <div className="mb-4">
                    <span className="text-xs uppercase tracking-wider text-aura-accent">
                      Category
                    </span>
                    <h3 className="text-xl font-semibold my-2 font-heading group-hover:text-aura-accent transition-colors">
                      Blog Post Title {post}
                    </h3>
                    <p className="text-sm text-aura-textSecondary mb-3">
                      May 10, 2023
                    </p>
                  </div>
                  <p className="text-aura-textSecondary">
                    Brief excerpt from the blog post that gives readers an idea of what the article is about...
                  </p>
                  <div className="mt-4 text-aura-accent group-hover:underline">Read more</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="border-aura-accent text-aura-accent hover:bg-aura-accent/10">
              <Link to="/blog">Read All Articles</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-aura-background to-aura-backgroundLight">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Let's Work Together</h2>
          <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
            Ready to bring your ideas to life? Get in touch today to discuss how we can collaborate on your next project.
          </p>
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90">
            <Link to="/contact">Contact Me</Link>
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
