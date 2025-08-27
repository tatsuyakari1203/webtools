import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About WebTools Platform</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A platform that brings together useful web tools, helping you perform daily tasks easily and efficiently.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create a centralized platform for useful webapp tools that are easy to use with a modern interface.
              Save users time by eliminating the need to search multiple different websites.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚡ Features</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              • Modern interface with light/dark theme<br/>
              • Responsive design for all devices<br/>
              • Tools organized by categories<br/>
              • Completely free and no registration required
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛠️ Technology</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              • Next.js 14 + React 18<br/>
              • TypeScript cho type safety<br/>
              • Tailwind CSS cho styling<br/>
              • shadcn/ui component library
            </CardDescription>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}