// Angular sports-logotype glyphs for LogoSting — hand-built polygon letterforms
// (baseline at y=0, cap height 1, x-height 0.72). Covers only the sting words.
import * as THREE from 'three';

type Pt = [number, number];

interface GlyphPiece {
  outline: Pt[];
  holes?: Pt[][];
}

interface Glyph {
  width: number;
  pieces: GlyphPiece[];
}

const X_HEIGHT = 0.72;

// Strokes are straight bars with sharp corners; bowls are chamfered, and the
// s is the classic blocky maze construction (two edge-open slots).
const GLYPHS: Record<string, Glyph> = {
  r: {
    width: 0.58,
    pieces: [
      {
        outline: [
          [0, 0], [0, X_HEIGHT], [0.58, X_HEIGHT], [0.5, 0.5], [0.24, 0.5], [0.24, 0],
        ],
      },
    ],
  },
  // Flat-topped trapezoid A-form at x-height — triangular counter + low crossbar
  a: {
    width: 0.66,
    pieces: [
      {
        outline: [
          [0, 0], [0.16, X_HEIGHT], [0.5, X_HEIGHT], [0.66, 0],
        ],
        holes: [
          [
            [0.24, 0.22], [0.3, 0.44], [0.4, 0.44], [0.45, 0.22],
          ],
        ],
      },
    ],
  },
  i: {
    width: 0.22,
    pieces: [
      { outline: [[0, 0], [0, X_HEIGHT], [0.22, X_HEIGHT], [0.22, 0]] },
      { outline: [[0, 0.84], [0, 1.04], [0.22, 1.04], [0.22, 0.84]] },
    ],
  },
  s: {
    width: 0.58,
    pieces: [
      {
        outline: [
          [0, 0], [0.58, 0], [0.58, 0.44], [0.22, 0.44], [0.22, 0.5], [0.58, 0.5],
          [0.58, X_HEIGHT], [0, X_HEIGHT], [0, 0.28], [0.36, 0.28], [0.36, 0.22], [0, 0.22],
        ],
      },
    ],
  },
  I: {
    width: 0.26,
    pieces: [{ outline: [[0, 0], [0, 1], [0.26, 1], [0.26, 0]] }],
  },
  // T carries the genre's diagonal slash-gap: the left arm is a separate piece
  T: {
    width: 0.74,
    pieces: [
      { outline: [[0, 0.78], [0, 1], [0.08, 1], [0.16, 0.78]] },
      {
        outline: [
          [0.24, 0], [0.24, 0.78], [0.22, 0.78], [0.14, 1], [0.74, 1], [0.74, 0.78], [0.5, 0.78], [0.5, 0],
        ],
      },
    ],
  },
  // Caps for the secondary line — chamfered geometric slabs
  S: {
    width: 0.62,
    pieces: [
      {
        outline: [
          [0, 0], [0.62, 0], [0.62, 0.61], [0.23, 0.61], [0.23, 0.7], [0.62, 0.7],
          [0.62, 1], [0, 1], [0, 0.39], [0.39, 0.39], [0.39, 0.3], [0, 0.3],
        ],
      },
    ],
  },
  O: {
    width: 0.62,
    pieces: [
      {
        outline: [
          [0.08, 0], [0, 0.12], [0, 0.88], [0.08, 1], [0.54, 1], [0.62, 0.88], [0.62, 0.12], [0.54, 0],
        ],
        holes: [
          [[0.22, 0.22], [0.22, 0.78], [0.4, 0.78], [0.4, 0.22]],
        ],
      },
    ],
  },
  L: {
    width: 0.58,
    pieces: [{ outline: [[0, 0], [0, 1], [0.24, 1], [0.24, 0.22], [0.58, 0.22], [0.5, 0]] }],
  },
  U: {
    width: 0.62,
    pieces: [
      {
        outline: [
          [0, 1], [0, 0.1], [0.12, 0], [0.52, 0], [0.62, 0.1], [0.62, 1],
          [0.38, 1], [0.38, 0.22], [0.24, 0.22], [0.24, 1],
        ],
      },
    ],
  },
  N: {
    width: 0.62,
    pieces: [
      {
        outline: [
          [0, 0], [0, 1], [0.22, 1], [0.4, 0.38], [0.4, 1], [0.62, 1],
          [0.62, 0], [0.4, 0], [0.22, 0.62], [0.22, 0],
        ],
      },
    ],
  },
  M: {
    width: 0.66,
    pieces: [
      {
        outline: [
          [0, 0], [0, 1], [0.18, 1], [0.33, 0.6], [0.48, 1], [0.66, 1], [0.66, 0],
          [0.48, 0], [0.48, 0.55], [0.37, 0.25], [0.29, 0.25], [0.18, 0.55], [0.18, 0],
        ],
      },
    ],
  },
};

/** Letter-advance gap between glyphs, in text-size units. */
export const GLYPH_SPACING = 0.14;

/** Shapes for a whole text run, glyphs advanced along x from the local origin. */
export function buildLineShapes(text: string): { shapes: THREE.Shape[]; width: number } {
  const shapes: THREE.Shape[] = [];
  let cursor = 0;
  let first = true;
  for (const ch of text) {
    const glyph = GLYPHS[ch];
    if (!glyph) continue;
    if (!first) cursor += GLYPH_SPACING;
    first = false;
    for (const piece of glyph.pieces) {
      const shape = new THREE.Shape();
      piece.outline.forEach(([x, y], i) =>
        i === 0 ? shape.moveTo(x + cursor, y) : shape.lineTo(x + cursor, y)
      );
      shape.closePath();
      for (const hole of piece.holes ?? []) {
        const path = new THREE.Path();
        hole.forEach(([x, y], i) =>
          i === 0 ? path.moveTo(x + cursor, y) : path.lineTo(x + cursor, y)
        );
        path.closePath();
        shape.holes.push(path);
      }
      shapes.push(shape);
    }
    cursor += glyph.width;
  }
  return { shapes, width: cursor };
}

/** Shapes for one character at the local origin, or null if not in the set. */
export function buildGlyph(ch: string): { shapes: THREE.Shape[]; width: number } | null {
  const glyph = GLYPHS[ch];
  if (!glyph) return null; // glyph set intentionally covers only the sting words
  const shapes: THREE.Shape[] = [];
  for (const piece of glyph.pieces) {
    const shape = new THREE.Shape();
    piece.outline.forEach(([x, y], i) =>
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)
    );
    shape.closePath();
    for (const hole of piece.holes ?? []) {
      const path = new THREE.Path();
      hole.forEach(([x, y], i) =>
        i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)
      );
      path.closePath();
      shape.holes.push(path);
    }
    shapes.push(shape);
  }
  return { shapes, width: glyph.width };
}
