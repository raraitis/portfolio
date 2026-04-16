# Portfolio

## Overview & Goal

Personal portfolio website for Raitis Kraslovskis — full-stack developer and creative technologist. Features sophisticated 3D animations and interactive elements.

**Source**: `/Users/raitiskraslovskis/portfolio`
**Live**: raitiskraslovskis.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| 3D Graphics | Three.js (WebGL), GSAP |
| Animations | Framer Motion, React Spring |
| Gestures | @use-gesture/react |
| Deployment | Railway (standalone Node.js) |

## Architecture

Single frontend application (not a monorepo):

```
portfolio/
├── src/
│   ├── app/
│   │   ├── components/     # Saturn animation, navigation, sections
│   │   ├── hooks/          # useDevice
│   │   ├── page.tsx        # Home with section routing
│   │   └── layout.tsx      # Root layout + SEO
│   ├── lib/                # Motion, events, game loop, input
│   └── styles/             # Colors, typography, sizing, fonts
└── public/
    ├── fonts/              # Custom fonts (Alien Encounters, Nabla)
    └── workers/            # Web Workers
```

## Key Features

- **Interactive Saturn Animation**: 1000+ particles with multi-level orbital mechanics, TV static halo, depth-based 3D rendering
- **GPU Vertex Shaders**: Striped planet rendering
- **Draggable Text**: Gravity physics with letter scatter/reassembly
- **Saturn Navigation**: Rotating ring-based section transitions
- **Sections**: Home, Me/About, Portfolio, Game (placeholder)
- **Performance**: Adaptive frame rates (60fps desktop / 30fps mobile), viewport culling
- **SEO**: Metadata, structured data, JSON-LD, OG image generation

## External Services

- **Railway** — Hosting

## Current State

- Production-deployed at raitiskraslovskis.com
- TypeScript strict mode, ESLint configured
- Security headers (CSP, HSTS, XSS protection)
- Performance-optimized (gzip, AVIF/WebP, aggressive caching)
- PWA support (apple-web-app capability)
- No test suite
- No CI/CD pipeline
- Active development with recent GPU shader and performance work

## Local Dev

```bash
cd ~/portfolio
yarn install
yarn dev
```

- Frontend: http://localhost:3000
