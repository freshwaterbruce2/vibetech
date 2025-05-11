
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
}

const DashboardHeader = ({ title }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl md:text-4xl font-bold font-heading bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent">
        {title}
      </h1>
      <Button className="bg-gradient-to-r from-aura-accent to-aura-accentSecondary">
        + New Lead
      </Button>
    </div>
  );
};

export default DashboardHeader;
