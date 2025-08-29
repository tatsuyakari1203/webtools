'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWallpaper } from '../providers/WallpaperProvider'
import { ImageIcon, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface WallpaperDialogProps {
  children: React.ReactNode
}

export function WallpaperDialog({ children }: WallpaperDialogProps) {
  const { wallpaperUrl, setWallpaperUrl, resetToDefault, enableBlur, setEnableBlur } = useWallpaper()
  const [inputUrl, setInputUrl] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputUrl.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    // Basic URL validation
    try {
      new URL(inputUrl)
    } catch {
      toast.error('Invalid URL')
      return
    }

    setIsLoading(true)
    
    // Test if image can be loaded
    const img = new Image()
    img.onload = () => {
      setWallpaperUrl(inputUrl)
      setIsOpen(false)
      setInputUrl('')
      setIsLoading(false)
      toast.success('Background updated successfully!')
    }
    img.onerror = () => {
      setIsLoading(false)
      toast.error('Unable to load image from this URL')
    }
    img.src = inputUrl
  }

  const handleReset = () => {
    resetToDefault()
    setIsOpen(false)
    setInputUrl('')
    toast.success('Default background restored!')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setInputUrl(wallpaperUrl)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Custom Background
          </DialogTitle>
          <DialogDescription>
            Enter an image URL to change the website background.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallpaper-url">Image URL</Label>
              <Input
                id="wallpaper-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-blur"
                checked={enableBlur}
                onCheckedChange={(checked) => setEnableBlur(checked as boolean)}
                className="border-white/20 dark:border-white/10 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="enable-blur" className="text-sm font-normal">
                Enable blur effect
              </Label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary/80 hover:bg-primary backdrop-blur-sm"
            >
              {isLoading ? 'Checking...' : 'Apply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}