// GLSL sources for the CosmicDustThree background. Constants that both the JS
// init code and the shaders depend on are interpolated from cosmicDust.config.ts
// so the two sides cannot drift.

import { BALLS, PLANET_TILT_COS, PLANET_TILT_SIN, STRIPE_COUNT } from './cosmicDust.config';

// Warp acceleration curve — particles and stars must ease identically for the
// warp to read as one camera move; both vertex shaders interpolate this snippet.
const WARP_INTENSITY_GLSL = 'float intens = warp * 0.35 + warp * warp * 0.65;';

// Shared fragment-shader streak block: rotate gl_PointCoord into the radial
// direction and stretch along it. The stretch factor deliberately differs per
// layer (particles 8.0, stars 12.0).
const streakRotateGlsl = (stretch: string) => `
    vec2 uv = gl_PointCoord - vec2(0.5);
    if (vWarp > 0.01) {
      float c = cos(vRadialAngle);
      float s = sin(vRadialAngle);
      vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
      rotUv.y *= mix(1.0, ${stretch}, vWarp * vWarp);
      uv = rotUv;
    }`;

// ============= STRIPED PLANET SHADERS =============
export const planetVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const planetFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uOpacity;
  uniform vec3 uColor;
  void main() {
    float stripeCount = ${STRIPE_COUNT.toFixed(1)};
    float y = vUv.y * stripeCount;
    float stripe = smoothstep(0.28, 0.32, fract(y)) - smoothstep(0.58, 0.62, fract(y));
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = 1.0 - abs(dot(vNormal, viewDir));
    float edgeFade = 1.0 - smoothstep(0.5, 1.0, fresnel);
    float light = 0.7 + 0.3 * dot(vNormal, normalize(vec3(0.3, 0.5, 1.0)));
    vec3 color = uColor * light;
    float alpha = stripe * edgeFade * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============= GPU PARTICLE VERTEX SHADER =============
// All per-particle position/size/color computed on GPU from static attributes + per-frame uniforms
export const particleVertexShader = `
  attribute vec4 aOrbitParams;    // theta, phi, distance, speed
  attribute vec4 aChaoticParams;  // orbitRadius, orbitSpeed, initialAngle, isChaotic
  attribute vec4 aChaoticCenter;  // centerX, centerY, ballIndex, baseSize
  attribute vec4 aFormation;      // surfaceOffset, targetPhi, assemblyDelay, isStripe
  attribute vec3 aBaseColor;

  uniform float uTime;
  uniform vec3 uBall0Center;
  uniform vec3 uBall1Center;
  uniform vec2 uBall0Spin;       // spinSpeed, swirlSpeed
  uniform vec2 uBall1Spin;
  uniform float uSectionScale;
  uniform float uPlanetForm;
  uniform vec2 uPlanetSpin;      // cos, sin of planet rotation
  uniform vec2 uBallDepth;       // ball0, ball1 depth factors
  uniform float uWarpProgress;
  uniform vec2 uWarpCenter;

  const float TILT_COS = ${PLANET_TILT_COS.toFixed(6)};
  const float TILT_SIN = ${PLANET_TILT_SIN.toFixed(6)};

  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    float theta = aOrbitParams.x;
    float phi = aOrbitParams.y;
    float dist = aOrbitParams.z;
    float speed = aOrbitParams.w;
    float isChaotic = aChaoticParams.w;
    float ballIdx = aChaoticCenter.z;
    float baseSize = aChaoticCenter.w;

    bool isMain = ballIdx < 0.5;
    vec3 center = isMain ? uBall0Center : uBall1Center;
    vec2 spin = isMain ? uBall0Spin : uBall1Spin;
    float depth = isMain ? uBallDepth.x : uBallDepth.y;
    float ballR = isMain ? ${BALLS[0].radius.toFixed(1)} : ${BALLS[1].radius.toFixed(1)};
    float dScale = isMain ? uSectionScale : 1.0;
    float surfR = ballR * uSectionScale;

    // Per-particle staggered planet formation
    float pfRaw = isMain ? uPlanetForm : 0.0;
    float pfc = 0.0;
    if (pfRaw > 0.0) {
      float del = aFormation.z;
      float pf = clamp((pfRaw - del) / (1.0 - del), 0.0, 1.0);
      pfc = pf * pf * pf;
    }
    float fuzzy = surfR + aFormation.x;

    vec3 lp = vec3(0.0);

    if (isChaotic > 0.5) {
      float cAngle = aChaoticParams.z + aChaoticParams.y * uTime;
      float cScale = (isMain && pfc > 0.001) ? (1.0 - pfc * 0.8) : 1.0;
      float ox = cos(cAngle) * aChaoticParams.x * cScale;
      float oy = sin(cAngle) * aChaoticParams.x * cScale;

      if (isMain && pfc > 0.001) {
        float cx = aChaoticCenter.x + ox;
        float cy = aChaoticCenter.y + oy;
        float cd = max(length(vec2(cx, cy)), 1.0);
        float ed = mix(cd, fuzzy, pfc);
        float ca = atan(cx, cy);
        float ta = aFormation.y - 1.5708;
        float ba = mix(ca, ta, pfc);
        lp = vec3(sin(ba) * ed, cos(ba) * ed, sin(theta) * sin(phi) * ed * pfc);
      } else {
        lp = vec3((aChaoticCenter.x + ox) * dScale, (aChaoticCenter.y + oy) * dScale, 0.0);
      }
    } else {
      float ct = theta + uTime * spin.x + uTime * spin.y * speed;
      float ep = phi;
      float ed = dist * dScale;
      if (isMain && pfc > 0.001) {
        ed = mix(ed, fuzzy, pfc);
        ep = mix(phi, aFormation.y, pfc);
      }
      float sp = sin(ep);
      float cp = cos(ep);
      lp = vec3(cos(ct) * sp * ed, cp * ed, sin(ct) * sp * ed * pfc);
    }

    // 3D tilt + spin rotation during planet formation
    if (isMain && pfc > 0.01) {
      float ty = lp.y * TILT_COS - lp.z * TILT_SIN;
      float tz = lp.y * TILT_SIN + lp.z * TILT_COS;
      float sx = lp.x * uPlanetSpin.x - tz * uPlanetSpin.y;
      float sz = lp.x * uPlanetSpin.y + tz * uPlanetSpin.x;
      lp.x = mix(lp.x, sx, pfc);
      lp.y = mix(lp.y, ty, pfc);
      lp.z = sz * pfc;
    }

    // Settling jitter — peaks mid-transition, fades to zero when fully formed
    if (isMain && pfc > 0.7) {
      float jRaw = (pfc - 0.7) * 2.0;
      float jFade = 1.0 - smoothstep(0.85, 1.0, pfc);
      float j = jRaw * jFade;
      lp.x += sin(uTime * 3.0 + theta * 100.0) * j;
      lp.y += cos(uTime * 2.5 + phi * 100.0) * j;
    }

    vec3 wp = lp + center;

    // Size: depth + formation effects
    float ss = 0.15 + depth * 1.05;
    float fs = baseSize * ss;
    if (isMain && pfc > 0.001) {
      fs *= 1.0 + pfc * 0.2;
      float dn = clamp((lp.z / surfR + 1.0) * 0.5, 0.0, 1.0);
      fs *= mix(1.0, 0.35 + dn * 0.65, pfc);
    }

    // Color: base → stripe/fill during formation
    vec3 col = aBaseColor;
    if (isMain && pfc > 0.001) {
      float dn = clamp((lp.z / surfR + 1.0) * 0.5, 0.0, 1.0);
      float ds = 0.65 + dn * 0.35;
      vec3 tc = aFormation.w > 0.5 ? vec3(0.13, 0.15, 0.12) * ds : vec3(0.38, 0.40, 0.36) * ds;
      col = mix(aBaseColor, tc, pfc);
    }

    // Warp
    float warp = uWarpProgress;
    vec2 tp = wp.xy - uWarpCenter;
    float wd = length(tp);
    if (warp > 0.0) {
      ${WARP_INTENSITY_GLSL}
      wp.xy = uWarpCenter + tp * (1.0 + intens * 8.0);
      wp.z = min(wp.z + intens * 200.0 * smoothstep(0.0, 400.0, wd), 450.0);
      vRadialAngle = wd > 0.1 ? atan(tp.y, tp.x) : 0.0;
    } else {
      vRadialAngle = 0.0;
    }

    vWarp = warp;
    vColor = col;
    vec4 mv = modelViewMatrix * vec4(wp, 1.0);
    float fr = mix(3000.0, 8000.0, warp);
    float baseAlpha = smoothstep(fr, 0.0, length(wp.xy)) * 0.45;
    float ballAlpha = isMain ? mix(1.0, 0.2, pfc) : 0.2;
    vAlpha = baseAlpha * ballAlpha;
    gl_PointSize = fs * (200.0 / -mv.z) * (1.0 + warp * warp * 14.0);
    gl_Position = projectionMatrix * mv;
  }
`;

export const particleFragmentShader = `
  precision mediump float;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
${streakRotateGlsl('8.0')}
    float d = length(uv);
    float alpha = exp(-d * d * 18.0);
    vec3 color = mix(vColor, vec3(0.95, 0.9, 0.85), vWarp * 0.7);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

// ============= BACKGROUND STAR FIELD (hyperspeed warp effect) =============
export const starVertexShader = `
  attribute float aStarSize;
  attribute float aStarSpeed;  // per-star velocity multiplier

  uniform float uTime;
  uniform float uWarpProgress;
  uniform vec2 uWarpCenter;

  varying float vAlpha;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    vec3 pos = position;
    float warp = uWarpProgress;

    // Subtle drift — stars slowly cycle along Y (parallax feel)
    pos.y = mod(pos.y - uTime * 8.0 * aStarSpeed + 600.0, 1200.0) - 600.0;

    // Warp: radial burst from warp center
    if (warp > 0.0) {
      vec2 toStar = pos.xy - uWarpCenter;
      float dist = length(toStar);
      ${WARP_INTENSITY_GLSL}

      // Accelerate outward — farther stars move faster (depth illusion)
      float accel = intens * (3.0 + aStarSpeed * 5.0);
      pos.xy = uWarpCenter + toStar * (1.0 + accel);

      vRadialAngle = dist > 0.1 ? atan(toStar.y, toStar.x) : 0.0;
    } else {
      vRadialAngle = 0.0;
    }

    vWarp = warp;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Stars visible across whole screen, fade at edges
    vAlpha = mix(0.12, 0.7, warp) * smoothstep(1500.0, 200.0, length(pos.xy));

    float warpSize = 1.0 + warp * warp * 10.0;
    gl_PointSize = aStarSize * (200.0 / -mv.z) * warpSize;
    gl_Position = projectionMatrix * mv;
  }
`;

export const starFragmentShader = `
  precision mediump float;
  varying float vAlpha;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
${streakRotateGlsl('12.0')}
    float d = length(uv);
    float alpha = exp(-d * d * 22.0);

    // Cool white → warm during warp
    vec3 color = mix(vec3(0.6, 0.6, 0.55), vec3(0.95, 0.9, 0.8), vWarp * 0.8);

    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;
