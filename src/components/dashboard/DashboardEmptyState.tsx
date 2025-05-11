
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DashboardEmptyState = ({ icon: Icon, title, description }: DashboardEmptyStateProps) => {
  return (
    <Card className="bg-aura-darkBgLight/80 backdrop-blur-sm border-aura-neonBlue/20 tech-card">
      <CardHeader>
        <CardTitle className="text-aura-text">{title}</CardTitle>
        <CardDescription className="text-aura-textSecondary">Manage your {title.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="h-80 flex items-center justify-center">
        <div className="text-center">
          <Icon className="h-12 w-12 mx-auto mb-4 text-aura-neonBlue" />
          <h3 className="text-lg font-medium mb-1 text-aura-text">No {title.toLowerCase()} yet</h3>
          <p className="text-aura-textSecondary">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardEmptyState;
