'use client'

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
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

export interface ImageCropRef {
  generateCrop: () => void
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

const ImageCrop = forwardRef<ImageCropRef, ImageCropProps>(({ src, onCropComplete, aspectRatio, circular = false }, ref) => {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [flip, setFlip] = useState({ horizontal: false, vertical: false })
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    
    if (aspectRatio) {
      const newCrop = centerAspectCrop(width, height, aspectRatio)
      setCrop(newCrop)
      // Đảm bảo completedCrop được set ngay khi ảnh load
      setCompletedCrop(convertToPixelCrop(newCrop, width, height))
    } else {
      // Đối với free form, tạo crop mặc định
      const defaultCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          1, // square aspect ratio as default
          width,
          height,
        ),
        width,
        height,
      )
      setCrop(defaultCrop)
      setCompletedCrop(convertToPixelCrop(defaultCrop, width, height))
    }
  }
  
  // Cập nhật crop khi aspect ratio thay đổi
  React.useEffect(() => {
    if (aspectRatio && imgRef.current) {
      const { width, height } = imgRef.current
      
      // Chỉ reset crop nếu chưa có crop hoặc aspect ratio khác hoàn toàn
      if (!crop || crop.width === 0 || crop.height === 0) {
        const newCrop = centerAspectCrop(width, height, aspectRatio)
        setCrop(newCrop)
        setCompletedCrop(convertToPixelCrop(newCrop, width, height))
      } else {
        // Giữ nguyên vị trí crop hiện tại, chỉ điều chỉnh kích thước theo aspect ratio mới
        const currentCrop = crop
        const newCrop = makeAspectCrop(
          {
            unit: '%',
            x: currentCrop.x,
            y: currentCrop.y,
            width: currentCrop.width,
            height: currentCrop.height,
          },
          aspectRatio,
          width,
          height
        )
        setCrop(newCrop)
        setCompletedCrop(convertToPixelCrop(newCrop, width, height))
      }
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

    // Apply transformations if any
    if (rotate !== 0 || scale !== 1 || flip.horizontal || flip.vertical) {
      const centerX = (crop.width * scaleX) / 2
      const centerY = (crop.height * scaleY) / 2
      
      ctx!.translate(centerX, centerY)
      ctx!.rotate((rotate * Math.PI) / 180)
      ctx!.scale(scale * (flip.horizontal ? -1 : 1), scale * (flip.vertical ? -1 : 1))
      ctx!.translate(-centerX, -centerY)
    }

    // Draw only the cropped area
    ctx!.drawImage(
      image,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
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

  // Expose generateCrop function to parent component
  useImperativeHandle(ref, () => ({
    generateCrop
  }), [generateCrop])

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
              Rotate Left
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotateRight}>
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate Right
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm" onClick={handleFlipHorizontal}>
              <FlipHorizontal className="h-4 w-4 mr-2" />
              Flip Horizontal
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Reset className="h-4 w-4 mr-2" />
              Reset
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
})

ImageCrop.displayName = 'ImageCrop'

export default ImageCrop