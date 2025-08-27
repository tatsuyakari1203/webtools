import Link from "next/link"
import { Github, Heart, Code } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:gap-4">
          <p className="text-center sm:text-left">
            © 2024 WebTools Platform. All rights reserved.
          </p>
          <p className="text-center sm:text-right">
            Powered by Next.js, TypeScript & shadcn/ui
          </p>
        </div>
      </div>
    </footer>
  )
}