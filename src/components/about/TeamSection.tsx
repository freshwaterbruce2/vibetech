
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface FamilyMember {
  name: string;
  relation: string;
  imageUrl: string;
}

const familyMembers: FamilyMember[] = [
  {
    name: "Bruce Freshwater",
    relation: "Father & Founder",
    imageUrl: "/lovable-uploads/08428935-73c2-4027-a962-e5ef443f73ce.png"
  }, 
  {
    name: "Vanessa Freshwater",
    relation: "Mother & Operations Director",
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format"
  },
  {
    name: "Blake Freshwater",
    relation: "Son & Media Director",
    imageUrl: "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?q=80&w=600&auto=format"
  }, 
  {
    name: "Emma Freshwater",
    relation: "Daughter & Designer",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format"
  }, 
  {
    name: "Apollo Freshwater",
    relation: "Son & Developer",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format"
  },
  {
    name: "Max Freshwater",
    relation: "Family Dog",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format"
  }
];

const TeamSection: React.FC = () => {
  const handleFamilyMemberClick = (name: string, relation: string) => {
    toast({
      title: `${name}`,
      description: `${relation}`,
      variant: "success"
    });
  };

  return (
    <section className="content-section py-16">
      <div className="flex items-center justify-center gap-3 mb-2">
        <Users className="h-6 w-6 text-fuchsia-400" />
        <h2 className="text-3xl font-bold text-fuchsia-600 font-heading">Meet Our Family</h2>
      </div>
      <p className="text-center text-white/80 mb-10 max-w-xl mx-auto">
        At Vibe Tech, we're more than just a company - we're a family dedicated to creating incredible digital experiences together.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.map((member, index) => (
          <div 
            key={index} 
            className="glass-card p-4 cursor-pointer hover:shadow-lg transition-shadow duration-300" 
            onClick={() => handleFamilyMemberClick(member.name, member.relation)}
          >
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={member.imageUrl} alt={member.name} />
              <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold text-center text-white">{member.name}</h3>
            <p className="text-center text-white">{member.relation}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
