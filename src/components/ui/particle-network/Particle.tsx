
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleProps } from './types';

const Particle = React.forwardRef<THREE.Mesh, ParticleProps>(({ position, color, speed }, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [particleSize] = useState(() => 0.03 + Math.random() * 0.04); // Random size between 0.03 and 0.07
  const [hueShift] = useState(() => Math.random() * 0.2); // Small random hue shift
  
  // Create a color object for transitions
  const baseColor = new THREE.Color(color);
  const targetColor = new THREE.Color().copy(baseColor).offsetHSL(hueShift, 0.1, 0.1);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y += speed;
      
      // Add subtle horizontal movement
      meshRef.current.position.x += Math.sin(clock.elapsedTime + position[0]) * 0.002;
      meshRef.current.position.z += Math.cos(clock.elapsedTime + position[2]) * 0.002;
      
      // Color transition based on position or time
      const colorFactor = (Math.sin(clock.elapsedTime * 0.5) + 1) * 0.5;
      if (meshRef.current.material instanceof THREE.Material) {
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        material.color.copy(baseColor).lerp(targetColor, colorFactor);
      }
      
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
      <sphereGeometry args={[particleSize, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
});

Particle.displayName = 'Particle';

export default Particle;
