import HeroSection from "@/components/sections/HeroSection";
import ToolsGrid from "@/components/sections/ToolsGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://webtools.example.com',
  },
};

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ToolsGrid />
    </div>
  );
}
