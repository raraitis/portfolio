// Background animation types

export interface SphereInfo {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface StaticDot extends Point2D {
  size: number;
  relativeX: number;
  relativeY: number;
  baseOffsetX: number;
  baseOffsetY: number;
  _firing?: boolean;
  _seed?: number;
  moons?: { count: number; offsets: number[] };
  orbitsPlanet?: {
    planetIndex: number;
    orbitRadius: number;
    orbitOffset: number;
  };
  orbitsMain?: {
    orbitRadius: number;
    orbitSpeed: number;
    orbitOffset: number;
    orbitTilt: number;
  };
}

export interface Moon {
  count: number;
  angles: number[];
  distances: number[];
  speeds: number[];
  sizes: number[];
  tilts: number[];
  inclinations?: number[];
}

export interface PlanetDot extends Point2D {
  size: number;
  angle: number;
  baseRadius: number;
  orbitSpeed: number;
  orbitTilt: number;
  orbitEccentricity: number;
  spinSpeed: number;
  spinDirection: number;
  moons: Moon;
}

export interface OrbitalBigDot extends Point3D {
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  orbitTilt: number;
  orbitRotation: number;
  orbitInclination: number;
  orbitDirection: number;
  spinSpeed: number;
  spinDirection: number;
  moons?: {
    count: number;
    angles: number[];
    distances: number[];
    speeds: number[];
    tilts: number[];
  };
}