
import React from 'react';
import { motion } from 'framer-motion';

interface HologramContainerProps {
  splineUrl: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const HologramContainer: React.FC<HologramContainerProps> = ({ 
  splineUrl,
  width = 400, 
  height = 400,
  className 
}) => {
  return (
    <div className={`hologram-container relative ${className}`}>
      {/* Hologram effect scanline */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-10">
        <div className="w-full h-[2px] bg-futuristic-neonBlue/40 absolute animate-scan-line"></div>
      </div>
      
      {/* Glow effects */}
      <motion.div
        className="absolute inset-0 rounded-full bg-futuristic-neonBlue/10 blur-xl z-0"
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Base plate reflection effect */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-futuristic-neonBlue/20 blur-lg rounded-full z-0"></div>
      
      {/* Spline container */}
      <div className="z-20 relative w-full h-full rounded-full overflow-hidden">
        <iframe 
          src={splineUrl}
          width={width}
          height={height}
          frameBorder="0"
          title="Interactive 3D Hologram"
          className="w-full h-full"
        />
      </div>
      
      {/* Circular ring */}
      <div className="absolute inset-0 rounded-full border border-futuristic-neonBlue/20 z-30 pointer-events-none"></div>
    </div>
  );
};

export default HologramContainer;
