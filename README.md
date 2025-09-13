# RK Portfolio

A modern, minimal portfolio website built with Next.js, TypeScript, React, and Tailwind CSS.

## Features

- **Modern Design**: Clean, minimal aesthetic inspired by leading portfolio sites
- **Responsive**: Mobile-first design that works on all devices  
- **Next.js App Router**: Latest Next.js features with file-based routing
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom design system
- **Performance**: Optimized for fast loading and excellent user experience

## Tech Stack

- **Framework**: Next.js 15.5.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom configuration
- **Font**: Inter (Google Fonts)
- **Deployment Ready**: Optimized for Vercel deployment

## Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── About.tsx       # About section component
│   │   ├── ContactForm.tsx # Contact form with validation
│   │   ├── ContactInfo.tsx # Contact information display
│   │   ├── FeaturedWork.tsx # Featured projects showcase
│   │   ├── Hero.tsx        # Landing hero section
│   │   ├── Navigation.tsx  # Main navigation component
│   │   └── WorkGrid.tsx    # Projects grid layout
│   ├── contact/            # Contact page route
│   │   └── page.tsx
│   ├── work/              # Work portfolio page route
│   │   └── page.tsx
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout with metadata
│   ├── not-found.tsx      # 404 error page
│   └── page.tsx          # Home page
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Customization

### Content
- Update personal information in components
- Add your projects to `WorkGrid.tsx`
- Customize contact information in `ContactInfo.tsx`

### Styling
- Colors and spacing defined in `tailwind.config.js`
- Global styles in `globals.css`
- Component-specific styles use Tailwind utility classes

### SEO & Metadata
- Update metadata in `layout.tsx` and individual page files
- Add Open Graph images and descriptions as needed

## Deployment

This project is optimized for deployment on Vercel:

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy with default Next.js settings

Alternative deployment platforms (Netlify, AWS, etc.) are also supported.

## Performance

- Static generation for optimal loading speeds
- Optimized images and fonts
- Minimal JavaScript bundle size
- Responsive design patterns

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

- **Email**: hello@raitisk.dev
- **LinkedIn**: [linkedin.com/in/raitiskraslovskis](https://linkedin.com/in/raitiskraslovskis)
- **GitHub**: [github.com/raitiskraslovskis](https://github.com/raitiskraslovskis)
