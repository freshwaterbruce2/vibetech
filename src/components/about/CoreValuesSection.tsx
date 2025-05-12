
import React from "react";
import { Code, User, Briefcase } from "lucide-react";

const CoreValuesSection = () => {
  const coreValues = [
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
  ];

  return (
    <section className="py-16 px-4 bg-aura-backgroundLight/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coreValues.map((value, index) => (
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
  );
};

export default CoreValuesSection;
