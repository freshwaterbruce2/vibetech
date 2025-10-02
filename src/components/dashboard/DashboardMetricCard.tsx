
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description: React.ReactNode;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
}

const DashboardMetricCard = ({ title, value, description, icon: Icon, trend }: MetricCardProps) => {
  return (
    <Card className="bg-aura-backgroundLight border-aura-accent/10">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">{value}</CardTitle>
          <Icon className="h-5 w-5 text-aura-accent" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-aura-textSecondary">
          {trend && (
            <span className={trend.positive ? "text-green-500" : "text-red-500"}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}{" "}
          {description}
        </div>
      </CardContent>
    </Card>
  );
};

export { DashboardMetricCard };
export default DashboardMetricCard;
