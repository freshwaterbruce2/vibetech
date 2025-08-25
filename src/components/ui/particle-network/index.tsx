import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleNetwork from './ParticleNetwork';
import { ParticleNetworkCanvasProps } from './types';

// Canvas wrapper component with error handling
const ParticleNetworkCanvas: React.FC<ParticleNetworkCanvasProps> = ({ 
  className, 
  particleCount = 15,
  opacity = 0.08,
  connectionThreshold = 2
}) => {
  const [webglSupported, setWebglSupported] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Don't render if WebGL is not supported or there's an error
  if (!webglSupported || hasError) {
    // Return a simple fallback without 3D
    return (
      <div className={`absolute inset-0 pointer-events-none ${className || ''}`} style={{ opacity }}>
        {/* Simple CSS animation fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className || ''}`} style={{ opacity }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        onError={() => setHasError(true)}
        onCreated={(state) => {
          // Handle context loss
          const gl = state.gl;
          const canvas = gl.domElement;
          
          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            setHasError(true);
          });
          
          canvas.addEventListener('webglcontextrestored', () => {
            setHasError(false);
          });
        }}
      >
        <ParticleNetwork 
          count={particleCount} 
          connectionThreshold={connectionThreshold} 
        />
      </Canvas>
    </div>
  );
};

export default ParticleNetworkCanvas;