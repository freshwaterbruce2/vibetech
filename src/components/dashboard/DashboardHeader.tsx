
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
}

const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-aura-neonBlue to-aura-neonCyan bg-clip-text text-transparent">
        {title}
      </h1>
      <Button className="bg-gradient-to-r from-aura-neonBlue to-aura-neonCyan hover:opacity-90 transition-opacity flex items-center gap-2">
        <PlusCircle className="h-4 w-4" />
        New Lead
      </Button>
    </div>
  );
};

export default DashboardHeader;
