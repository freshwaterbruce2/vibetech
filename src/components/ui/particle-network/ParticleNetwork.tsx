
import React, { useRef, useEffect } from 'react';
import Particle from './Particle';
import ConnectionLine from './ConnectionLine';
import { ParticleNetworkProps } from './types';

const ParticleNetwork: React.FC<ParticleNetworkProps> = ({ count = 15, connectionThreshold = 2 }) => {
  const particlesRef = useRef<THREE.Mesh[]>([]);
  
  // Generate particle positions
  const particleData = Array.from({ length: count }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5
    ] as [number, number, number],
    color: i % 3 === 0 
      ? '#28f0ff' 
      : i % 3 === 1 
        ? '#9c57ff' 
        : '#00ffcc',
    speed: (Math.random() + 0.1) * 0.005
  }));

  useEffect(() => {
    // Initialize particlesRef array with the correct length
    particlesRef.current = particlesRef.current.slice(0, count);
  }, [count]);
  
  return (
    <>
      {/* Render particles */}
      {particleData.map((data, i) => (
        <Particle 
          key={`particle-${i}`}
          position={data.position}
          color={data.color}
          speed={data.speed}
          ref={(el) => {
            if (el) particlesRef.current[i] = el;
          }}
        />
      ))}
      
      {/* Render connection lines */}
      {particleData.map((_, i) => (
        particleData.slice(i + 1).map((_, j) => {
          const index1 = i;
          const index2 = i + j + 1;
          
          if (particlesRef.current[index1] && particlesRef.current[index2]) {
            return (
              <ConnectionLine
                key={`connection-${index1}-${index2}`}
                startPos={{ current: particlesRef.current[index1] }}
                endPos={{ current: particlesRef.current[index2] }}
                color="#28f0ff"
                threshold={connectionThreshold}
              />
            );
          }
          return null;
        })
      ))}
    </>
  );
};

export default ParticleNetwork;
