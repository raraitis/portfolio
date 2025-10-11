'use client';

import styled from 'styled-components';

// Main navigation container - EXACTLY preserving original positioning
export const NavigationContainer = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 50;
  
  /* Responsive positioning - EXACTLY matching original breakpoints */
  @media (min-width: 640px) {
    top: 4rem;
    right: 5rem;
  }
`;

// Base ring styles - EXACTLY preserving original ring behavior using same global animation
const BaseRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  border-style: solid;
  border-width: 1px 0;
  /* Using the same global animation as original */
  animation-name: spin-slow;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
`;

// Outer ring - EXACTLY preserving original animation and sizing
export const OuterRing = styled(BaseRing)`
  margin: -2rem;
  width: calc(100% + 4rem);
  height: calc(100% + 4rem);
  border-color: rgba(209, 213, 219, 0.15); /* gray-300/15 */
  animation-duration: 60s;
  transform: rotate(15deg);
  
  @media (min-width: 640px) {
    margin: -3rem;
  }
`;

// Middle ring - EXACTLY preserving original animation and sizing
export const MiddleRing = styled(BaseRing)`
  margin: -1.5rem;
  width: calc(100% + 3rem);
  height: calc(100% + 3rem);
  border-color: rgba(156, 163, 175, 0.2); /* gray-400/20 */
  animation-duration: 45s;
  animation-direction: reverse;
  transform: rotate(-10deg);
  
  @media (min-width: 640px) {
    margin: -2rem;
  }
`;

// Inner ring - EXACTLY preserving original animation and sizing
export const InnerRing = styled(BaseRing)`
  margin: -1rem;
  width: calc(100% + 2rem);
  height: calc(100% + 2rem);
  border-color: rgba(107, 114, 128, 0.25); /* gray-500/25 */
  animation-duration: 30s;
  transform: rotate(8deg);
  
  @media (min-width: 640px) {
    margin: -1.5rem;
  }
`;

// Navigation content container - EXACTLY preserving original spacing
export const NavigationContent = styled.div`
  display: flex;
  gap: 1rem;
  position: relative;
  z-index: 10;
  
  @media (min-width: 640px) {
    gap: 2rem;
  }
`;

// Navigation button - EXACTLY preserving original styling and behavior
export const NavigationButton = styled.button`
  font-size: 0.875rem;
  letter-spacing: 0.025em;
  color: rgb(75, 85, 99); /* gray-600 */
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
  font-family: 'Alien Encounters', sans-serif; /* font-alien */
  padding: 0.5rem 0.25rem;
  min-height: 44px; /* Touch-friendly minimum size */
  transition: color 0.15s ease-in-out;
  
  &:hover {
    color: rgb(31, 41, 55); /* gray-800 */
  }
  
  &:focus {
    outline: 2px solid rgb(59, 130, 246); /* blue-500 */
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
  
  /* Responsive text sizing - EXACTLY matching original */
  @media (min-width: 640px) {
    font-size: 1rem;
  }
`;