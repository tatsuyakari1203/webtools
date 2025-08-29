import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section 
      className="relative overflow-hidden py-24 sm:py-32"
      aria-labelledby="hero-heading"
      role="banner"
    >
      {/* Glassmorphism gradient overlay on top of wallpaper for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white/5 to-secondary/5 dark:via-black/5 backdrop-blur-[1px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-foreground/80 ring-1 ring-white/20 dark:ring-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-sm hover:ring-primary/30 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300">
              <span className="flex items-center gap-2" role="text">
                <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
                Modern and useful web tools
              </span>
            </div>
          </div>
          
          <h1 
            id="hero-heading"
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
          >
            Collection of{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              web tools
            </span>{" "}
            in one platform
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Discover a collection of powerful web tools designed to boost productivity 
            and simplify your workflow. From calculators to text formatting tools, 
            everything is available in one place.
          </p>
          
          <nav className="mt-10 flex items-center justify-center gap-x-6" aria-label="Primary navigation">
            <Button asChild size="lg" className="group">
              <Link 
                href="#tools"
                aria-describedby="hero-heading"
              >
                Explore Tools
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </nav>
        </header>
      </div>
    </section>
  )
}