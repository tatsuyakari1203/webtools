"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toolsRegistry, getAllCategories, type Tool } from "@/lib/tools-registry"
import { Search, ChevronLeft, ChevronRight, Home, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./SidebarContext"

interface ToolsSidebarProps {
  className?: string
}

export default function ToolsSidebar({ className }: ToolsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Load saved collapse state from localStorage on mount
  useEffect(() => {
    const savedCollapseState = localStorage.getItem('sidebar-collapsed')
    if (savedCollapseState !== null) {
      setIsCollapsed(JSON.parse(savedCollapseState))
    }
  }, [])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const pathname = usePathname()
  const { isHidden } = useSidebar()
  
  const categories = getAllCategories()
  
  const filteredTools = toolsRegistry
    .filter((tool: Tool) => {
      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      // Đưa featured tools lên đầu
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      // Sắp xếp alphabetically trong cùng nhóm
      return a.name.localeCompare(b.name)
    })

  const isToolActive = (toolPath: string) => pathname === toolPath

  if (isHidden) {
    return null
  }

  return (
    <div className={cn(
      "flex flex-col bg-white/10 dark:bg-black/10 backdrop-blur-md border-r border-white/20 dark:border-white/10 transition-all duration-300",
      isCollapsed ? "w-16" : "w-80",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/20 dark:border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-base">Tools</h2>
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {toolsRegistry.length}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newState = !isCollapsed
            setIsCollapsed(newState)
            // Save collapse state to localStorage
            localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
          }}
          className="h-7 w-7 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {/* Search */}
          <div className="p-2 border-b border-white/20 dark:border-white/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm bg-white/20 dark:bg-black/20 border-white/30 dark:border-white/20 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="p-2 border-b border-white/20 dark:border-white/10">
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={selectedCategory === "all" ? "default" : "secondary"}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105 text-xs px-2 py-0.5",
                  selectedCategory === "all" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30"
                )}
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105 text-xs px-2 py-0.5",
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30"
                  )}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tools List */}
      <ScrollArea className="flex-1">
        <div className="p-1.5">
          {/* Home Link */}
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full mb-1 h-8 hover:bg-white/20 dark:hover:bg-white/10 text-sm",
                isCollapsed ? "justify-center" : "justify-start",
                pathname === "/" && "bg-white/30 dark:bg-white/20"
              )}
            >
              <Home className={cn("h-3.5 w-3.5", !isCollapsed && "mr-2 mt-0.5")} />
              {!isCollapsed && "Home"}
            </Button>
          </Link>

          {/* Tools */}
          {isCollapsed ? (
            // Collapsed view - show only icons
            <div className="space-y-0.5">
              {toolsRegistry.map((tool) => {
                const IconComponent = tool.icon
                return (
                  <Link key={tool.id} href={tool.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-8 p-0 relative hover:bg-white/20 dark:hover:bg-white/10",
                        isToolActive(tool.path) && "bg-white/30 dark:bg-white/20"
                      )}
                      title={tool.name}
                    >
                      <IconComponent className="h-3.5 w-3.5" />
                      {tool.featured && (
                        <Star className="h-2 w-2 absolute top-0.5 right-0.5 fill-yellow-400 text-yellow-400" />
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          ) : (
            // Expanded view - show full tool info
            <div className="space-y-0.5">
              {filteredTools.map((tool) => {
                const IconComponent = tool.icon
                return (
                  <Link key={tool.id} href={tool.path}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto p-2 relative hover:bg-white/20 dark:hover:bg-white/10 min-h-[60px]",
                        isToolActive(tool.path) && "bg-white/30 dark:bg-white/20"
                      )}
                    >
                      <div className="flex items-start gap-2.5 w-full">
                        <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-medium text-sm break-words whitespace-normal leading-tight">{tool.name}</span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                              {tool.category}
                            </Badge>
                            {tool.featured && (
                              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug break-words whitespace-normal overflow-wrap-anywhere">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          )}

          {/* No results */}
          {!isCollapsed && filteredTools.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-2">
                No tools found
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}