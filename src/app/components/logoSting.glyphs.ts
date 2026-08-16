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
  T: {
    width: 0.74,
    pieces: [
      {
        outline: [
          [0.24, 0], [0.24, 0.78], [0, 0.78], [0, 1], [0.74, 1], [0.74, 0.78], [0.5, 0.78], [0.5, 0],
        ],
      },
    ],
  },
};

const GLYPH_SPACING = 0.14;

/** Shapes for one word token, glyphs advanced along x; width is the total advance. */
export function buildTokenShapes(token: string): { shapes: THREE.Shape[]; width: number } {
  const shapes: THREE.Shape[] = [];
  let cursor = 0;
  for (const ch of token) {
    const glyph = GLYPHS[ch];
    if (!glyph) continue; // glyph set intentionally covers only the sting words
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
    cursor += glyph.width + GLYPH_SPACING;
  }
  return { shapes, width: Math.max(0, cursor - GLYPH_SPACING) };
}
