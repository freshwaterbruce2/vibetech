
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Individual particle component
const Particle = ({ position, color, speed }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y += speed;
      
      // Reset position when particle goes off screen
      if (meshRef.current.position.y > 5) {
        meshRef.current.position.y = -5;
        // Randomize x position when resetting
        meshRef.current.position.x = position[0] + (Math.random() - 0.5) * 2;
        meshRef.current.position.z = position[2] + (Math.random() - 0.5) * 2;
      }
    }
  });
  
  return (
    <mesh ref={meshRef} position={[position[0], position[1], position[2]]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
};

// Connection line between particles
const ConnectionLine = ({ startPos, endPos, color, threshold }) => {
  const lineRef = useRef<THREE.Line>(null);
  const [positions] = useState<Float32Array>(new Float32Array(6));
  
  useFrame(() => {
    if (lineRef.current && startPos.current && endPos.current) {
      // Update line vertices based on particle positions
      positions[0] = startPos.current.position.x;
      positions[1] = startPos.current.position.y;
      positions[2] = startPos.current.position.z;
      
      positions[3] = endPos.current.position.x;
      positions[4] = endPos.current.position.y;
      positions[5] = endPos.current.position.z;
      
      (lineRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      
      // Calculate distance between particles
      const distance = new THREE.Vector3(
        startPos.current.position.x, 
        startPos.current.position.y, 
        startPos.current.position.z
      ).distanceTo(new THREE.Vector3(
        endPos.current.position.x, 
        endPos.current.position.y, 
        endPos.current.position.z
      ));
      
      // Only show lines for particles within threshold distance
      if (distance < threshold) {
        lineRef.current.visible = true;
        
        // Adjust opacity based on distance
        const opacity = 1 - (distance / threshold);
        if (lineRef.current.material instanceof THREE.LineBasicMaterial) {
          lineRef.current.material.opacity = opacity * 0.3;
        }
      } else {
        lineRef.current.visible = false;
      }
    }
  });
  
  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </line>
  );
};

// Particle network container
const ParticleNetwork = ({ count = 15, connectionThreshold = 2 }) => {
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
          if (particlesRef.current[i] && particlesRef.current[i + j + 1]) {
            return (
              <ConnectionLine
                key={`connection-${i}-${i + j + 1}`}
                startPos={{ current: particlesRef.current[i] }}
                endPos={{ current: particlesRef.current[i + j + 1] }}
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

interface ParticleNetworkCanvasProps {
  className?: string;
  particleCount?: number;
  opacity?: number;
}

// Canvas wrapper component
const ParticleNetworkCanvas: React.FC<ParticleNetworkCanvasProps> = ({ 
  className, 
  particleCount = 15,
  opacity = 0.08
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className || ''}`} style={{ opacity }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ParticleNetwork count={particleCount} />
      </Canvas>
    </div>
  );
};

export default ParticleNetworkCanvas;
