
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";

const DashboardBackground = () => {
  return (
    <>
      {/* Reduced intensity by changing to 'low' from 'medium' */}
      <MeshAuroraBackground intensity="low" />
      {/* Reduced particle count from 15 to 12 and opacity from 0.15 to 0.08 */}
      <ParticleNetworkCanvas particleCount={12} opacity={0.08} />
    </>
  );
};

export default DashboardBackground;
