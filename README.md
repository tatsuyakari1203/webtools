# WebTools - Online Utility Tools Collection

![WebTools Screenshot](screenshot.png)

WebTools is a web application built with Next.js and Bun, providing a comprehensive collection of online utility tools to help users perform daily tasks quickly and efficiently.

## 🛠️ Available Tools

- **Calculator** - A scientific calculator with unit conversion and programmer modes.
- **Text Formatter** - Text formatting and processing tool.
- **Image Name Processor** ⭐ - Image filename processing tool (Featured).
- **Image Converter** - Image conversion and compression tool with detailed statistics.
- **Google Docs to Markdown** - Convert Google Docs to Markdown.
- **OCR** - Extract text from images.

## 🐳 Docker Deployment

This project uses Docker for easy deployment. The primary configuration is available on Docker Hub and can be built from the `Dockerfile` in the root directory.

### Docker Hub Image

The image is available on Docker Hub as `tatsuyakari/webtools:latest`. It's designed for compatibility, automatically detecting and using `bun`, `pnpm`, `yarn`, or `npm`.

- **Registry**: [tatsuyakari/webtools](https://hub.docker.com/r/tatsuyakari/webtools)
- **Base**: `node:22-alpine`
- **Pull Command**:
  ```bash
  docker pull tatsuyakari/webtools:latest
  ```

### Quick Start with Docker

```bash
# Run the image from Docker Hub, mapping host port 5005 to container port 3000
# Remember to provide your GOOGLE_API_KEY if needed
docker run -d -p 5005:3000 --name webtools-app -e GOOGLE_API_KEY="YOUR_API_KEY" tatsuyakari/webtools:latest

# Access the application
open http://localhost:5005
```

### Building Locally

If you need to build the image yourself:

```bash
# 1. Build the image from the Dockerfile
docker build -t webtools:local .

# 2. Run the locally built image
docker run -d -p 5005:3000 --name webtools-app-local webtools:local

# Access the application
open http://localhost:5005
```

### Docker Compose (Recommended for Development)

The `docker-compose.yml` file is configured to run the `tatsuyakari/webtools:latest` image and provides a convenient way to manage the application container.

**`docker-compose.yml` Configuration:**
```yaml
services:
  webtools:
    image: tatsuyakari/webtools:latest
    container_name: webtools-fullstack-app
    restart: unless-stopped
    ports:
      - "5005:3000"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - NEXT_TELEMETRY_DISABLED=1
    networks:
      - webtools-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  webtools-network:
    driver: bridge
```

**Usage:**
```bash
# Create a .env file from the example
cp .env.example .env
# Add your GOOGLE_API_KEY to the .env file

# Start with Docker Compose
docker-compose up -d

# Pull the latest image and restart
docker-compose pull && docker-compose up -d --force-recreate

# Stop and remove containers
docker-compose down
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── tools/
│   │   └── [toolId]/
│   │       └── page.tsx          # Dynamic routing for tools
│   └── ...
├── components/
│   ├── landing/
│   │   └── ToolsGrid.tsx          # Displays the list of tools
│   └── ui/                        # Shadcn/ui components
├── lib/
│   └── tools-registry.ts          # Tool registration and management
└── tools/
    ├── calculator/
    ├── image-converter/
    └── ...                        # Each tool in its own directory
```

## 🚀 Adding New Tools Guide

Follow these steps to add a new tool to the WebTools collection.

### Step 1: Create the Tool Component
Create a new directory for your tool inside `src/tools/`. For example, for a tool named "My Awesome Tool":
`src/tools/my-awesome-tool/MyAwesomeTool.tsx`

### Step 2: Register Your Tool
Open `/src/lib/tools-registry.ts` and add a new entry to the `toolsRegistry` array.

```typescript
// src/lib/tools-registry.ts
import { YourLucideIcon } from 'lucide-react';

export const toolsRegistry: Tool[] = [
  // ... other tools
  {
    id: 'my-awesome-tool',
    name: 'My Awesome Tool',
    description: 'A short and clear description of what the tool does.',
    category: 'Utility',
    icon: YourLucideIcon,
    path: '/tools/my-awesome-tool',
    featured: false,
  },
];
```

### Step 3: Add the Tool to the Router
Open `/src/app/tools/[toolId]/page.tsx`, import your new tool, and add a new `case` to the `switch` statement inside the `renderTool` function.

```tsx
// src/app/tools/[toolId]/page.tsx
import MyAwesomeTool from '@/tools/my-awesome-tool/MyAwesomeTool';
// ... other imports

const renderTool = () => {
  switch (toolId) {
    // ... other cases
    case 'my-awesome-tool':
      return <MyAwesomeTool />;
    default:
      return <ComingSoonTool tool={tool} />;
  }
};
```

## 🔧 Development

This project uses **Bun** as the package manager and runtime.

### Install Dependencies
```bash
bun install
```

### Run Development Server
```bash
bun run dev
```

### Build and Check
```bash
bun run build
bun run lint
```

### Add Shadcn/ui Components
```bash
bunx shadcn-ui@latest add [component-name]
```

## 📦 Deployment

### Vercel
1. Push code to GitHub.
2. Connect repository with Vercel.
3. Automatic deployment.

### Manual Build
```bash
# Build the application
bun run build

# Start the server
bun start
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Implement tool following defined patterns
4. Test thoroughly
5. Submit pull request

## 📝 Docker Image Optimization Details

The primary Docker image (`webtools:minimal`) is highly optimized for production using a multi-stage build process:

- **Stage 1 (Dependencies)**: Uses `oven/bun:1-alpine` to install dependencies.
- **Stage 2 (Builder)**: Copies source code and builds the Next.js application using `bun run build`. This creates a standalone output.
- **Stage 3 (Runner)**: Uses a minimal `alpine:3.19` image, installs only the Node.js runtime, and copies only the necessary standalone artifacts from the builder stage. This results in a very small and secure final image.

**Key Optimizations:**
- **Bun Runtime**: Uses the fast `bun` runtime for dependency installation and builds.
- **Multi-stage build**: Separates build-time dependencies from the final runtime image.
- **Alpine Linux Base**: Minimal footprint for the final stage.
- **Standalone Next.js Output**: Reduces the number of files and dependencies needed in the final image.
- **Non-root user**: Enhances security by running the application as a non-root user.

---

**WebTools** - Making daily work easier! 🚀
