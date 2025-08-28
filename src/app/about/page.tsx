import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About WebTools Platform</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A modern web application providing comprehensive utility tools to streamline your daily workflow.
          Built with cutting-edge technologies for optimal performance and user experience.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary">Next.js 15.5.2</Badge>
          <Badge variant="secondary">React 19.1.0</Badge>
          <Badge variant="secondary">Bun 1.2.21</Badge>
          <Badge variant="secondary">TypeScript 5</Badge>
          <Badge variant="secondary">Docker Ready</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Mission</CardTitle>
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
            <CardTitle>⚡ Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              • Modern interface with light/dark theme<br/>
              • Responsive design for all devices<br/>
              • Tools organized by categories<br/>
              • Completely free and no registration required<br/>
              • Fast loading with optimized performance<br/>
              • Docker-ready deployment
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🛠️ Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              • Next.js 15.5.2 + React 19.1.0<br/>
              • TypeScript 5 for type safety<br/>
              • Bun 1.2.21 runtime for speed<br/>
              • Tailwind CSS for styling<br/>
              • shadcn/ui component library<br/>
              • Node.js 22.18.0 compatibility
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Available Tools</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>🧮 Calculator Suite</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                <strong>Scientific Calculator</strong><br/>
                • Advanced mathematical functions<br/>
                • Unit conversions (length, weight, temperature, volume)<br/>
                • Programmer modes (Hex, Binary, Octal)<br/>
                • Calculation history tracking<br/>
                • Multiple calculation modes in one interface
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🖼️ Image Processing Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                <strong>Image Converter</strong><br/>
                • Format conversion & compression<br/>
                • Detailed statistics and optimization<br/><br/>
                <strong>Image Name Processor</strong> ⭐<br/>
                • Batch rename and organize images<br/><br/>
                <strong>OCR Tool</strong><br/>
                • Text extraction from images
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📝 Text Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                <strong>Text Formatter</strong><br/>
                • Advanced text manipulation<br/>
                • Multiple formatting options<br/><br/>
                <strong>Google Docs to Markdown</strong><br/>
                • Seamless document conversion<br/>
                • Clean, formatted output<br/>
                • Based on mr0grog/google-docs-to-markdown
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🚀 Performance & Deployment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                <strong>Optimized Architecture</strong><br/>
                • Multi-stage Docker builds<br/>
                • Alpine Linux base (lightweight)<br/>
                • Non-root security<br/>
                • Available on Docker Hub<br/>
                • Vercel deployment ready<br/>
                • Health checks included
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Development & Contribution</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>🔧 Development Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                <strong>Quick Start:</strong><br/>
                • <code>bun install</code> - Install dependencies<br/>
                • <code>bun run dev</code> - Start development server<br/>
                • <code>bun run build</code> - Build for production<br/>
                • <code>bunx shadcn-ui@latest add [component]</code> - Add UI components
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤝 Contributing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                <strong>How to Contribute:</strong><br/>
                1. Fork the repository<br/>
                2. Create a feature branch<br/>
                3. Implement your tool following our patterns<br/>
                4. Test thoroughly<br/>
                5. Submit a pull request with detailed description
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-center space-y-4 pt-8">
        <h3 className="text-2xl font-semibold">🌟 WebTools - Streamlining your digital workflow 🌟</h3>
        <p className="text-muted-foreground">
          Built with ❤️ using Next.js, Bun, and modern web technologies
        </p>
      </div>
    </div>
  );
}