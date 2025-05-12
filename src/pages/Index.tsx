
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NeonButton } from "@/components/ui/neon-button";
import PageLayout from "@/components/layout/PageLayout";

const Index = () => {
  useEffect(() => {
    document.title = "Vibe Tech | Home";
  }, []);

  const placeholderAvatar = "/placeholder.svg";

  return (
    <PageLayout>
      {/* Hero Section - Updated with glassmorphism and neon effects */}
      <section className="pt-28 pb-20">
        <div className="glass-card mx-auto max-w-6xl px-6 py-10 lg:flex lg:items-center relative z-10 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft">
          {/* Left side - Avatar with neon border */}
          <div className="w-full md:w-1/3 mb-10 md:mb-0 spotlight">
            <div className="relative w-64 h-64 mx-auto">
              <img 
                src={placeholderAvatar} 
                alt="Avatar" 
                className="rounded-full object-cover animate-glow border-4 border-[color:var(--c-purple)/80] shadow-[0_0_25px_var(--c-purple)]"
              />
            </div>
          </div>
          
          {/* Right side - Text with neon elements */}
          <div className="w-full md:w-2/3 md:pl-12">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Hello! I'm <span className="bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Your Name</span>
            </h1>
            <div className="mb-6 flex items-center">
              <span className="text-2xl md:text-3xl font-semibold">
                I'm a <span className="text-[color:var(--c-cyan)]">Software Engineer</span>
              </span>
              <span className="ml-1 text-3xl animate-pulse">|</span>
            </div>
            <p className="text-slate-200/90 text-lg mb-8 max-w-2xl">
              Currently, I'm a Software Engineer at Facebook. I specialize in building exceptional digital experiences that are fast, accessible, and visually appealing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <NeonButton variant="gradient" size="lg" asChild>
                <Link to="/portfolio">View My Work</Link>
              </NeonButton>
              <NeonButton variant="purple" size="lg" asChild>
                <Link to="/contact">Get In Touch</Link>
              </NeonButton>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - With glassmorphic cards */}
      <section className="py-16 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Services I Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                className="glass-card p-6 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
              >
                <h3 className="text-xl font-semibold mb-3 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">{service.title}</h3>
                <p className="text-slate-200/90">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Highlights - With glassmorphic cards */}
      <section className="py-16 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Recent Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((project) => (
              <Link 
                key={project}
                to={`/portfolio/project-${project}`}
                className="group"
              >
                <div className="glass-card border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 h-full">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={`/placeholder.svg`} 
                      alt={`Project ${project}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
                      Project Title {project}
                    </h3>
                    <p className="text-sm text-slate-200/90">
                      Brief description of the project and the technologies used.
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

      {/* Latest Blog Posts - With glassmorphic cards */}
      <section className="py-16 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((post) => (
              <Link 
                key={post}
                to={`/blog/post-${post}`}
                className="group"
              >
                <div className="glass-card border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 h-full p-6">
                  <div className="mb-4">
                    <span className="text-xs uppercase tracking-wider text-[color:var(--c-cyan)]">
                      Category
                    </span>
                    <h3 className="text-xl font-semibold my-2 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
                      Blog Post Title {post}
                    </h3>
                    <p className="text-sm text-slate-200/90 mb-3">
                      May 10, 2023
                    </p>
                  </div>
                  <p className="text-slate-200/90">
                    Brief excerpt from the blog post that gives readers an idea of what the article is about...
                  </p>
                  <div className="mt-4 text-[color:var(--c-cyan)] group-hover:drop-shadow-[0_0_6px_var(--c-cyan)] transition-all">Read more</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <NeonButton variant="blue" asChild>
              <Link to="/blog">Read All Articles</Link>
            </NeonButton>
          </div>
        </div>
      </section>

      {/* CTA Section - With gradient background */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center relative z-10 glass-card p-12 border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft">
          <h2 className="text-3xl font-bold mb-4 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Let's Work Together</h2>
          <p className="text-slate-200/90 mb-8 text-lg max-w-2xl mx-auto">
            Ready to bring your ideas to life? Get in touch today to discuss how we can collaborate on your next project.
          </p>
          <NeonButton variant="gradient" size="lg" asChild>
            <Link to="/contact">Contact Me</Link>
          </NeonButton>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
