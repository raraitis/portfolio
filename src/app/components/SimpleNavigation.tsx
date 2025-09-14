'use client'

import { useState, useEffect } from 'react';

const SimpleNavigation = () => {
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');

  // Listen for section changes
  useEffect(() => {
    const checkCurrentSection = () => {
      // You could add logic here to sync with URL if needed
      // For now, we'll manage state locally
    };
    checkCurrentSection();
  }, []);

  const handleNavigate = (section: 'home' | 'me') => {
    setCurrentSection(section);
    // Call global navigation function
    if (typeof window !== 'undefined' && (window as any).navigateToSection) {
      (window as any).navigateToSection(section);
    }
  };
  
  // Define navigation items
  const navItems = [
    { word: 'HOME', section: 'home' as const },
    { word: 'ME', section: 'me' as const }
  ];
  
  // Filter navigation items based on current section
  const getVisibleNavItems = () => {
    if (currentSection === 'me') {
      // On ME section, show only HOME
      return navItems.filter(item => item.word === 'HOME');
    }
    // On all other sections, show all items
    return navItems;
  };

  const visibleItems = getVisibleNavItems();

  return (
    <div className='fixed top-16 right-20 z-50'>
      <div className='flex space-x-8'>
        {visibleItems.map((item) => (
          <button
            key={item.word}
            onClick={() => handleNavigate(item.section)}
            className='text-sm tracking-wide text-gray-600 hover:text-gray-800 transition-colors select-none font-alien bg-transparent border-none cursor-pointer'
          >
            {item.word}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SimpleNavigation;