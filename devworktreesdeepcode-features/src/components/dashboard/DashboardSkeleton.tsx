
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 bg-aura-backgroundLight/50" />
        ))}
      </div>
      <Skeleton className="h-96 bg-aura-backgroundLight/50" />
    </div>
  );
};

export default DashboardSkeleton;
