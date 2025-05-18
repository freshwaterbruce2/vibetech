
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "John Doe",
    role: "CEO",
    imageUrl: "https://avatars.dicebear.com/api/male/JohnDoe.svg"
  }, 
  {
    name: "Jane Smith",
    role: "CTO",
    imageUrl: "https://avatars.dicebear.com/api/female/JaneSmith.svg"
  }, 
  {
    name: "Mike Johnson",
    role: "Lead Developer",
    imageUrl: "https://avatars.dicebear.com/api/male/MikeJohnson.svg"
  }, 
  {
    name: "Emily Brown",
    role: "UX Designer",
    imageUrl: "https://avatars.dicebear.com/api/female/EmilyBrown.svg"
  }
];

const TeamSection: React.FC = () => {
  const handleTeamMemberClick = (name: string, role: string) => {
    toast({
      title: `${name}`,
      description: `${role}`,
      variant: "success"
    });
  };

  return (
    <section className="content-section">
      <h2 className="text-3xl font-bold mb-8 text-fuchsia-600">Our Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamMembers.map((member, index) => (
          <div 
            key={index} 
            className="glass-card p-4 cursor-pointer hover:shadow-lg transition-shadow duration-300" 
            onClick={() => handleTeamMemberClick(member.name, member.role)}
          >
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={member.imageUrl} alt={member.name} />
              <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold text-center text-white">{member.name}</h3>
            <p className="text-center text-white">{member.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
