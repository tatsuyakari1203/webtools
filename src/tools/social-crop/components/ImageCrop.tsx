'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, FlipHorizontal, RotateCcw as Reset } from 'lucide-react'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropProps {
  src: string
  onCropComplete: (croppedImageUrl: string) => void
  aspectRatio?: number
  circular?: boolean
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCrop({ src, onCropComplete, aspectRatio, circular = false }: ImageCropProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [flip, setFlip] = useState({ horizontal: false, vertical: false })
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspectRatio) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspectRatio))
    }
  }
  
  // Cập nhật crop khi aspect ratio thay đổi
  React.useEffect(() => {
    if (aspectRatio && imgRef.current) {
      const { width, height } = imgRef.current
      const newCrop = centerAspectCrop(width, height, aspectRatio)
      setCrop(newCrop)
      // Force update completed crop để đồng bộ
      setCompletedCrop(convertToPixelCrop(newCrop, width, height))
    }
  }, [aspectRatio])

  const generateCrop = useCallback(async () => {
    if (
      !completedCrop ||
      !previewCanvasRef.current ||
      !imgRef.current
    ) {
      return
    }

    const image = imgRef.current
    const canvas = previewCanvasRef.current
    const crop = completedCrop

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext('2d')
    const pixelRatio = window.devicePixelRatio

    canvas.width = crop.width * pixelRatio * scaleX
    canvas.height = crop.height * pixelRatio * scaleY

    ctx!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx!.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY

    const centerX = image.naturalWidth / 2
    const centerY = image.naturalHeight / 2

    ctx!.save()

    ctx!.translate(-cropX, -cropY)
    ctx!.translate(centerX, centerY)
    ctx!.rotate((rotate * Math.PI) / 180)
    ctx!.scale(scale * (flip.horizontal ? -1 : 1), scale * (flip.vertical ? -1 : 1))
    ctx!.translate(-centerX, -centerY)
    ctx!.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    )

    ctx!.restore()

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        onCropComplete(url)
      }
    }, 'image/png')
  }, [completedCrop, scale, rotate, flip, onCropComplete])

  const handleRotateLeft = () => setRotate((prev) => prev - 90)
  const handleRotateRight = () => setRotate((prev) => prev + 90)
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3))
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.1))
  const handleFlipHorizontal = () => setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }))
  const handleReset = () => {
    setScale(1)
    setRotate(0)
    setFlip({ horizontal: false, vertical: false })
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={handleRotateLeft}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Xoay trái
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotateRight}>
              <RotateCw className="h-4 w-4 mr-2" />
              Xoay phải
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Phóng to
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Thu nhỏ
            </Button>
            <Button variant="outline" size="sm" onClick={handleFlipHorizontal}>
              <FlipHorizontal className="h-4 w-4 mr-2" />
              Lật ngang
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Reset className="h-4 w-4 mr-2" />
              Đặt lại
            </Button>
            <Button onClick={generateCrop} className="bg-blue-600 hover:bg-blue-700">
              Cắt ảnh
            </Button>
          </div>

          {/* Crop Area */}
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current!.width, imgRef.current!.height))}
              aspect={aspectRatio}
              circularCrop={circular}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg) scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})`,
                  maxWidth: '100%',
                  maxHeight: '500px',
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          {/* Hidden canvas for generating cropped image */}
          <canvas
            ref={previewCanvasRef}
            style={{
              display: 'none',
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}