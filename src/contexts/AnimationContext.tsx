'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Position {
  x: number;
  y: number;
}

interface NavItem {
  word: string;
  position: Position;
  originalPosition: Position;
  href: string;
  isDragging: boolean;
  isThrown: boolean;
}

interface AnimationState {
  navigation: {
    items: NavItem[];
    activeWord: string | null;
  };
  background: {
    spherePosition: Position;
    intensity: number;
    particleCount: number;
  };
  letters: {
    scatterMode: boolean;
    activeAnimations: number;
  };
}

type AnimationAction =
  | { type: 'UPDATE_NAV_POSITION'; word: string; position: Position }
  | { type: 'SET_NAV_DRAGGING'; word: string; isDragging: boolean }
  | { type: 'RESET_NAV_POSITIONS' }
  | { type: 'UPDATE_BACKGROUND_INTENSITY' }
  | { type: 'UPDATE_SPHERE_POSITION'; position: Position }
  | { type: 'SET_SCATTER_MODE'; active: boolean }
  | { type: 'INCREMENT_ACTIVE_ANIMATIONS' }
  | { type: 'DECREMENT_ACTIVE_ANIMATIONS' };

const initialState: AnimationState = {
  navigation: {
    items: [
      {
        word: 'HOME',
        position: { x: 0, y: 0 },
        originalPosition: { x: 0, y: 0 },
        href: '/',
        isDragging: false,
        isThrown: false,
      },
      {
        word: 'ME',
        position: { x: 100, y: 0 },
        originalPosition: { x: 100, y: 0 },
        href: '/contact',
        isDragging: false,
        isThrown: false,
      },
    ],
    activeWord: null,
  },
  background: {
    spherePosition: { x: 0, y: 0 },
    intensity: 1.0,
    particleCount: 50,
  },
  letters: {
    scatterMode: false,
    activeAnimations: 0,
  },
};

function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'UPDATE_NAV_POSITION': {
      const items = state.navigation.items.map(item =>
        item.word === action.word
          ? { ...item, position: { ...action.position }, isThrown: true }
          : item
      );
      return {
        ...state,
        navigation: { ...state.navigation, items }
      };
    }
    case 'SET_NAV_DRAGGING': {
      const items = state.navigation.items.map(item =>
        item.word === action.word
          ? { ...item, isDragging: action.isDragging }
          : item
      );
      return {
        ...state,
        navigation: {
          ...state.navigation,
          items,
          activeWord: action.isDragging ? action.word : null
        }
      };
    }
    case 'RESET_NAV_POSITIONS': {
      const items = state.navigation.items.map(item => ({
        ...item,
        position: { ...item.originalPosition },
        isDragging: false,
        isThrown: false,
      }));
      return {
        ...state,
        navigation: { ...state.navigation, items, activeWord: null }
      };
    }
    case 'UPDATE_BACKGROUND_INTENSITY': {
      const hasActiveDrag = state.navigation.items.some(item => item.isDragging);
      const hasThrowItems = state.navigation.items.some(item => item.isThrown);
      const intensity = hasActiveDrag ? 1.5 : hasThrowItems ? 1.2 : 1.0;
      return {
        ...state,
        background: { ...state.background, intensity }
      };
    }
    case 'UPDATE_SPHERE_POSITION': {
      return {
        ...state,
        background: { ...state.background, spherePosition: { ...action.position } }
      };
    }
    case 'SET_SCATTER_MODE': {
      return {
        ...state,
        letters: { ...state.letters, scatterMode: action.active }
      };
    }
    case 'INCREMENT_ACTIVE_ANIMATIONS': {
      return {
        ...state,
        letters: { ...state.letters, activeAnimations: state.letters.activeAnimations + 1 }
      };
    }
    case 'DECREMENT_ACTIVE_ANIMATIONS': {
      return {
        ...state,
        letters: { 
          ...state.letters, 
          activeAnimations: Math.max(0, state.letters.activeAnimations - 1) 
        }
      };
    }
    default:
      return state;
  }
}

const AnimationStateContext = createContext<AnimationState | undefined>(undefined);
const AnimationDispatchContext = createContext<React.Dispatch<AnimationAction> | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [state, dispatch] = useReducer(animationReducer, initialState);

  return (
    <AnimationStateContext.Provider value={state}>
      <AnimationDispatchContext.Provider value={dispatch}>
        {children}
      </AnimationDispatchContext.Provider>
    </AnimationStateContext.Provider>
  );
}

export function useAnimationState() {
  const context = useContext(AnimationStateContext);
  if (context === undefined) {
    throw new Error('useAnimationState must be used within an AnimationProvider');
  }
  return context;
}

export function useAnimationDispatch() {
  const context = useContext(AnimationDispatchContext);
  if (context === undefined) {
    throw new Error('useAnimationDispatch must be used within an AnimationProvider');
  }
  return context;
}

// Helper hook for common actions
export function useAnimationActions() {
  const dispatch = useAnimationDispatch();

  return {
    updateNavPosition: (word: string, position: Position) =>
      dispatch({ type: 'UPDATE_NAV_POSITION', word, position }),
    setNavDragging: (word: string, isDragging: boolean) =>
      dispatch({ type: 'SET_NAV_DRAGGING', word, isDragging }),
    resetNavPositions: () =>
      dispatch({ type: 'RESET_NAV_POSITIONS' }),
    updateBackgroundIntensity: () =>
      dispatch({ type: 'UPDATE_BACKGROUND_INTENSITY' }),
    updateSpherePosition: (position: Position) =>
      dispatch({ type: 'UPDATE_SPHERE_POSITION', position }),
    setScatterMode: (active: boolean) =>
      dispatch({ type: 'SET_SCATTER_MODE', active }),
    incrementActiveAnimations: () =>
      dispatch({ type: 'INCREMENT_ACTIVE_ANIMATIONS' }),
    decrementActiveAnimations: () =>
      dispatch({ type: 'DECREMENT_ACTIVE_ANIMATIONS' }),
  };
}

// Helper functions for gravitational calculations
export function calculateGravitationalPull(
  spherePosition: Position,
  elementPosition: Position,
  elementRadius: number = 50
) {
  const dx = spherePosition.x - elementPosition.x;
  const dy = spherePosition.y - elementPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const sphereRadius = 150;
  const maxInfluence = sphereRadius + elementRadius;

  if (distance < maxInfluence && distance > 0) {
    const influence = 1 - distance / maxInfluence;
    const pullStrength = influence * 25;

    const pullX = (dx / distance) * pullStrength;
    const pullY = (dy / distance) * pullStrength;

    return {
      pullX,
      pullY,
      influence,
      distance,
      isInGravityField: true,
    };
  }

  return {
    pullX: 0,
    pullY: 0,
    influence: 0,
    distance,
    isInGravityField: false,
  };
}

export function isInGravityField(
  spherePosition: Position,
  elementPosition: Position,
  elementRadius: number = 50
) {
  const gravity = calculateGravitationalPull(spherePosition, elementPosition, elementRadius);
  return gravity.isInGravityField;
}