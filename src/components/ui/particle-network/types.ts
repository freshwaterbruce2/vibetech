
import * as THREE from 'three';

export interface ParticleProps {
  position: [number, number, number];
  color: string;
  speed: number;
}

export interface ConnectionLineProps {
  startPos: { current: THREE.Mesh | null };
  endPos: { current: THREE.Mesh | null };
  color: string;
  threshold: number;
}

export interface ParticleNetworkProps {
  count?: number;
  connectionThreshold?: number;
}

export interface ParticleNetworkCanvasProps {
  className?: string;
  particleCount?: number;
  opacity?: number;
  connectionThreshold?: number;
}
