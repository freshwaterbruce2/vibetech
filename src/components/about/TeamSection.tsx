
import React from "react";
import { Youtube, Gamepad } from "lucide-react";

const TeamSection = () => {
  const teamMembers = [
    {
      name: "Bruce Freshwater",
      position: "CEO & Founder",
      image: "/placeholder.svg"
    },
    {
      name: "Blake Freshwater",
      position: "Social Media & Gaming Director",
      image: "/placeholder.svg",
      icons: [
        <Youtube key="youtube" className="h-4 w-4 text-aura-accent" />,
        <Gamepad key="gamepad" className="h-4 w-4 text-aura-accent" />
      ]
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
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading">Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
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
              <p className="text-aura-accent text-sm mb-2">{member.position}</p>
              {member.icons && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  {member.icons}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
