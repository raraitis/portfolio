'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { on, type SectionName } from '@/lib/events';

const CosmicDustThree = dynamic(() => import('./CosmicDustThree'), {
  ssr: false,
});

const BackgroundElements = () => {
  const [section, setSection] = useState<SectionName>('home');

  useEffect(() => on('section-changed', setSection), []);

  return <CosmicDustThree section={section} />;
};

BackgroundElements.displayName = 'BackgroundElements';

export default BackgroundElements;
