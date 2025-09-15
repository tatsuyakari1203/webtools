"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

// Kiểm tra biến môi trường để vô hiệu hóa light mode
const DISABLE_LIGHT_MODE = process.env.DISABLE_LIGHT_MODE === 'true'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  
  // Nếu light mode bị vô hiệu hóa, không hiển thị nút chuyển đổi theme
  if (DISABLE_LIGHT_MODE) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}