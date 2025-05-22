
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";

const DashboardBackground = () => {
  return (
    <>
      {/* Further reduced intensity to 'very-low' */}
      <MeshAuroraBackground intensity="very-low" />
      {/* Reduced particle count from 12 to 8 and opacity from 0.08 to 0.05 */}
      <ParticleNetworkCanvas particleCount={8} opacity={0.05} />
    </>
  );
};

export default DashboardBackground;
