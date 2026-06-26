import {
  Badge,
  Button,
  Card,
  createTheme,
  Paper,
  type MantineColorsTuple,
} from '@mantine/core';

// ---------------------------------------------------------------------------
// IBM Carbon Design System palette. Named ramps map to Carbon hues for a
// Carbon-consistent UI; neutrals carry the layout. The categorical rotation
// (accentColors) is the Carbon data-vis set: purple-70, cyan-50, teal-70,
// magenta-70, red-50, purple-50.
// ---------------------------------------------------------------------------

// Carbon Cyan — primary (cyan-50 #1192e8 at shade 5)
const brand: MantineColorsTuple = [
  '#e5f6ff', '#bae6ff', '#82cfff', '#56bdff', '#33b1ff',
  '#1192e8', '#0f80cc', '#0072c3', '#00539a', '#003a6d',
];
// Carbon Purple (light, purple-50)
const sky: MantineColorsTuple = [
  '#f6f2ff', '#ece1ff', '#dcc8ff', '#c9a8ff', '#b88cff',
  '#a56eff', '#9351ec', '#7d3bd0', '#6929c4', '#4e1f96',
];
// Carbon Teal (teal-70)
const mint: MantineColorsTuple = [
  '#d9fbfb', '#9ef0f0', '#3ddbd9', '#08bdba', '#009d9a',
  '#007d79', '#005d5d', '#004144', '#022b30', '#081a1c',
];
// Amber — Warm Yellow #FFF4CC (1) -> Warning #F59E0B (5)
const yellow: MantineColorsTuple = [
  '#fffbeb', '#FFF4CC', '#fde58a', '#fcd34d', '#f9bd24',
  '#F59E0B', '#d9870a', '#b66f06', '#925905', '#784a08',
];
// Carbon Purple (purple-70)
const lavender: MantineColorsTuple = [
  '#f6f2ff', '#e8daff', '#d4bbff', '#be95ff', '#a56eff',
  '#8a3ffc', '#6929c4', '#491d8b', '#31135e', '#1c0f30',
];
// Carbon Red (red-50 / danger)
const peach: MantineColorsTuple = [
  '#fff1f1', '#ffd7d9', '#ffb3b8', '#ff8389', '#fa6872',
  '#fa4d56', '#da1e28', '#a2191f', '#750e13', '#520408',
];
// Carbon Magenta (magenta-70)
const rose: MantineColorsTuple = [
  '#fff0f7', '#ffd6e8', '#ffafd2', '#ff7eb6', '#ee5396',
  '#d02670', '#9f1853', '#740937', '#510224', '#2a0a18',
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

export type AccentColor =
  | 'brand'
  | 'sky'
  | 'mint'
  | 'peach'
  | 'rose'
  | 'lavender'
  | 'yellow'
  | 'sand';
// Carbon data-vis categorical rotation: purple-70, cyan-50, teal-70, magenta-70,
// red-50, purple-50 (mapped to the named ramps above).
export const accentColors: AccentColor[] = ['lavender', 'brand', 'mint', 'rose', 'peach', 'sky'];

export const semantic = {
  success: 'mint',
  warning: 'yellow',
  danger: 'peach',
  info: 'brand',
} as const;
