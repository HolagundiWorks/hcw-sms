import {
  Badge,
  Button,
  Card,
  createTheme,
  Paper,
  type MantineColorsTuple,
} from '@mantine/core';

// ---------------------------------------------------------------------------
// HCW-SMS "School OS" palette (refreshed per the School OS UI Design Guide).
// Calm academic colors; neutrals carry the UI, pastels are soft, action colors
// only when status matters. Each ramp: pastel accent at shade 1, action color
// at shade 5.
// ---------------------------------------------------------------------------

// Blue — primary. Sky #DCEEFF (1) -> Info #3B82F6 (5)
const brand: MantineColorsTuple = [
  '#f0f7ff', '#DCEEFF', '#b9dcff', '#8fc3fb', '#63a6f5',
  '#3B82F6', '#2f6fe0', '#2563c4', '#1f54a6', '#1a4488',
];
const sky: MantineColorsTuple = [
  '#eef8ff', '#DCEEFF', '#bfe1ff', '#93c9fb', '#63a6f5',
  '#3b82f6', '#2f6fe0', '#2563c4', '#1f54a6', '#1a4488',
];
// Green — Mint #E6F8EC (1) -> Success #22C55E (5)
const mint: MantineColorsTuple = [
  '#f0fdf4', '#E6F8EC', '#bdeccd', '#86dca5', '#4cce7d',
  '#22C55E', '#1ba84e', '#158540', '#116a34', '#0d5429',
];
// Amber — Warm Yellow #FFF4CC (1) -> Warning #F59E0B (5)
const yellow: MantineColorsTuple = [
  '#fffbeb', '#FFF4CC', '#fde58a', '#fcd34d', '#f9bd24',
  '#F59E0B', '#d9870a', '#b66f06', '#925905', '#784a08',
];
// Violet — Lavender #EEE6FF (1)
const lavender: MantineColorsTuple = [
  '#f6f2ff', '#EEE6FF', '#dac9fb', '#bfa3f6', '#a378ef',
  '#8b5cf6', '#7c45e8', '#6a36cc', '#592ba8', '#492388',
];
// Warm red — Soft Coral #FFE3E3 (1) -> Danger #EF4444 (5)
const peach: MantineColorsTuple = [
  '#fff1f1', '#FFE3E3', '#fcbcbc', '#f78f8f', '#f26464',
  '#EF4444', '#dc3535', '#c02a2a', '#9f2121', '#7f1a1a',
];
// Pink/red — destructive accents (sign out, delete)
const rose: MantineColorsTuple = [
  '#fff1f4', '#ffd6df', '#fbabbd', '#f67f9a', '#ef5a7c',
  '#e23e64', '#d12d54', '#b02246', '#8f1b39', '#6f142c',
];
// Sand — warm neutral accent
const sand: MantineColorsTuple = [
  '#fbf6ef', '#F5E6D3', '#e9cfae', '#dcb588', '#cf9c64',
  '#c1854a', '#a66e3b', '#85572f', '#664324', '#4a301a',
];
// Neutrals — bg #FAFBFC, muted #F3F4F6, border #E5E7EB, secondary #64748B, primary #1F2937
const gray: MantineColorsTuple = [
  '#FAFBFC', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#94A3B8',
  '#64748B', '#475569', '#334155', '#1F2937', '#111827',
];

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 5, dark: 7 },
  white: '#FFFFFF',
  black: '#1F2937',
  defaultRadius: 'md',
  colors: { brand, sky, mint, peach, rose, lavender, yellow, sand, gray },
  fontFamily:
    'Inter, "IBM Plex Sans", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily:
      'Inter, "IBM Plex Sans", "Segoe UI", Roboto, system-ui, -apple-system, sans-serif',
    fontWeight: '600',
  },
  components: {
    Card: Card.extend({
      defaultProps: { radius: 'md', withBorder: true, shadow: 'none', padding: 'md' },
    }),
    Paper: Paper.extend({ defaultProps: { radius: 'md' } }),
    Button: Button.extend({ defaultProps: { radius: 'md' } }),
    Badge: Badge.extend({ defaultProps: { radius: 'sm', variant: 'light' } }),
  },
});

export const accentColors = ['brand', 'sky', 'mint', 'peach', 'lavender', 'yellow', 'sand', 'rose'] as const;
export type AccentColor = (typeof accentColors)[number];

export const semantic = {
  success: 'mint',
  warning: 'yellow',
  danger: 'peach',
  info: 'brand',
} as const;
