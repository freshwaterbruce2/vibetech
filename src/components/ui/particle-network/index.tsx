
import React from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleNetwork from './ParticleNetwork';
import { ParticleNetworkCanvasProps } from './types';

// Canvas wrapper component
const ParticleNetworkCanvas: React.FC<ParticleNetworkCanvasProps> = ({ 
  className, 
  particleCount = 15,
  opacity = 0.08,
  connectionThreshold = 2
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className || ''}`} style={{ opacity }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ParticleNetwork count={particleCount} connectionThreshold={connectionThreshold} />
      </Canvas>
    </div>
  );
};

export default ParticleNetworkCanvas;
