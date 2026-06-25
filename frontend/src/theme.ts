import {
  Badge,
  Button,
  Card,
  createTheme,
  Paper,
  type MantineColorsTuple,
} from '@mantine/core';

// ---------------------------------------------------------------------------
// HCW-SMS design system
// Light theme · soft pastel accents · rounded cards · simple icons.
// Each Mantine color needs 10 shades (0 = lightest, 9 = darkest). These ramps
// are intentionally low-saturation so filled components read as "soft pastel"
// rather than vivid.
// ---------------------------------------------------------------------------

// Primary — soft periwinkle / indigo.
const brand: MantineColorsTuple = [
  '#eef1ff',
  '#dee3fb',
  '#bcc4f0',
  '#98a4e7',
  '#7a89e0',
  '#6877dc',
  '#5e6edb',
  '#4d5cc3',
  '#4351af',
  '#36459b',
];

// Calm accents for categories, status and event coloring.
const mint: MantineColorsTuple = [
  '#e7fbf2',
  '#d3f3e6',
  '#a8e6cd',
  '#7ad9b2',
  '#56ce9c',
  '#41c78e',
  '#33c486',
  '#23ac73',
  '#159965',
  '#008453',
];

const peach: MantineColorsTuple = [
  '#fff1e8',
  '#ffe2d2',
  '#ffc3a4',
  '#ffa271',
  '#fe8746',
  '#fe7629',
  '#ff6d18',
  '#e45b0a',
  '#cc5004',
  '#b24400',
];

const lavender: MantineColorsTuple = [
  '#f7eefe',
  '#e9daf6',
  '#cfb2ea',
  '#b487df',
  '#9d63d6',
  '#904dd1',
  '#8a42cf',
  '#7634b8',
  '#682ca5',
  '#5a2391',
];

const sky: MantineColorsTuple = [
  '#e5f7ff',
  '#d2ecfb',
  '#a6d7f5',
  '#76c1f0',
  '#52aeec',
  '#3ca3ea',
  '#2c9ce9',
  '#1888cf',
  '#0079ba',
  '#0069a4',
];

const rose: MantineColorsTuple = [
  '#ffeef3',
  '#fbdce3',
  '#f3b6c5',
  '#ec8da5',
  '#e66b8a',
  '#e25579',
  '#e14970',
  '#c83a60',
  '#b33155',
  '#9e2749',
];

export const theme = createTheme({
  primaryColor: 'brand',
  // Slightly lighter primary shade keeps filled buttons in the pastel range.
  primaryShade: { light: 5, dark: 7 },
  defaultRadius: 'lg',
  colors: { brand, mint, peach, lavender, sky, rose },
  fontFamily:
    'Inter, "Segoe UI", Roboto, system-ui, -apple-system, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'Inter, "Segoe UI", Roboto, system-ui, -apple-system, Helvetica, Arial, sans-serif',
    fontWeight: '650',
  },
  defaultGradient: { from: 'brand', to: 'lavender', deg: 135 },
  components: {
    Card: Card.extend({
      defaultProps: { radius: 'lg', withBorder: true, shadow: 'sm', padding: 'lg' },
    }),
    Paper: Paper.extend({
      defaultProps: { radius: 'lg' },
    }),
    Button: Button.extend({
      defaultProps: { radius: 'md' },
    }),
    Badge: Badge.extend({
      defaultProps: { radius: 'sm', variant: 'light' },
    }),
  },
});

// Accent palette names available for category / subject coloring.
export const accentColors = ['brand', 'mint', 'peach', 'lavender', 'sky', 'rose'] as const;
export type AccentColor = (typeof accentColors)[number];
