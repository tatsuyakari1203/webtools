/** @type {import('next').NextConfig} */
const nextConfig = {
  // Truyền biến môi trường đến client-side
  env: {
    DISABLE_LIGHT_MODE: process.env.DISABLE_LIGHT_MODE || 'false',
  },
  // Cấu hình logging để giảm noise
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  // Tối ưu bundle size
  compress: true,
  // Loại bỏ source maps trong production
  productionBrowserSourceMaps: false,
  // Cấu hình cho static export
  trailingSlash: true,
  output: 'standalone',
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75, 85, 90, 95],
  },
  // External packages for server components
  serverExternalPackages: [],
  // Tối ưu performance
  experimental: {
    // optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'], // Disabled for testing
  },
  // Minimal webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Disable chunk splitting for single bundle
      config.optimization.splitChunks = {
        chunks: 'initial',
        cacheGroups: {
          default: false,
          vendors: false,
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig