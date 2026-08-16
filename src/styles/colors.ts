// Color system
export const colors = {
  black: '#000000',
  white: '#ffffff',

  // Saturn theme colors — canonical ramp. The html background gradient in
  // src/styles/globals.css mirrors lightest…darkest as --color-saturn-*
  // custom properties (CSS cannot import TS); keep both sides byte-identical.
  saturn: {
    lightest: '#f5f1e8', // Light cream
    light: '#ede4d3', // Warm ivory
    medium: '#e8dcc6', // Soft beige
    dark: '#ddd0bb', // Muted tan
    darkest: '#d4c4a8', // Rich warm tan
    frame: '#c9b896', // Frame accent
    frameAlt: '#beac84', // Frame variation
  },
};

// MeSection tagline shimmer — tuned gradient stops (Tailwind gray-400/500/
// 700/800 hexes, deliberately outside the Saturn ramp).
export const shimmer = {
  edge: '#9ca3af', // base gradient edges (gray-400)
  mid: '#6b7280', // base gradient centre (gray-500)
  sweepEdge: '#374151', // sweep highlight edges (gray-700)
  sweepMid: '#1f2937', // sweep highlight centre (gray-800)
};
