
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleProps } from './types';

const Particle = React.forwardRef<THREE.Mesh, ParticleProps>(({ position, color, speed }, ref) => {
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
  
  React.useImperativeHandle(ref, () => meshRef.current as THREE.Mesh);
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </mesh>
  );
});

Particle.displayName = 'Particle';

export default Particle;
