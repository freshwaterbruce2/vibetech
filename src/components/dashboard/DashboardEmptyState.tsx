
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DashboardEmptyState = ({ icon: Icon, title, description }: DashboardEmptyStateProps) => {
  return (
    <Card className="bg-aura-backgroundLight border-aura-accent/10">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Manage your {title.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="h-80 flex items-center justify-center">
        <div className="text-center">
          <Icon className="h-12 w-12 mx-auto mb-4 text-aura-accent/40" />
          <h3 className="text-lg font-medium mb-1">No {title.toLowerCase()} yet</h3>
          <p className="text-aura-textSecondary">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardEmptyState;
