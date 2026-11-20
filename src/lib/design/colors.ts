/**
 * Culinary Tool Fab color system (Dish Graph canvas language).
 * Prefer CSS vars in styles: `var(--ctf-bg)`. Values here are the source of truth for agents/docs.
 */

export const colorRoles = [
  'bg',
  'surface',
  'surface-2',
  'border',
  'border-strong',
  'text',
  'secondary',
  'faint',
  'accent',
  'accent-soft',
  'warm',
  'warm-soft',
  'edge'
] as const;

export type ColorRole = (typeof colorRoles)[number];

/** CSS custom property name for a role, e.g. `bg` → `--ctf-bg`. */
export function colorVar(role: ColorRole): string {
  return `--ctf-${role}`;
}

export const colorsLight = {
  bg: '#ffffff',
  surface: '#fafafa',
  'surface-2': '#f2f2f2',
  border: '#eaeaea',
  'border-strong': '#c9c9c9',
  text: '#171717',
  secondary: '#4d4d4d',
  faint: '#8f8f8f',
  accent: '#006bff',
  'accent-soft': '#e9f2ff',
  warm: '#b45309',
  'warm-soft': '#fdf3e7',
  edge: '#c9c9c9'
} as const satisfies Record<ColorRole, string>;

export const colorsDark = {
  bg: '#0a0a0a',
  surface: '#111111',
  'surface-2': '#1a1a1a',
  border: '#2e2e2e',
  'border-strong': '#454545',
  text: '#ededed',
  secondary: '#a0a0a0',
  faint: '#8f8f8f',
  accent: '#47a8ff',
  'accent-soft': '#0f2340',
  warm: '#f0a35a',
  'warm-soft': '#2a1d10',
  edge: '#454545'
} as const satisfies Record<ColorRole, string>;

export const colorUsage: Record<ColorRole, string> = {
  bg: 'Page and canvas background',
  surface: 'Panels, walk strip',
  'surface-2': 'Media placeholders',
  border: 'Hairlines, dot-grid color',
  'border-strong': 'Node and control outlines',
  text: 'Primary text / current step',
  secondary: 'Body copy, node body',
  faint: 'Kind labels, hints, idle steps',
  accent: 'Selection, handles, focus ring',
  'accent-soft': 'Selection halo',
  warm: 'Warm emphasis (taste / warning)',
  'warm-soft': 'Warm soft fill',
  edge: 'Graph edge strokes'
};

/** Alias map kept for older `--bg` style hooks inside the flow theme. */
export const legacyColorAliases: Record<string, ColorRole> = {
  '--bg': 'bg',
  '--surface': 'surface',
  '--surface-2': 'surface-2',
  '--border': 'border',
  '--border-strong': 'border-strong',
  '--text': 'text',
  '--secondary': 'secondary',
  '--faint': 'faint',
  '--accent': 'accent',
  '--accent-soft': 'accent-soft',
  '--warm': 'warm',
  '--warm-soft': 'warm-soft',
  '--edge': 'edge'
};
