'use client'

import React, { createContext, useContext } from 'react'
import { animationStore } from '@/stores/AnimationStore'

// Create context for stores
const StoreContext = createContext({
  animationStore,
})

// Provider component
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StoreContext.Provider value={{ animationStore }}>
      {children}
    </StoreContext.Provider>
  )
}

// Hook to use stores
export const useStores = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStores must be used within a StoreProvider')
  }
  return context
}