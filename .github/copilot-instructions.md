# Portfolio Website - Development Guidelines

This is a modern, minimal portfolio website built with Next.js, TypeScript, React, and Tailwind CSS.

## 🏗️ Architecture Principles

### Modular Design Philosophy
- **Component-Based Architecture**: Break down complex features into small, reusable components
- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Use component composition patterns
- **Atomic Design**: Organize components in atoms → molecules → organisms → templates → pages

### Styled Components Integration
- **Use styled-components for complex styling**: Prefer styled-components for dynamic styles and component-specific CSS
- **Tailwind for utility classes**: Use Tailwind for layout, spacing, and basic styling
- **Theme consistency**: Create styled-component themes that align with Tailwind design tokens
- **CSS-in-JS benefits**: Leverage scoped styling, dynamic theming, and TypeScript integration

## 📱 Responsive Design Requirements

### Mobile-First Development
- **Design for mobile first**: Start with mobile layout, then enhance for larger screens
- **Touch-friendly interfaces**: Minimum 44px touch targets, proper spacing
- **Performance on mobile**: Optimize animations, images, and bundle size for mobile devices
- **Progressive enhancement**: Core functionality works without JavaScript

### Breakpoint Strategy
```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Ultra-wide
}
```

### Responsive Component Patterns
- **Container queries**: Use modern CSS container queries where appropriate
- **Flexible layouts**: Use CSS Grid and Flexbox for responsive layouts
- **Fluid typography**: Implement clamp() for responsive font sizes
- **Adaptive components**: Components that change behavior based on screen size

## 🔒 Security Best Practices

### Code Security
- **Input validation**: Always validate and sanitize user inputs
- **XSS prevention**: Use proper escaping and Content Security Policy
- **Dependency security**: Regular security audits with `npm audit`
- **Environment variables**: Never expose sensitive data in client-side code

### Next.js Security
- **CSP headers**: Implement Content Security Policy in next.config.js
- **HTTPS enforcement**: Force HTTPS in production
- **Security headers**: Use security headers (HSTS, X-Frame-Options, etc.)
- **API route protection**: Secure API routes with proper authentication

## 💡 Development Methodology

### Research-First Approach
**ALWAYS research before implementing:**
1. **Analyze existing code**: Understand current architecture and patterns
2. **Identify improvement opportunities**: Look for performance bottlenecks, security issues, code smells
3. **Plan modular solutions**: Design components that can be reused and tested independently
4. **Consider accessibility**: Ensure all changes meet WCAG guidelines

### Code Quality Standards
- **TypeScript strict mode**: Use strict TypeScript configuration
- **ESLint + Prettier**: Automated code formatting and linting
- **Component testing**: Unit tests for all components
- **Performance monitoring**: Use React DevTools and Lighthouse
- **Error boundaries**: Implement proper error handling

## 🎨 Design System Implementation

### Component Library Structure
```
src/
├── components/
│   ├── atoms/          # Basic building blocks (Button, Input, Icon)
│   ├── molecules/      # Simple combinations (SearchBox, Card)
│   ├── organisms/      # Complex combinations (Header, Form)
│   └── templates/      # Page layouts
├── styles/
│   ├── theme.ts        # Design tokens and theme
│   ├── globalStyles.ts # Global styled-components
│   └── mixins.ts       # Reusable style mixins
```

### Styling Architecture
- **Design tokens**: Centralized spacing, colors, typography scales
- **Component variants**: Use discriminated unions for component variants
- **Responsive mixins**: Reusable responsive styling functions
- **Animation system**: Consistent motion design with Framer Motion

## 🚀 Performance Optimization

### Bundle Optimization
- **Code splitting**: Use dynamic imports for route-based splitting
- **Tree shaking**: Ensure unused code is eliminated
- **Bundle analysis**: Regular analysis with @next/bundle-analyzer
- **Image optimization**: Use Next.js Image component with proper sizing

### Runtime Performance
- **React.memo**: Memoize expensive components
- **useMemo/useCallback**: Prevent unnecessary re-computations
- **Virtual scrolling**: For large lists
- **Lazy loading**: Defer loading of non-critical components

## 🧪 Testing Strategy

### Component Testing
- **Jest + React Testing Library**: Unit and integration tests
- **Storybook**: Component documentation and visual testing
- **Accessibility testing**: Automated a11y tests with jest-axe
- **Visual regression**: Screenshot testing for design consistency

### Security Testing
- **OWASP ZAP**: Automated security scanning
- **Dependency scanning**: Regular vulnerability assessments
- **Penetration testing**: Manual security testing for critical features

## 📋 Implementation Checklist

Before implementing any feature:
- [ ] Research existing codebase patterns
- [ ] Design mobile-first responsive behavior
- [ ] Plan component modularization
- [ ] Consider security implications
- [ ] Define TypeScript interfaces
- [ ] Plan testing approach
- [ ] Consider performance impact
- [ ] Ensure accessibility compliance

## 🎯 Current Project Focus

### Immediate Priorities
1. **Security hardening**: Implement comprehensive security measures
2. **Component modularization**: Break down monolithic components
3. **Styled-components migration**: Transition from inline styles to styled-components
4. **Mobile responsiveness**: Ensure perfect mobile experience
5. **Performance optimization**: Identify and fix performance bottlenecks

## Development Guidelines
- Keep design minimal and clean
- Use consistent spacing and typography
- Follow responsive design principles
- Maintain accessibility standards
- Use semantic HTML elements
- Keep components small and focused
- Always research before coding
- Prioritize security in every decision
- Test thoroughly across devices
- Document architectural decisions
