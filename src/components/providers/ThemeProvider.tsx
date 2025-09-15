"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

// Kiểm tra biến môi trường để vô hiệu hóa light mode
const DISABLE_LIGHT_MODE = process.env.DISABLE_LIGHT_MODE === 'true'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Nếu DISABLE_LIGHT_MODE được bật, chỉ cho phép dark mode
  const forcedTheme = DISABLE_LIGHT_MODE ? 'dark' : undefined
  
  return (
    <NextThemesProvider 
      {...props} 
      forcedTheme={forcedTheme}
    >
      {children}
    </NextThemesProvider>
  )
}