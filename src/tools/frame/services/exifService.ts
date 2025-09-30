/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExifData, CameraBrand } from '../types';

// EXIF tag constants
const EXIF_TAGS = {
  // Camera info
  MAKE: 0x010F,
  MODEL: 0x0110,
  
  // Settings
  APERTURE: 0x829D,
  SHUTTER_SPEED: 0x829A,
  ISO: 0x8827,
  FOCAL_LENGTH: 0x920A,
  
  // DateTime
  DATETIME: 0x0132,
  DATETIME_ORIGINAL: 0x9003,
  DATETIME_DIGITIZED: 0x9004,
  
  // GPS
  GPS_LATITUDE: 0x0002,
  GPS_LONGITUDE: 0x0004,
  GPS_LATITUDE_REF: 0x0001,
  GPS_LONGITUDE_REF: 0x0003,
} as const;

// Camera brand detection
const CAMERA_BRANDS: Record<string, CameraBrand> = {
  'canon': 'Canon',
  'nikon': 'Nikon',
  'sony': 'Sony',
  'fujifilm': 'Fujifilm',
  'olympus': 'Olympus',
  'panasonic': 'Panasonic',
  'leica': 'Leica',
  'pentax': 'Pentax',
  'hasselblad': 'Hasselblad',
  'phase one': 'PhaseOne',
  'apple': 'Apple',
  'samsung': 'Samsung',
  'google': 'Google',
  'huawei': 'Huawei',
  'xiaomi': 'Xiaomi',
  'oneplus': 'OnePlus'
};

// Helper function to read bytes from ArrayBuffer
function readBytes(buffer: ArrayBuffer, offset: number, length: number): Uint8Array {
  return new Uint8Array(buffer, offset, length);
}

// Helper function to read 16-bit integer
function read16(buffer: ArrayBuffer, offset: number, littleEndian: boolean): number {
  const view = new DataView(buffer);
  return view.getUint16(offset, littleEndian);
}

// Helper function to read 32-bit integer
function read32(buffer: ArrayBuffer, offset: number, littleEndian: boolean): number {
  const view = new DataView(buffer);
  return view.getUint32(offset, littleEndian);
}

// Helper function to read string
function readString(buffer: ArrayBuffer, offset: number, length: number): string {
  const bytes = readBytes(buffer, offset, length);
  return new TextDecoder().decode(bytes).replace(/\0/g, '');
}

// Helper function to read rational number
function readRational(buffer: ArrayBuffer, offset: number, littleEndian: boolean): number {
  const numerator = read32(buffer, offset, littleEndian);
  const denominator = read32(buffer, offset + 4, littleEndian);
  return denominator !== 0 ? numerator / denominator : 0;
}

// Format aperture value
function formatAperture(value: number): string {
  if (value <= 0) return 'f/0';
  const aperture = Math.pow(2, value / 2);
  return `f/${aperture.toFixed(1)}`;
}

// Format shutter speed
function formatShutterSpeed(value: number): string {
  if (value <= 0) return '1/0s';
  if (value >= 1) return `${value.toFixed(1)}s`;
  const denominator = Math.round(1 / value);
  return `1/${denominator}s`;
}

// Format focal length
function formatFocalLength(value: number): string {
  return `${Math.round(value)}mm`;
}

// Detect camera brand from make
function detectCameraBrand(make: string): CameraBrand {
  const makeLower = make.toLowerCase();
  for (const [key, brand] of Object.entries(CAMERA_BRANDS)) {
    if (makeLower.includes(key)) {
      return brand;
    }
  }
  return 'Other';
}

// Parse EXIF directory
function parseExifDirectory(buffer: ArrayBuffer, offset: number, littleEndian: boolean): Record<number, string | number | Uint8Array> {
  const tags: Record<number, string | number | Uint8Array> = {};
  
  try {
    const numEntries = read16(buffer, offset, littleEndian);
    let entryOffset = offset + 2;
    
    for (let i = 0; i < numEntries; i++) {
      const tag = read16(buffer, entryOffset, littleEndian);
      const type = read16(buffer, entryOffset + 2, littleEndian);
      const count = read32(buffer, entryOffset + 4, littleEndian);
      const valueOffset = read32(buffer, entryOffset + 8, littleEndian);
      
      let value: any;
      
      switch (type) {
        case 1: // BYTE
        case 7: // UNDEFINED
          if (count <= 4) {
            value = readBytes(buffer, entryOffset + 8, count);
          } else {
            value = readBytes(buffer, valueOffset, count);
          }
          break;
          
        case 2: // ASCII
          if (count <= 4) {
            value = readString(buffer, entryOffset + 8, count);
          } else {
            value = readString(buffer, valueOffset, count);
          }
          break;
          
        case 3: // SHORT
          if (count === 1) {
            value = read16(buffer, entryOffset + 8, littleEndian);
          }
          break;
          
        case 4: // LONG
          if (count === 1) {
            value = valueOffset;
          }
          break;
          
        case 5: // RATIONAL
          if (count === 1) {
            value = readRational(buffer, valueOffset, littleEndian);
          }
          break;
          
        case 10: // SRATIONAL
          if (count === 1) {
            const numerator = new DataView(buffer).getInt32(valueOffset, littleEndian);
            const denominator = new DataView(buffer).getInt32(valueOffset + 4, littleEndian);
            value = denominator !== 0 ? numerator / denominator : 0;
          }
          break;
          
        default:
          // Skip unknown types
          break;
      }
      
      if (value !== undefined) {
        tags[tag] = value;
      }
      
      entryOffset += 12;
    }
  } catch (error) {
    console.warn('Error parsing EXIF directory:', error);
  }
  
  return tags;
}

// Main EXIF extraction function
export async function extractExifData(file: File): Promise<ExifData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const view = new DataView(buffer);
        
        // Check for JPEG SOI marker
        if (view.getUint16(0) !== 0xFFD8) {
          throw new Error('Not a valid JPEG file');
        }
        
        let offset = 2;
        const exifData: ExifData = {
          camera: { make: 'Unknown', model: 'Unknown' },
          settings: { aperture: 'f/0', shutterSpeed: '1/0s', iso: 0, focalLength: '0mm' },
          datetime: new Date().toISOString()
        };
        
        // Look for EXIF marker
        while (offset < buffer.byteLength - 1) {
          const marker = view.getUint16(offset);
          
          if (marker === 0xFFE1) { // APP1 marker (EXIF)
            const exifHeader = readString(buffer, offset + 4, 4);
            
            if (exifHeader === 'Exif') {
              const tiffOffset = offset + 10;
              
              // Check TIFF header
              const byteOrder = view.getUint16(tiffOffset);
              const littleEndian = byteOrder === 0x4949;
              
              if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) {
                throw new Error('Invalid TIFF header');
              }
              
              const magic = read16(buffer, tiffOffset + 2, littleEndian);
              if (magic !== 42) {
                throw new Error('Invalid TIFF magic number');
              }
              
              const ifd0Offset = read32(buffer, tiffOffset + 4, littleEndian);
              const tags = parseExifDirectory(buffer, tiffOffset + ifd0Offset, littleEndian);
              
              // Extract camera info
              if (tags[EXIF_TAGS.MAKE] && typeof tags[EXIF_TAGS.MAKE] === 'string') {
                exifData.camera.make = tags[EXIF_TAGS.MAKE] as string;
              }
              if (tags[EXIF_TAGS.MODEL] && typeof tags[EXIF_TAGS.MODEL] === 'string') {
                exifData.camera.model = tags[EXIF_TAGS.MODEL] as string;
              }
              
              // Extract settings
              if (tags[EXIF_TAGS.APERTURE] && typeof tags[EXIF_TAGS.APERTURE] === 'number') {
                exifData.settings.aperture = formatAperture(tags[EXIF_TAGS.APERTURE] as number);
              }
              if (tags[EXIF_TAGS.SHUTTER_SPEED] && typeof tags[EXIF_TAGS.SHUTTER_SPEED] === 'number') {
                exifData.settings.shutterSpeed = formatShutterSpeed(tags[EXIF_TAGS.SHUTTER_SPEED] as number);
              }
              if (tags[EXIF_TAGS.ISO] && typeof tags[EXIF_TAGS.ISO] === 'number') {
                exifData.settings.iso = tags[EXIF_TAGS.ISO] as number;
              }
              if (tags[EXIF_TAGS.FOCAL_LENGTH] && typeof tags[EXIF_TAGS.FOCAL_LENGTH] === 'number') {
                exifData.settings.focalLength = formatFocalLength(tags[EXIF_TAGS.FOCAL_LENGTH] as number);
              }
              
              // Extract datetime
              if (tags[EXIF_TAGS.DATETIME_ORIGINAL] || tags[EXIF_TAGS.DATETIME]) {
                const dateStr = tags[EXIF_TAGS.DATETIME_ORIGINAL] || tags[EXIF_TAGS.DATETIME];
                if (typeof dateStr === 'string') {
                    try {
                      // EXIF datetime format: "YYYY:MM:DD HH:MM:SS"
                      const formattedDate = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                      exifData.datetime = new Date(formattedDate).toISOString();
                    } catch {
                      exifData.datetime = new Date().toISOString();
                    }
                  }
              }
              
              break;
            }
          }
          
          // Move to next marker
          if (marker >= 0xFF00) {
            const segmentLength = view.getUint16(offset + 2);
            offset += 2 + segmentLength;
          } else {
            offset++;
          }
        }
        
        resolve(exifData);
      } catch (error) {
        console.warn('EXIF extraction failed:', error);
        // Return default data on error
        resolve({
          camera: { make: 'Unknown', model: 'Unknown' },
          settings: { aperture: 'f/0', shutterSpeed: '1/0s', iso: 0, focalLength: '0mm' },
          datetime: new Date().toISOString()
        });
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read only the first 64KB for EXIF data (usually sufficient)
    const blob = file.slice(0, 65536);
    reader.readAsArrayBuffer(blob);
  });
}

// Get camera brand from EXIF data
export function getCameraBrand(exifData: ExifData): CameraBrand {
  return detectCameraBrand(exifData.camera.make);
}

// Format camera display name
export function formatCameraName(exifData: ExifData): string {
  const { make, model } = exifData.camera;
  if (make === 'Unknown' && model === 'Unknown') {
    return 'Unknown Camera';
  }
  if (make === 'Unknown') {
    return model;
  }
  if (model === 'Unknown') {
    return make;
  }
  // Remove redundant make from model if it's already included
  const modelLower = model.toLowerCase();
  const makeLower = make.toLowerCase();
  if (modelLower.includes(makeLower)) {
    return model;
  }
  return `${make} ${model}`;
}