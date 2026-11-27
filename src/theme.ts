import { useColorScheme } from 'react-native';

import type { WarrantyStatus } from './lib/warranty';

export const light = {
  background: '#F7F6F2',
  surface: '#FFFFFF',
  text: '#1C1C1A',
  muted: '#5F5E58',
  border: '#DEDCD3',
  accent: '#1F6F4A',
  onAccent: '#FFFFFF',
  danger: '#B3261E',
  status: {
    active: { fg: '#1F6F4A', bg: '#E3F1E8' },
    soon: { fg: '#8A4B00', bg: '#FBEBCF' },
    expired: { fg: '#B3261E', bg: '#FBE4E2' },
  } as Record<WarrantyStatus, { fg: string; bg: string }>,
};

export const dark: typeof light = {
  background: '#121211',
  surface: '#1E1E1C',
  text: '#EDECE6',
  muted: '#A6A49C',
  border: '#36352F',
  accent: '#6BC596',
  onAccent: '#0D2A1B',
  danger: '#F2948C',
  status: {
    active: { fg: '#8FD8B0', bg: '#18301F' },
    soon: { fg: '#F0B45A', bg: '#3A2C12' },
    expired: { fg: '#F2948C', bg: '#3D1B18' },
  },
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
