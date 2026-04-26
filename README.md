# RK Portfolio

A modern, minimal portfolio website featuring an animated Saturn-inspired sphere with complex orbital mechanics. Built with Next.js, TypeScript, React, and Tailwind CSS.

## Features

- **Saturn Animation System**: Canvas 2D-based animated sphere with 1000+ dots featuring:
  - Multi-level orbital mechanics (planets, moons, orbital dots)
  - TV static halo effect with organic boundaries
  - Depth-based rendering with perspective scaling
  - True 3D orbital mechanics with inclination, rotation, and tilt

- **Interactive Elements**:
  - Draggable text with gravity-based physics
  - Letter scatter and reassembly animations
  - Saturn-inspired navigation with rotating rings

- **Performance Optimized**:
  - Hardcoded animation parameters (deterministic, no runtime randomization)
  - Spatial optimization with viewport culling
  - Adaptive frame rates (60fps desktop / 30fps mobile)
  - Device-aware quality scaling

## Tech Stack

- **Framework**: Next.js 15.5.3 (App Router)
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS 4.1.13 + styled-components
- **Animations**: Framer Motion, React Spring, @use-gesture/react
- **Fonts**: Alien Encounters, Inter
- **Package Manager**: Yarn

## Project Structure

```
src/
├── app/
│   ├── components/              # UI components
│   │   ├── BackgroundElements.tsx    # Core Saturn animation (Canvas 2D)
│   │   ├── InteractiveTextSimple.tsx # Draggable text with physics
│   │   └── SimpleNavigation.tsx      # Saturn-inspired navigation
│   ├── config/                  # Animation configurations
│   │   ├── staticDotsConfig.ts       # Static dot positions/moons
│   │   ├── orbitalBigDotsConfig.ts   # Orbital big dot parameters
│   │   ├── planetDotsConfig.ts       # Planet dot configurations
│   │   └── mainSphereConfig.ts       # Core sphere settings
│   ├── helpers/                 # Background rendering utilities
│   ├── hooks/                   # Custom hooks (device detection)
│   ├── types/                   # TypeScript definitions
│   ├── layout.tsx               # Root layout with AnimationProvider
│   ├── page.tsx                 # Home page
│   └── not-found.tsx            # 404 page
├── contexts/
│   └── AnimationContext.tsx     # Global animation state management
└── styles/                      # Global styles, colors, typography
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn

### Installation

```bash
# Install dependencies
yarn install

# Start development server (port 3002)
yarn dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

### Available Scripts

- `yarn dev` - Development server on port 3002
- `yarn build` - Production build with static export
- `yarn start` - Production server
- `yarn lint` - ESLint check

## Deployment

This project is configured for static export. Build and deploy:

```bash
yarn build
```

This creates an `out/` folder with static files ready for deployment to Vercel, GoDaddy, Netlify, or any static hosting.

### Static Export Notes

- Images are unoptimized (required for static export)
- Trailing slashes enabled for compatibility
- Security headers configured in `next.config.js`

## Animation System

The background features a Saturn-like sphere with multiple dot groups. See [DOT_GROUPS_COLOR_LEGEND.md](src/app/config/DOT_GROUPS_COLOR_LEGEND.md) for color coding used during development.

| Color | Group | Description |
|-------|-------|-------------|
| BROWN | Static Dots | ~784 dots on sphere surface (grid pattern) |
| RED | Planet Dots | 5 planets with inner structure |
| BEIGE | Fat Planets | 3 special planets with halos |
| BLUE | Orbital Big Dots | 6 large orbital dots |
| GREEN | Planet Moons | Moons orbiting planets |
| YELLOW | Orbital Moons | Moons orbiting orbital dots |

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

- **Email**: hello@raitisk.dev
