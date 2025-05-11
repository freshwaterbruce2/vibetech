
export interface ParticleProps {
  x: number;
  y: number;
  radius: number;
  directionX: number;
  directionY: number;
  color: string;
  position: [number, number, number];
  speed: number;
}

export interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  opacity: number;
  color: string;
  startPos: { current: THREE.Mesh };
  endPos: { current: THREE.Mesh };
  threshold: number;
}

export interface ParticleNetworkProps {
  width?: number;
  height?: number;
  particleCount?: number;
  connectDistance?: number;
  speed?: number;
  opacity?: number;
  className?: string;
  darkMode?: boolean;
  count?: number;
  connectionThreshold?: number;
}

export interface ParticleNetworkCanvasProps {
  className?: string;
  particleCount?: number;
  opacity?: number;
  connectionThreshold?: number;
}

