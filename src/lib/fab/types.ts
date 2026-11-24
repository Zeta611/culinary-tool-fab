export type FabMode = 'full' | '2.5d';

/** Geometry runs per agent: the parts agent, and each part's tool agent. */
export const MAX_RUNS = { parts: 8, tools: 4 } as const;
export type FabStage = 'parts' | 'tools';

export interface MeshData {
  positions: Float32Array;
  indices: Uint32Array;
}

export interface Instance {
  x: number;
  y: number;
  z: number;
  /** tilt about x in degrees, applied first; 90 stands a flat piece upright facing the viewer */
  rotX: number;
  /** rotation about z in degrees, applied after rotX */
  rotZ: number;
}

export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface PartResult {
  id: string;
  name: string;
  material: string;
  color: string;
  envelope: boolean;
  /** 'layers' = stacked 2D extrusions (cutter/stencil friendly), 'solid' = free-form 3D */
  kind: 'layers' | 'solid';
  easy: boolean;
  notes: string;
  layers: { z0: number; height: number; area: number }[];
  instances: Instance[];
  mesh: MeshData;
  stats: {
    size: [number, number, number];
    bounds: Bounds;
    volume: number;
    status: string;
    genus: number;
    /** share of volume that would be trapped pulling the part up out of an open-face mould */
    undercut: number;
  };
  warnings: string[];
}

export interface PartsRun {
  ok: boolean;
  error?: string;
  logs: string[];
  parts: PartResult[];
  issues: string[];
}

export type ToolKind = 'cutter' | 'stencil' | 'open_mold' | 'silicone_box';

export interface ToolSpec {
  id: string;
  kind: ToolKind;
  partId: string;
  /** layer index for layered parts (cutter / stencil source) */
  layer?: number;
  /** stencil pattern source */
  source?: 'outline' | 'top' | 'polygons';
  /** custom stencil pattern in part-local mm, outer contours counter-clockwise */
  polygons?: [number, number][][];
  /** open_mold: which face of the part sits at the mould opening */
  opening?: 'base' | 'top';
  params?: Record<string, number>;
  purpose?: string;
}

export interface ToolResult {
  id: string;
  kind: ToolKind;
  partId: string;
  name: string;
  purpose: string;
  mesh: MeshData;
  stats: { size: [number, number, number]; volume: number; status: string };
  warnings: string[];
  /** 2D outline of the cut / pattern, for reference */
  svg?: string;
}

export interface ToolsRun {
  ok: boolean;
  error?: string;
  tools: ToolResult[];
  issues: string[];
}

export interface RenderImage {
  label: string;
  url: string;
}
