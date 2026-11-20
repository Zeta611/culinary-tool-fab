/**
 * Culinary Tool Fab font system (Geist, matching Dish Graph).
 */

export const fontSans = {
  id: 'geist-sans',
  family: 'Geist',
  cssVar: '--ctf-font',
  stack: "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  stylesheet: 'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.min.css'
} as const;

export const fontMono = {
  id: 'geist-mono',
  family: 'Geist Mono',
  cssVar: '--ctf-font-mono',
  stack: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  stylesheet: 'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.min.css'
} as const;

export const fontScale = {
  body: { size: '14px', lineHeight: '20px', weight: 400, use: 'App body' },
  kind: {
    size: '10px',
    lineHeight: '14px',
    weight: 400,
    letterSpacing: '0.06em',
    transform: 'uppercase' as const,
    use: 'Node kind labels'
  },
  nodeBody: { size: '12px', lineHeight: '16px', weight: 400, use: 'Node body copy' },
  file: { size: '11px', lineHeight: '16px', weight: 400, use: 'File input chrome' },
  walk: { size: '12px', lineHeight: '16px', weight: 400, use: 'Walk strip pills' },
  walkCurrent: {
    size: '12px',
    lineHeight: '16px',
    weight: 500,
    use: 'Current walk step'
  },
  edgeLabel: { size: '11px', lineHeight: '14px', weight: 400, use: 'Edge labels' }
} as const;

export const fontStylesheets = [fontSans.stylesheet, fontMono.stylesheet] as const;
