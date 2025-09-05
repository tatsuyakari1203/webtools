"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface SidebarContextType {
  isHidden: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(false)

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-hidden')
    if (savedState !== null) {
      setIsHidden(JSON.parse(savedState))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isHidden
    setIsHidden(newState)
    // Save state to localStorage
    localStorage.setItem('sidebar-hidden', JSON.stringify(newState))
  }

  return (
    <SidebarContext.Provider value={{ isHidden, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}