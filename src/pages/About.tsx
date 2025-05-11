import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Code, User, Briefcase, ArrowRight } from "lucide-react";
import ParticleNetworkCanvas from "@/components/ui/particle-network";

const About = () => {
  useEffect(() => {
    document.title = "About | Vibe Tech";
  }, []);

  return (
    <div className="min-h-screen bg-aura-background">
      <NavBar />
      <ParticleNetworkCanvas className="z-0" particleCount={20} opacity={0.1} />
      
      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading">
            About <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Vibe Tech</span>
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-aura-accent to-purple-400 mb-10 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <p className="text-aura-textSecondary text-lg mb-6">
                Vibe Tech is a cutting-edge tech company focused on creating innovative digital solutions that combine stunning design with powerful functionality.
              </p>
              <p className="text-aura-textSecondary text-lg mb-6">
                Founded in 2020, our team brings together decades of combined experience in software development, UI/UX design, and digital strategy to deliver exceptional results for our clients.
              </p>
              <p className="text-aura-textSecondary text-lg">
                Our mission is to help businesses and individuals harness the power of technology to achieve their goals, with a focus on creating intuitive, accessible, and visually striking digital experiences.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-aura-accent/20 to-transparent rounded-lg blur-xl"></div>
              <div className="relative tech-border rounded-lg overflow-hidden h-full">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158" 
                  alt="Team working on tech projects" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 bg-aura-backgroundLight/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Innovation",
                icon: <Code className="h-10 w-10 text-aura-accent" />,
                description: "We constantly push the boundaries of what's possible in digital technology, staying at the forefront of industry trends and developments."
              },
              {
                title: "User-Centric",
                icon: <User className="h-10 w-10 text-aura-accent" />,
                description: "Every solution we create puts the user experience first, ensuring intuitive interfaces and seamless interactions."
              },
              {
                title: "Excellence",
                icon: <Briefcase className="h-10 w-10 text-aura-accent" />,
                description: "We strive for excellence in all we do, maintaining the highest standards of quality in our code, design, and client relationships."
              }
            ].map((value, index) => (
              <div 
                key={index} 
                className="p-8 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-shadow"
              >
                <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-aura-accent/10 border border-aura-accent/20">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 font-heading">{value.title}</h3>
                <p className="text-aura-textSecondary">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center font-heading">Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Alex Johnson",
                position: "CEO & Founder",
                image: "/placeholder.svg"
              },
              {
                name: "Sam Rivera",
                position: "Lead Developer",
                image: "/placeholder.svg"
              },
              {
                name: "Jordan Lee",
                position: "UX/UI Designer",
                image: "/placeholder.svg"
              },
              {
                name: "Taylor Kim",
                position: "Project Manager",
                image: "/placeholder.svg"
              }
            ].map((member, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-lg border border-aura-accent/20 bg-aura-background hover:shadow-neon transition-shadow"
              >
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-2 border-aura-accent/40">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1 font-heading">{member.name}</h3>
                <p className="text-aura-accent text-sm mb-4">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-aura-background to-aura-backgroundLight">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Work With Us?</h2>
          <p className="text-aura-textSecondary mb-8 text-lg max-w-2xl mx-auto">
            Let's turn your vision into reality. Our team is ready to help you create exceptional digital experiences.
          </p>
          <Button asChild size="lg" className="bg-aura-accent hover:bg-aura-accent/90 group">
            <Link to="/contact">
              Contact Us 
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default About;
