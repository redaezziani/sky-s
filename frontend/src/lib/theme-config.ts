export type ThemeColor = 'default' | 'blue' | 'green' | 'purple' | 'rose';
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  name: string;
  color: ThemeColor;
  mode: ThemeMode;
}

export const themeColors: Record<ThemeColor, { name: string; primary: string }> = {
  default: {
    name: 'Orange',
    primary: 'oklch(64.263% 0.23663 32.347)',
  },
  blue: {
    name: 'Blue',
    primary: 'oklch(0.588 0.243 264.376)',
  },
  green: {
    name: 'Green',
    primary: 'oklch(0.65 0.2 150)',
  },
  purple: {
    name: 'Purple',
    primary: 'oklch(0.6 0.25 300)',
  },
  rose: {
    name: 'Rose',
    primary: 'oklch(0.63 0.24 5)',
  },
};

export const defaultTheme: Theme = {
  name: 'default-light',
  color: 'default',
  mode: 'light',
};
