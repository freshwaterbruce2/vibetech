
import React from 'react';
import { motion } from 'framer-motion';

interface MeshAuroraBackgroundProps {
  className?: string;
  intensity?: 'very-low' | 'low' | 'medium' | 'high';
}

const MeshAuroraBackground = ({ 
  className, 
  intensity = 'medium' 
}: MeshAuroraBackgroundProps) => {
  const intensityValues = {
    'very-low': { opacity: 0.05, scale: 1.05 },
    'low': { opacity: 0.1, scale: 1.1 },
    'medium': { opacity: 0.15, scale: 1.2 },
    'high': { opacity: 0.2, scale: 1.3 },
  };

  const { opacity, scale } = intensityValues[intensity] || intensityValues.medium;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* First blob (electric cyan) */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-[150px] bg-[#00FFFF]/30"
        animate={{
          x: ['-5%', '5%', '-5%'],
          y: ['-10%', '5%', '-10%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity }}
      />
      
      {/* Second blob (vibrant purple) */}
      <motion.div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-[150px] bg-[#B933FF]/30"
        animate={{
          x: ['5%', '-5%', '5%'],
          y: ['5%', '-10%', '5%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity }}
      />
      
      {/* Third blob (hot pink) */}
      <motion.div
        className="absolute top-1/4 -right-1/4 w-full h-full rounded-full blur-[150px] bg-[#FF00AA]/20"
        animate={{
          x: ['-10%', '10%', '-10%'],
          y: ['5%', '-5%', '5%'],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity: opacity * 0.8 }}
      />
      
      {/* Fourth blob (teal accent) */}
      <motion.div
        className="absolute -top-1/4 left-1/2 transform -translate-x-1/2 w-3/4 h-3/4 rounded-full blur-[150px] bg-[#00FFCC]/20"
        animate={{
          scale: [1, scale, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ opacity: opacity * 0.7 }}
      />
    </div>
  );
};

export default MeshAuroraBackground;
