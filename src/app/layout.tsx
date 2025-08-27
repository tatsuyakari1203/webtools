import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Toaster } from "sonner"
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/StructuredData"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://webtools.example.com'),
  title: {
    default: "WebTools Platform - Công cụ web tiện ích miễn phí",
    template: "%s | WebTools Platform"
  },
  description: "Tập hợp các công cụ web tiện ích miễn phí: chuyển đổi hình ảnh, định dạng văn bản, máy tính, và nhiều công cụ khác trong một nền tảng thống nhất",
  keywords: ["công cụ web", "tiện ích online", "chuyển đổi hình ảnh", "định dạng văn bản", "máy tính online", "công cụ miễn phí", "webtools", "utilities"],
  authors: [{ name: "WebTools Platform" }],
  creator: "WebTools Platform",
  publisher: "WebTools Platform",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://webtools.example.com",
    title: "WebTools Platform - Công cụ web tiện ích miễn phí",
    description: "Tập hợp các công cụ web tiện ích miễn phí: chuyển đổi hình ảnh, định dạng văn bản, máy tính, và nhiều công cụ khác trong một nền tảng thống nhất",
    siteName: "WebTools Platform",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "WebTools Platform - Công cụ web tiện ích",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WebTools Platform - Công cụ web tiện ích miễn phí",
    description: "Tập hợp các công cụ web tiện ích miễn phí: chuyển đổi hình ảnh, định dạng văn bản, máy tính, và nhiều công cụ khác",
    images: ["/images/twitter-image.png"],
    creator: "@webtools_platform",
  },
  verification: {
    google: "google-site-verification-code",
    yandex: "yandex-verification-code",
    yahoo: "yahoo-site-verification-code",
  },
  alternates: {
    canonical: "https://webtools.example.com",
    languages: {
      "vi-VN": "https://webtools.example.com",
      "en-US": "https://webtools.example.com/en",
    },
  },
  category: "technology",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <WebsiteStructuredData
          url="https://webtools.example.com"
          name="WebTools Platform - Công cụ web tiện ích miễn phí"
          description="Tập hợp các công cụ web tiện ích miễn phí: chuyển đổi hình ảnh, định dạng văn bản, máy tính, và nhiều công cụ khác trong một nền tảng thống nhất"
        />
        <OrganizationStructuredData
          name="WebTools Platform"
          url="https://webtools.example.com"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
