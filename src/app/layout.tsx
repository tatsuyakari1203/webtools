import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { InventoryProvider } from "@/components/providers/InventoryProvider"
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
    default: "WebTools Platform - Free Web Utilities",
    template: "%s | WebTools Platform"
  },
  icons: {
    icon: '/tool-case.svg',
    shortcut: '/tool-case.svg',
    apple: '/tool-case.svg',
  },
  description: "Collection of free web utilities: image conversion, text formatting, calculator, and many other tools in a unified platform",
  keywords: ["web tools", "online utilities", "image conversion", "text formatting", "online calculator", "free tools", "webtools", "utilities"],
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
    locale: "en_US",
    url: "https://webtools.example.com",
    title: "WebTools Platform - Free Web Utilities",
    description: "Collection of free web utilities: image conversion, text formatting, calculator, and many other tools in a unified platform",
    siteName: "WebTools Platform",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "WebTools Platform - Web Utilities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WebTools Platform - Free Web Utilities",
    description: "Collection of free web utilities: image conversion, text formatting, calculator, and many other tools",
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
      "en-US": "https://webtools.example.com",
      "vi-VN": "https://webtools.example.com/vi",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <WebsiteStructuredData
          url="https://webtools.example.com"
          name="WebTools Platform - Free Web Utilities"
          description="Collection of free web utilities: image conversion, text formatting, calculator, and many other tools in a unified platform"
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
          <InventoryProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
            <Toaster richColors position="top-right" />
          </InventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
