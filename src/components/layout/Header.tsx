'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { InventoryDialog } from '@/components/inventory/InventoryDialog';
import { ThrowButton } from '@/components/inventory/ThrowButton';
import { Button } from '@/components/ui/button';
import { Github, Package, ImageIcon } from 'lucide-react';
import { WallpaperManager } from './WallpaperManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ToolCaseIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-6 w-6 text-primary"
  >
    <path d="M10 15h4"/>
    <path d="m14.817 10.995-.971-1.45 1.034-1.232a2 2 0 0 0-2.025-3.238l-1.82.364L9.91 3.885a2 2 0 0 0-3.625.748L6.141 6.55l-1.725.426a2 2 0 0 0-.19 3.756l.657.27"/>
    <path d="m18.822 10.995 2.26-5.38a1 1 0 0 0-.557-1.318L16.954 2.9a1 1 0 0 0-1.281.533l-.924 2.122"/>
    <path d="M4 12.006A1 1 0 0 1 4.994 11H19a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
  </svg>
);

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/5">
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ToolCaseIcon />
            <span className="font-bold text-xl">WebTools</span>
          </Link>
        </div>
        
        {/* Center buttons */}
        <div className="flex-1 flex justify-center items-center space-x-2">
          <InventoryDialog>
            <Button variant="outline" size="sm" className="flex items-center gap-2" title="Inventory Manager">
              <Package className="h-4 w-4" />
              <span className="text-xs">Store</span>
            </Button>
          </InventoryDialog>
          
          <ThrowButton 
            source="WebTools Header"
            variant="outline"
            size="icon"
            showTooltip={true}
          />
        </div>
        
        {/* Right side navigation and controls */}
        <div className="flex items-center space-x-2">
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
              About
            </Link>
          </nav>
          
          <Link
            href="https://github.com/tatsuyakari1203/webtools"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Visit GitHub repository"
          >
            <Github className="h-5 w-5" />
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2" title="Custom Background">
                <ImageIcon className="h-4 w-4" />
                <span className="text-xs">Background</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 p-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Wallpaper Settings
                </DialogTitle>
              </DialogHeader>
              <WallpaperManager />
            </DialogContent>
          </Dialog>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}