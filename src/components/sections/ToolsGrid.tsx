"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ToolCard } from "@/components/ui/tool-card"
import { toolsRegistry, getAllCategories, Tool } from "@/lib/tools-registry"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ToolsGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
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

  return (
    <section id="tools" className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="rounded-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* No results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <div className="rounded-lg bg-muted/50 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tools found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try changing search keywords or category filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            Showing {filteredTools.length} of {toolsRegistry.length} tools
          </div>
        </div>
      </div>
    </section>
  )
}