// Static configuration for the CosmicDustThree background: ball/orbit tuning,
// planet constants, and star-field size. Shader sources live in cosmicDust.shaders.ts.

import { colors } from '@/styles/colors';

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Warp overlay fill — derived from the site background token so the hyperspace
// white-out stays indistinguishable from the page behind it (SSOT-3). Mobile
// uses a denser fill because the backdrop blur is disabled there (MUX-06).
export const WARP_OVERLAY_FILL = hexToRgba(colors.saturn.lightest, 0.85);
export const WARP_OVERLAY_FILL_MOBILE = hexToRgba(colors.saturn.lightest, 0.95);

export interface BallConfig {
  id: string;
  color: { r: number; g: number; b: number };
  particleCount: number;
  radius: number;
  orbitRadius: number;
  orbitEccentricity: number;
  orbitTilt: number;
  orbitPhaseOffset: number;
  orbitSpeed: number;
  spinSpeed: number;
  swirlSpeed: number;
  chaoticRatio: number;
  chaoticSpeedMin: number;
  chaoticSpeedMax: number;
  parentId: string | null;
}

export const BALLS: BallConfig[] = [
  {
    id: 'main-ball',
    color: { r: 0.25, g: 0.27, b: 0.24 },
    particleCount: 18000,
    radius: 300,
    orbitRadius: 300,
    orbitEccentricity: 0.4,
    orbitTilt: 0.6,
    orbitPhaseOffset: Math.PI * 0.65,
    orbitSpeed: 0.3,
    spinSpeed: 0.15,
    swirlSpeed: 0.08,
    chaoticRatio: 0.3,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.3,
    parentId: null,
  },
  {
    id: 'child-ball',
    color: { r: 0.6, g: 0.45, b: 0.3 },
    particleCount: 4000,
    radius: 120,
    orbitRadius: 400,
    orbitEccentricity: 0.3,
    orbitTilt: 0.4,
    orbitPhaseOffset: Math.PI * 0.3,
    orbitSpeed: 0.4,
    spinSpeed: 0.25,
    swirlSpeed: 0.12,
    chaoticRatio: 0.25,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.4,
    parentId: 'main-ball',
  },
];

export const BALL_ORBIT = new Map(BALLS.map(c => [c.id, {
  orbitB: c.orbitRadius * Math.sqrt(1 - c.orbitEccentricity * c.orbitEccentricity),
  tiltCos: Math.cos(c.orbitTilt),
  tiltSin: Math.sin(c.orbitTilt),
}]));

export const PLANET_TILT_COS = Math.cos(0.35);
export const PLANET_TILT_SIN = Math.sin(0.35);

// Planet stripe band count — the fragment shader draws this many stripes and the
// particle-formation math targets bands derived from the same number; they must agree.
export const STRIPE_COUNT = 14;

export const STAR_COUNT = 1500;
