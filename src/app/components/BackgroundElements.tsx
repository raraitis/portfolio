'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Three.js component to avoid SSR issues
const CosmicDustThree = dynamic(() => import('./CosmicDustThree'), {
  ssr: false,
});

const BackgroundElements = () => {
  const [section, setSection] = useState<'home' | 'me' | 'portfolio'>('home');

  // Listen for global section changes from page navigation
  useEffect(() => {
    (window as any).setBackgroundSection = (s: 'home' | 'me' | 'portfolio') => {
      setSection(s);
    };
  }, []);

  return <CosmicDustThree section={section} />;
};

BackgroundElements.displayName = 'BackgroundElements';

export default BackgroundElements;
