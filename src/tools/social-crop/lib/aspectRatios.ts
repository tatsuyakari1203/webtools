export interface AspectRatioOption {
  value: string;
  label: string;
  ratio: number | undefined;
  preview: string;
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    value: '2',
    label: '1:2 (2 squares)',
    ratio: 2,
    preview: '/static/svg/2_1.svg'
  },
  {
    value: '3',
    label: '1:3 (3 squares)',
    ratio: 3,
    preview: '/static/svg/3_1.svg'
  },
  {
    value: 'special2',
    label: 'Special (3 pics)',
    ratio: 1, // Square for special2
    preview: '/static/svg/square.svg'
  },
  {
    value: 'special',
    label: 'Special (5 pics)',
    ratio: 6/5,
    preview: '/static/svg/6_5.svg'
  }
];

export function getAspectRatioByValue(value: string): number | undefined {
  const option = ASPECT_RATIOS.find(ratio => ratio.value === value);
  return option?.ratio;
}

export function isSpecialCropMode(value: string): boolean {
  return value === 'special' || value === 'special2';
}

export function getPreviewImage(value: string): string {
  const option = ASPECT_RATIOS.find(ratio => ratio.value === value);
  return option?.preview || '/static/svg/square.svg';
}