
import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface MeshAuroraBackgroundProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const MeshAuroraBackground = ({ 
  className, 
  intensity = 'medium' 
}: MeshAuroraBackgroundProps) => {
  const intensityValues = {
    low: { opacity: 0.08, scale: 1.1 },
    medium: { opacity: 0.15, scale: 1.2 },
    high: { opacity: 0.25, scale: 1.3 },
  };

  const { opacity, scale } = intensityValues[intensity];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* First blob (electric blue) */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-[80px] bg-futuristic-neonBlue/20"
        animate={{
          x: ['-5%', '5%', '-5%'],
          y: ['-5%', '10%', '-5%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity }}
      />
      
      {/* Second blob (purple) */}
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-[80px] bg-futuristic-neonPurple/20"
        animate={{
          x: ['5%', '-5%', '5%'],
          y: ['10%', '-10%', '10%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity }}
      />
      
      {/* Third blob (teal) */}
      <motion.div
        className="absolute -top-1/4 left-1/2 transform -translate-x-1/2 w-3/4 h-3/4 rounded-full blur-[100px] bg-futuristic-neonTeal/15"
        animate={{
          scale: [1, scale, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity }}
      />
    </div>
  );
};

export default MeshAuroraBackground;
