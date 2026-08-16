// Z-index system
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  // InteractiveText hero-word layers (resting sits at the nav's z-50 tier;
  // scattered letters and the dragged word lift above it)
  heroWordResting: 50,
  heroLetterScattered: 60,
  heroWordDragging: 100,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// JS-side mobile cutoff (px). Deliberately 768 (the md breakpoint) — Tailwind
// styling switches earlier, at sm (640px).
export const MOBILE_BREAKPOINT = 768;
