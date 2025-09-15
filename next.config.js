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
  // Tối ưu performance - temporarily disabled
  // experimental: {
  //   optimizeCss: true,
  //   optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  // },
  // Webpack optimization - temporarily disabled
  // webpack: (config, { dev, isServer }) => {
  //   if (!dev && !isServer) {
  //     config.optimization.splitChunks = {
  //       chunks: 'all',
  //       cacheGroups: {
  //         vendor: {
  //           test: /[\/]node_modules[\/]/,
  //           name: 'vendors',
  //           chunks: 'all',
  //         },
  //       },
  //     }
  //   }
  //   return config
  // },
}

module.exports = nextConfig