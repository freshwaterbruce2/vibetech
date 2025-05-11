
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Particle from './Particle';
import ConnectionLine from './ConnectionLine';
import { ParticleNetworkProps } from './types';

const ParticleNetwork: React.FC<ParticleNetworkProps> = ({ count = 15, connectionThreshold = 2 }) => {
  const particlesRef = useRef<THREE.Mesh[]>([]);
  
  // Generate a more visually pleasing color palette
  const generateColor = (index: number) => {
    const colors = [
      '#28f0ff', // cyan
      '#9c57ff', // purple
      '#00ffcc', // teal
      '#ff68f9', // pink
      '#4d9aff'  // blue
    ];
    return colors[index % colors.length];
  };
  
  // Generate particle positions with more intentional distribution
  const particleData = Array.from({ length: count }, (_, i) => {
    // Create a more organized distribution but with some randomness
    const angle = (i / count) * Math.PI * 2;
    const radius = 2 + Math.random() * 3;
    const x = Math.cos(angle) * radius * (0.8 + Math.random() * 0.4);
    const y = (Math.random() - 0.5) * 10;
    const z = Math.sin(angle) * radius * (0.8 + Math.random() * 0.4);
    
    return {
      position: [x, y, z] as [number, number, number],
      color: generateColor(i),
      speed: (Math.random() + 0.1) * 0.007 // Slightly faster movement
    };
  });

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
          x={0}
          y={0}
          radius={0}
          directionX={0}
          directionY={0}
          ref={(el) => {
            if (el) particlesRef.current[i] = el;
          }}
        />
      ))}
      
      {/* Render connection lines with improved connection logic */}
      {particleData.map((_, i) => (
        particleData.slice(i + 1).map((_, j) => {
          const index1 = i;
          const index2 = i + j + 1;
          
          if (particlesRef.current[index1] && particlesRef.current[index2]) {
            // Only create connections between nearby particles to reduce clutter
            const distance = new THREE.Vector3(
              particleData[index1].position[0], 
              particleData[index1].position[1], 
              particleData[index1].position[2]
            ).distanceTo(new THREE.Vector3(
              particleData[index2].position[0], 
              particleData[index2].position[1], 
              particleData[index2].position[2]
            ));
            
            if (distance < connectionThreshold * 1.2) {
              return (
                <ConnectionLine
                  key={`connection-${index1}-${index2}`}
                  startPos={{ current: particlesRef.current[index1] }}
                  endPos={{ current: particlesRef.current[index2] }}
                  color="#28f0ff"
                  threshold={connectionThreshold}
                  startX={0}
                  startY={0}
                  endX={0}
                  endY={0}
                  opacity={0}
                />
              );
            }
          }
          return null;
        })
      ))}
    </>
  );
};

export default ParticleNetwork;
