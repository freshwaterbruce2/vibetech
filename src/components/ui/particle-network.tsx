
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Individual particle component
const Particle = ({ position, color, speed }) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.y += speed;
      
      // Reset position when particle goes off screen
      if (mesh.current.position.y > 5) {
        mesh.current.position.y = -5;
        // Randomize x position when resetting
        mesh.current.position.x = position[0] + (Math.random() - 0.5) * 2;
        mesh.current.position.z = position[2] + (Math.random() - 0.5) * 2;
      }
    }
  });
  
  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
};

// Connection line between particles
const ConnectionLine = ({ startPos, endPos, color, threshold }) => {
  const line = useRef<THREE.Line>(null);
  
  useFrame(() => {
    if (line.current && line.current.geometry instanceof THREE.BufferGeometry) {
      // Update line vertices based on particle positions
      const positions = line.current.geometry.attributes.position.array as Float32Array;
      
      positions[0] = startPos.current.position.x;
      positions[1] = startPos.current.position.y;
      positions[2] = startPos.current.position.z;
      
      positions[3] = endPos.current.position.x;
      positions[4] = endPos.current.position.y;
      positions[5] = endPos.current.position.z;
      
      line.current.geometry.attributes.position.needsUpdate = true;
      
      // Calculate distance between particles
      const distance = startPos.current.position.distanceTo(endPos.current.position);
      
      // Only show lines for particles within threshold distance
      if (distance < threshold) {
        line.current.visible = true;
        
        // Adjust opacity based on distance
        const opacity = 1 - (distance / threshold);
        if (line.current.material instanceof THREE.LineBasicMaterial) {
          line.current.material.opacity = opacity * 0.3;
        }
      } else {
        line.current.visible = false;
      }
    }
  });
  
  return (
    <line ref={line}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array(6)}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </line>
  );
};

// Particle network container
const ParticleNetwork = ({ count = 15, connectionThreshold = 2 }) => {
  const particles = useRef<THREE.Mesh[]>([]);
  
  // Generate particle positions
  const particleData = Array.from({ length: count }, (_, i) => ({
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5
    ],
    color: i % 3 === 0 
      ? '#28f0ff' 
      : i % 3 === 1 
        ? '#9c57ff' 
        : '#00ffcc',
    speed: (Math.random() + 0.1) * 0.005
  }));
  
  return (
    <>
      {/* Render particles */}
      {particleData.map((data, i) => (
        <Particle 
          key={`particle-${i}`}
          position={data.position}
          color={data.color}
          speed={data.speed}
          ref={(el) => { particles.current[i] = el; }}
        />
      ))}
      
      {/* Render connection lines */}
      {particles.current.length === count && 
        particleData.map((_, i) => (
          particleData.slice(i + 1).map((_, j) => (
            <ConnectionLine
              key={`connection-${i}-${i + j + 1}`}
              startPos={particles.current[i]}
              endPos={particles.current[i + j + 1]}
              color="#28f0ff"
              threshold={connectionThreshold}
            />
          ))
        ))
      }
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
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ opacity }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ParticleNetwork count={particleCount} />
      </Canvas>
    </div>
  );
};

export default ParticleNetworkCanvas;
