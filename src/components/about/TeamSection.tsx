
import React from "react";
import { Youtube, Gamepad, Github, Linkedin, Twitter } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "@/hooks/use-toast";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Bruce Freshwater",
      position: "CEO & Founder",
      image: "/placeholder.svg",
      socialLinks: [
        { icon: <Linkedin key="linkedin" className="h-4 w-4 text-aura-accent" />, url: "#" },
        { icon: <Twitter key="twitter" className="h-4 w-4 text-aura-accent" />, url: "#" }
      ]
    },
    {
      name: "Blake Freshwater",
      position: "Social Media & Gaming Director",
      image: "/placeholder.svg",
      socialLinks: [
        { icon: <Youtube key="youtube" className="h-4 w-4 text-aura-accent" />, url: "#" },
        { icon: <Gamepad key="gamepad" className="h-4 w-4 text-aura-accent" />, url: "#" },
        { icon: <Twitter key="twitter" className="h-4 w-4 text-aura-accent" />, url: "#" }
      ]
    },
    {
      name: "Sam Rivera",
      position: "Lead Developer",
      image: "/placeholder.svg",
      socialLinks: [
        { icon: <Github key="github" className="h-4 w-4 text-aura-accent" />, url: "#" },
        { icon: <Twitter key="twitter" className="h-4 w-4 text-aura-accent" />, url: "#" }
      ]
    },
    {
      name: "Jordan Lee",
      position: "UX/UI Designer",
      image: "/placeholder.svg",
      socialLinks: [
        { icon: <Linkedin key="linkedin" className="h-4 w-4 text-aura-accent" />, url: "#" },
        { icon: <Github key="github" className="h-4 w-4 text-aura-accent" />, url: "#" }
      ]
    }
  ];

  const handleContactMember = (name: string) => {
    toast({
      title: `Contact ${name}`,
      description: `You've requested to contact ${name}. A contact form will be sent to your email.`,
      variant: "accent",
      duration: 5000
    });
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-[#0B0B17] to-[#111125]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-center font-heading gradient-text inline-block">Our Team</h2>
          <p className="text-aura-textSecondary max-w-2xl mx-auto">
            Meet the innovative minds behind our solutions. Our team combines expertise 
            in development, design, and strategy to deliver cutting-edge results.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className="glass-card transition-all duration-300 hover:shadow-neon hover:translate-y-[-5px] group"
            >
              <div className="p-6 flex flex-col items-center">
                <div className="w-32 h-32 mb-6 overflow-hidden rounded-full border-2 border-aura-accent/40 relative">
                  <AspectRatio ratio={1/1} className="w-full h-full">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h3 className="text-xl font-semibold mb-1 font-heading">{member.name}</h3>
                <p className="text-aura-accent text-sm mb-4">{member.position}</p>
                
                {member.socialLinks && (
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {member.socialLinks.map((link, i) => (
                      <a 
                        key={i}
                        href={link.url} 
                        className="p-2 rounded-full hover:bg-aura-accent/10 transition-colors"
                        aria-label={`${member.name}'s social link`}
                      >
                        {link.icon}
                      </a>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={() => handleContactMember(member.name)}
                  className="text-sm font-medium text-aura-accent hover:text-aura-accent/80 transition-colors mt-2"
                >
                  Contact
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
