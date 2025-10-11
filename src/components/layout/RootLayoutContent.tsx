'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { AnimationProvider } from '@/contexts/AnimationContext';
import { StyledBody, SaturnFrame, MainContent, ProvidersWrapper } from './LayoutStyles';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  return (
    <StyledBody>
      {/* Saturn-colored frame border - EXACTLY preserving original visual design */}
      <SaturnFrame />

      <ErrorBoundary>
        <ProvidersWrapper>
          <NavigationProvider>
            <AnimationProvider>
              {/* Background and Navigation will be rendered here by their respective components */}
              <MainContent>{children}</MainContent>
            </AnimationProvider>
          </NavigationProvider>
        </ProvidersWrapper>
      </ErrorBoundary>
    </StyledBody>
  );
}

export default RootLayoutContent;