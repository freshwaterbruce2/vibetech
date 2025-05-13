
import ParticleNetworkCanvas from "@/components/ui/particle-network";
import MeshAuroraBackground from "@/components/ui/mesh-aurora-background";

const DashboardBackground = () => {
  return (
    <>
      <MeshAuroraBackground intensity="low" />
      <ParticleNetworkCanvas particleCount={12} opacity={0.08} />
    </>
  );
};

export default DashboardBackground;
