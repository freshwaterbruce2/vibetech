
export interface ParticleProps {
  x: number;
  y: number;
  radius: number;
  directionX: number;
  directionY: number;
  color: string;
}

export interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  opacity: number;
  color: string;
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
}
