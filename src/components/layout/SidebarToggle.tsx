"use client"

import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useSidebar } from "./SidebarContext"

export default function SidebarToggle() {
  const { isHidden, toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="h-9 w-9 p-0 hover:bg-white/20 dark:hover:bg-white/10"
      title={isHidden ? "Show sidebar" : "Hide sidebar"}
    >
      {isHidden ? (
        <PanelLeftOpen className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  )
}