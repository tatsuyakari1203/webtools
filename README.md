# WebTools - Online Utility Tools Collection

![WebTools Screenshot](screenshot.png)

WebTools is a web application built with Next.js that provides a comprehensive collection of online utility tools to help users perform daily tasks quickly and efficiently.

## 🛠️ Available Tools

- **Calculator** - Basic calculator with user-friendly interface
- **Text Formatter** - Text formatting and processing tool
- **Image Name Processor** ⭐ - Image filename processing tool (Featured)
- **Image Converter** - Image conversion and compression tool with detailed statistics

## 🐳 Docker Deployment

### Docker Hub Image

WebTools is available as an optimized Docker image on Docker Hub:

```bash
# Pull the latest optimized image (141MB)
docker pull tatsuyakari/webtools:latest
```

**Image Details:**
- **Size**: 141MB (optimized from 187MB - 25% reduction)
- **Base**: Alpine Linux with Node.js runtime
- **Architecture**: Multi-stage build with standalone Next.js output
- **Registry**: [tatsuyakari/webtools](https://hub.docker.com/r/tatsuyakari/webtools)

### Quick Start with Docker

```bash
# Run directly with Docker
docker run -d -p 5005:5005 --name webtools tatsuyakari/webtools:latest

# Access the application
open http://localhost:5005
```

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/tatsuyakari/webtools.git
cd webtools

# Start with Docker Compose
docker-compose up -d

# Pull latest image and restart
docker-compose up -d --pull always

# Force recreate with latest image
docker-compose up -d --pull always --force-recreate
```

### Docker Compose Configuration

```yaml
version: '3.8'
services:
  webtools:
    image: webtools:minimal  # or tatsuyakari/webtools:latest
    ports:
      - "5005:5005"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

### Building from Source

```bash
# Build optimized image locally
docker build -t webtools:local .

# Run local build
docker run -d -p 5005:5005 webtools:local
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── tools/
│   │   └── [toolId]/
│   │       └── page.tsx          # Dynamic routing cho tools
│   └── ...
├── components/
│   ├── landing/
│   │   └── ToolsGrid.tsx          # Hiển thị danh sách tools
│   ├── sections/
│   └── ui/                        # Shadcn/ui components
├── lib/
│   └── tools-registry.ts          # Đăng ký và quản lý tools
└── tools/
    ├── calculator/
    ├── text-formatter/
    ├── image-name-processor/
    ├── image-converter/
    └── index.ts                   # Export tổng hợp
```

## 🚀 Adding New Tools Guide

### Step 1: Create Directory Structure

Create a new directory in `/src/tools/` with the following structure:

```
src/tools/your-tool-name/
├── YourToolName.tsx              # Component chính
├── index.tsx                     # Export pattern
├── types.ts                      # TypeScript interfaces (tùy chọn)
├── components/                   # Sub-components (tùy chọn)
│   └── SubComponent.tsx
├── utils/                        # Utility functions (tùy chọn)
│   └── helpers.ts
└── workers/                      # Web Workers (tùy chọn)
    └── processor.worker.ts
```

### Step 2: Create Main Component

Create `YourToolName.tsx` file:

```tsx
import React from 'react';

const YourToolName: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Tool Name</h1>
      {/* Your tool content */}
    </div>
  );
};

export default YourToolName;
```

### Step 3: Create Export File

Create `index.tsx` file with export pattern:

```tsx
// Pattern 1: Simple export (recommended for simple tools)
import YourToolName from './YourToolName';
export default YourToolName;

// Pattern 2: Re-export with types (for complex tools)
export { default } from './YourToolName';
export * from './types';
```

### Step 4: Register Tool in Registry

Add tool to `/src/lib/tools-registry.ts`:

```typescript
export const toolsRegistry = [
  // ... existing tools
  {
    id: 'your-tool-id',
    name: 'Your Tool Name',
    description: 'Brief description of your tool',
    category: 'productivity', // or 'utility', 'media', etc.
    icon: 'IconName', // Lucide React icon
    path: '/tools/your-tool-id',
    featured: false // true if you want to display at the top of the list
  }
];
```

### Step 5: Add Routing

Update `/src/app/tools/[toolId]/page.tsx`:

```tsx
// Import tool component
import YourToolName from '@/tools/your-tool-name';

// Add new case in switch statement
switch (tool.id) {
  // ... existing cases
  case 'your-tool-id':
    return <YourToolName />;
  default:
    return <div>Tool not found</div>;
}
```

### Step 6: Update Exports

Add export to `/src/tools/index.ts`:

```typescript
export { default as YourToolName } from './your-tool-name';
```

## 🎯 Patterns and Best Practices

### Dynamic Routing
- Use Next.js App Router with dynamic segments `[toolId]`
- Tool ID is extracted from URL and matched with registry
- Each tool is rendered as a separate component

### Component Organization
- **Main Component**: Main logic and UI of the tool
- **Sub-components**: Break down complex UI into smaller components
- **Types**: Define TypeScript interfaces for type safety
- **Utils**: Utility functions and business logic
- **Workers**: Web Workers for heavy processing (like Image Converter)

### Featured Tools
- Use `featured: true` in registry for priority display
- Featured tools are automatically sorted to the top of the list
- Currently only Image Name Processor is marked as featured

### Styling
- Use Tailwind CSS for styling
- Shadcn/ui components for UI consistency
- Responsive design by default

## 🔧 Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build and Check
```bash
npm run build
npm run lint
```

### Add Shadcn/ui Components
```bash
npx shadcn@latest add [component-name]
```

## 📦 Deployment

### Docker (Recommended)

#### Using Docker Compose
```bash
# Production deployment
docker-compose up -d --pull always

# Development with local build
docker-compose -f docker-compose.dev.yml up -d
```

#### Using Docker directly
```bash
# Pull and run latest image
docker pull tatsuyakari/webtools:latest
docker run -d -p 5005:5005 --name webtools tatsuyakari/webtools:latest

# Build and run locally
docker build -t webtools:local .
docker run -d -p 5005:5005 webtools:local
```

### Vercel
1. Push code to GitHub
2. Connect repository with Vercel
3. Automatic deployment

### Manual Build
```bash
npm run build
npm start
```

### Environment Variables

For production deployment, you may need to set:

```bash
# Docker environment
NODE_ENV=production
PORT=5005

# Next.js configuration
NEXT_TELEMETRY_DISABLED=1
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Implement tool following defined patterns
4. Test thoroughly
5. Submit pull request

## 📝 Notes

- All tools use TypeScript
- UI components from Shadcn/ui to ensure consistency
- Web Workers are encouraged for heavy processing tasks
- Responsive design is mandatory
- Code must pass lint checks before deployment

## 🔧 Docker Image Optimization

The Docker image has been optimized for production use:

- **Multi-stage build**: Separates build and runtime environments
- **Alpine Linux base**: Minimal footprint with security updates
- **Standalone Next.js**: Reduces dependencies and bundle size
- **Layer optimization**: Efficient caching and minimal layers
- **Size reduction**: From 187MB to 141MB (25% smaller)

### Build Process

```dockerfile
# Build stage
FROM node:18-alpine AS builder
# ... build process

# Production stage
FROM node:18-alpine AS runner
# ... optimized runtime
```

---

**WebTools** - Making daily work easier! 🚀
