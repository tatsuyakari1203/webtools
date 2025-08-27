import HeroSection from "@/components/sections/HeroSection";
import ToolsGrid from "@/components/sections/ToolsGrid";

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ToolsGrid />
    </div>
  );
}
