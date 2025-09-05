// Image Processing Worker
// Handles heavy image operations without blocking the main thread

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageProcessingMessage {
  type: 'crop' | 'special-crop' | 'resize' | 'rotate' | 'flip';
  imageData: ImageData;
  options: CropOptions | SpecialCropOptions | ResizeOptions | RotateOptions | FlipOptions;
}

export interface CropOptions {
  ratio: number;
  cropData: CropData;
}

export interface SpecialCropOptions {
  mode: 'special' | 'special2';
  cropData: CropData;
}

export interface ResizeOptions {
  width: number;
  height: number;
}

export interface RotateOptions {
  angle: number;
}

export interface FlipOptions {
  horizontal: boolean;
  vertical: boolean;
}

export interface CropResult {
  type: 'crop-result';
  images: ImageData[];
  success: boolean;
  error?: string;
}

self.onmessage = function(e: MessageEvent<ImageProcessingMessage>) {
  const { type, imageData, options } = e.data;
  
  try {
    switch (type) {
      case 'crop':
        handleCrop(imageData, options as CropOptions);
        break;
      case 'special-crop':
        handleSpecialCrop(imageData, options as SpecialCropOptions);
        break;
      case 'resize':
        handleResize(imageData, options as ResizeOptions);
        break;
      case 'rotate':
        handleRotate(imageData, options as RotateOptions);
        break;
      case 'flip':
        handleFlip(imageData, options as FlipOptions);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'crop-result',
      images: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as CropResult);
  }
};

function handleCrop(imageData: ImageData, options: CropOptions) {
  const { ratio, cropData } = options;
  const canvas = new OffscreenCanvas(cropData.width, cropData.height);
  const ctx = canvas.getContext('2d')!;
  
  // Create ImageData from cropped area
  const croppedImageData = new ImageData(
    imageData.data.slice(),
    imageData.width,
    imageData.height
  );
  
  // Put cropped data on canvas
  ctx.putImageData(croppedImageData, -cropData.x, -cropData.y);
  
  const results: ImageData[] = [];
  const squareWidth = cropData.width / ratio;
  
  for (let i = 0; i < ratio; i++) {
    const squareCanvas = new OffscreenCanvas(squareWidth, squareWidth);
    const squareCtx = squareCanvas.getContext('2d')!;
    
    // Extract square portion
    const sourceImageData = ctx.getImageData(i * squareWidth, 0, squareWidth, squareWidth);
    squareCtx.putImageData(sourceImageData, 0, 0);
    
    results.push(squareCtx.getImageData(0, 0, squareWidth, squareWidth));
  }
  
  self.postMessage({
    type: 'crop-result',
    images: results,
    success: true
  } as CropResult);
}

function handleSpecialCrop(imageData: ImageData, options: SpecialCropOptions) {
  const { mode, cropData } = options;
  const canvas = new OffscreenCanvas(cropData.width, cropData.height);
  const ctx = canvas.getContext('2d')!;
  
  // Create ImageData from cropped area
  const croppedImageData = new ImageData(
    imageData.data.slice(),
    imageData.width,
    imageData.height
  );
  
  ctx.putImageData(croppedImageData, -cropData.x, -cropData.y);
  
  const results: ImageData[] = [];
  
  if (mode === 'special2') {
    // Special2 mode: 1 rectangle (2:1) + 2 squares
    const fullWidth = cropData.width;
    const rectHeight = fullWidth / 2;
    
    // Rectangle (2:1)
    const rectImageData = ctx.getImageData(0, 0, fullWidth, rectHeight);
    results.push(rectImageData);
    
    // Two squares
    const squareSize = rectHeight;
    const square1 = ctx.getImageData(0, rectHeight, squareSize, squareSize);
    const square2 = ctx.getImageData(squareSize, rectHeight, squareSize, squareSize);
    
    results.push(square1, square2);
  } else if (mode === 'special') {
    // Special mode: 5 parts with 6:5 ratio
    const fullWidth = cropData.width;
    const specialHeight = (5 / 6) * fullWidth;
    
    // Top section (3/5 of height) - split into 2
    const topHeight = (3 / 5) * specialHeight;
    const topPartWidth = fullWidth / 2;
    
    const top1 = ctx.getImageData(0, 0, topPartWidth, topHeight);
    const top2 = ctx.getImageData(topPartWidth, 0, topPartWidth, topHeight);
    
    // Bottom section (2/5 of height) - split into 3
    const bottomHeight = (2 / 5) * specialHeight;
    const bottomPartWidth = fullWidth / 3;
    
    const bottom1 = ctx.getImageData(0, topHeight, bottomPartWidth, bottomHeight);
    const bottom2 = ctx.getImageData(bottomPartWidth, topHeight, bottomPartWidth, bottomHeight);
    const bottom3 = ctx.getImageData(2 * bottomPartWidth, topHeight, bottomPartWidth, bottomHeight);
    
    results.push(top1, top2, bottom1, bottom2, bottom3);
  }
  
  self.postMessage({
    type: 'crop-result',
    images: results,
    success: true
  } as CropResult);
}

function handleResize(imageData: ImageData, options: ResizeOptions) {
  const { width, height } = options;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  
  // Create temporary canvas with original image
  const tempCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(imageData, 0, 0);
  
  // Draw resized image
  ctx.drawImage(tempCanvas, 0, 0, imageData.width, imageData.height, 0, 0, width, height);
  
  const result = ctx.getImageData(0, 0, width, height);
  
  self.postMessage({
    type: 'crop-result',
    images: [result],
    success: true
  } as CropResult);
}

function handleRotate(imageData: ImageData, options: RotateOptions) {
  const { angle } = options;
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d')!;
  
  // Rotate canvas
  ctx.translate(imageData.width / 2, imageData.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-imageData.width / 2, -imageData.height / 2);
  
  // Draw rotated image
  ctx.putImageData(imageData, 0, 0);
  
  const result = ctx.getImageData(0, 0, imageData.width, imageData.height);
  
  self.postMessage({
    type: 'crop-result',
    images: [result],
    success: true
  } as CropResult);
}

function handleFlip(imageData: ImageData, options: FlipOptions) {
  const { horizontal, vertical } = options;
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d')!;
  
  // Apply flip transformations
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.translate(
    horizontal ? -imageData.width : 0,
    vertical ? -imageData.height : 0
  );
  
  // Draw flipped image
  ctx.putImageData(imageData, 0, 0);
  
  const result = ctx.getImageData(0, 0, imageData.width, imageData.height);
  
  self.postMessage({
    type: 'crop-result',
    images: [result],
    success: true
  } as CropResult);
}

export {};