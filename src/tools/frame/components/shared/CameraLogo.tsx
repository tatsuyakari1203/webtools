import React from 'react';
import type { CameraBrand } from '../../types';

interface CameraLogoProps {
  brand: CameraBrand;
  size?: number;
  color?: string;
}

export const CameraLogo: React.FC<CameraLogoProps> = ({ 
  brand, 
  size = 24, 
  color = 'currentColor' 
}) => {
  const logoSvgs: Record<CameraBrand, React.JSX.Element> = {
    Canon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
        <circle cx="12" cy="12" r="1"/>
      </svg>
    ),
    Nikon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="8" width="20" height="8" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="9" width="2" height="1"/>
      </svg>
    ),
    Sony: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M3 7v10h18V7H3zm16 8H5V9h14v6z"/>
        <circle cx="12" cy="12" r="2" fill="none" stroke={color} strokeWidth="1"/>
        <circle cx="12" cy="12" r="0.5"/>
        <rect x="16" y="9" width="2" height="1"/>
      </svg>
    ),
    Fujifilm: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="2"/>
        <rect x="17" y="8" width="2" height="2"/>
      </svg>
    ),
    Olympus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="3" y="7" width="18" height="10" rx="1"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="16" y="8" width="2" height="1"/>
      </svg>
    ),
    Panasonic: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
      </svg>
    ),
    Leica: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="3" y="8" width="18" height="8" rx="1"/>
        <circle cx="12" cy="12" r="2.5" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <circle cx="17" cy="10" r="0.5"/>
      </svg>
    ),
    Pentax: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="16" y="8" width="3" height="1"/>
      </svg>
    ),
    Hasselblad: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="2"/>
        <rect x="16" y="6" width="2" height="2"/>
      </svg>
    ),
    PhaseOne: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="3" y="6" width="18" height="12" rx="2"/>
        <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="2"/>
        <rect x="17" y="7" width="2" height="2"/>
      </svg>
    ),
    Apple: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
    Samsung: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
        <text x="6" y="11" fontSize="4" fill="white">S</text>
      </svg>
    ),
    Google: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
        <text x="5" y="11" fontSize="3" fill="white">G</text>
      </svg>
    ),
    Huawei: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
        <text x="5" y="11" fontSize="3" fill="white">H</text>
      </svg>
    ),
    Xiaomi: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
        <text x="5" y="11" fontSize="3" fill="white">Mi</text>
      </svg>
    ),
    OnePlus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
        <text x="5" y="11" fontSize="3" fill="white">1+</text>
      </svg>
    ),
    Other: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="2" y="7" width="20" height="10" rx="2"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="12" cy="12" r="1"/>
        <rect x="17" y="8" width="2" height="1"/>
      </svg>
    ),
  };

  return logoSvgs[brand] || logoSvgs.Canon;
};

// Function to get logo as canvas-drawable image data
export const getCameraLogoDataUrl = (brand: CameraBrand, size: number = 24, color: string = '#ffffff'): string => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      ${getLogoPath(brand, color)}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const getLogoPath = (brand: CameraBrand, color: string): string => {
  const logos: Record<CameraBrand, string> = {
    Canon: `
      <path fill="${color}" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <path fill="${color}" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
      <circle fill="${color}" cx="12" cy="12" r="1"/>
    `,
    Nikon: `
      <rect fill="${color}" x="2" y="8" width="20" height="8" rx="2"/>
      <circle fill="none" stroke="${color}" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="${color}" cx="12" cy="12" r="1"/>
      <rect fill="${color}" x="17" y="9" width="2" height="1"/>
    `,
    Sony: `
      <path fill="${color}" d="M3 7v10h18V7H3zm16 8H5V9h14v6z"/>
      <circle fill="none" stroke="${color}" stroke-width="1" cx="12" cy="12" r="2"/>
      <circle fill="${color}" cx="12" cy="12" r="0.5"/>
      <rect fill="${color}" x="16" y="9" width="2" height="1"/>
    `,
    Fujifilm: `
      <rect fill="${color}" x="2" y="6" width="20" height="12" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="4"/>
      <circle fill="white" cx="12" cy="12" r="2"/>
      <rect fill="white" x="17" y="8" width="2" height="2"/>
    `,
    Olympus: `
      <rect fill="${color}" x="3" y="7" width="18" height="10" rx="1"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="16" y="8" width="2" height="1"/>
    `,
    Panasonic: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
    `,
    Leica: `
      <rect fill="${color}" x="3" y="8" width="18" height="8" rx="1"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="2.5"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <circle fill="white" cx="17" cy="10" r="0.5"/>
    `,
    Pentax: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="16" y="8" width="3" height="1"/>
    `,
    Hasselblad: `
      <rect fill="${color}" x="4" y="4" width="16" height="16" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="4"/>
      <circle fill="white" cx="12" cy="12" r="2"/>
      <rect fill="white" x="16" y="6" width="2" height="2"/>
    `,
    PhaseOne: `
      <rect fill="${color}" x="3" y="6" width="18" height="12" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="4"/>
      <circle fill="white" cx="12" cy="12" r="2"/>
      <rect fill="white" x="17" y="7" width="2" height="2"/>
    `,
    Apple: `
      <path fill="${color}" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    `,
    Samsung: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
      <text x="6" y="11" font-size="4" fill="white">S</text>
    `,
    Google: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
      <text x="5" y="11" font-size="3" fill="white">G</text>
    `,
    Huawei: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
      <text x="5" y="11" font-size="3" fill="white">H</text>
    `,
    Xiaomi: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
      <text x="5" y="11" font-size="3" fill="white">Mi</text>
    `,
    OnePlus: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
      <text x="5" y="11" font-size="3" fill="white">1+</text>
    `,
    Other: `
      <rect fill="${color}" x="2" y="7" width="20" height="10" rx="2"/>
      <circle fill="none" stroke="white" stroke-width="1" cx="12" cy="12" r="3"/>
      <circle fill="white" cx="12" cy="12" r="1"/>
      <rect fill="white" x="17" y="8" width="2" height="1"/>
    `,
  };

  return logos[brand] || logos.Canon;
};