/**
 * Geometry kernel on top of Manifold (WASM). Pure functions of the WASM module,
 * so it runs both in the browser worker and in Node for tests.
 *
 * Frame: millimetres, +z up, origin at the centre of the scene floor (the
 * envelope's bottom face), front of the scene faces -y.
 */
import type {
  CrossSection as CrossSectionT,
  Manifold as ManifoldT,
  ManifoldToplevel,
  Vec3
} from 'manifold-3d';

import type {
  Bounds,
  FabMode,
  Instance,
  MeshData,
  PartResult,
  PartsRun,
  ToolResult,
  ToolSpec,
  ToolsRun
} from './types.ts';

type Wasm = ManifoldToplevel;
type Pt = [number, number];

const SEG = 64;
const DEFAULT_MARGIN = 4;
const PRINT_BED: [number, number, number] = [220, 220, 250];

interface PartDef {
  id: string;
  name: string;
  material: string;
  color: string;
  envelope: boolean;
  easy: boolean;
  notes: string;
  geom: ManifoldT;
  kind: 'layers' | 'solid';
  layers: { profile: CrossSectionT; z0: number; height: number }[];
  instances: Instance[];
}

interface LayerSpec {
  profile: CrossSectionT;
  height: number;
}

export interface PartSpecInput {
  id: string;
  name?: string;
  material?: string;
  color?: string;
  envelope?: boolean;
  easy?: boolean;
  notes?: string;
  geom?: ManifoldT;
  layers?: LayerSpec[];
  instances?: Partial<Instance>[];
}

// ------------------------------------------------------------------ helpers
function chaikin(points: Pt[], iterations = 3): Pt[] {
  let p = points.map(([x, y]) => [x, y] as Pt);
  for (let k = 0; k < iterations; k++) {
    const next: Pt[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      next.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      next.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    p = next;
  }
  return p;
}

function boundsOf(m: ManifoldT): Bounds {
  const b = m.boundingBox();
  return { min: [...b.min] as Bounds['min'], max: [...b.max] as Bounds['max'] };
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function meshOf(m: ManifoldT): MeshData {
  const mesh = m.getMesh();
  const n = mesh.numProp;
  const count = mesh.vertProperties.length / n;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = mesh.vertProperties[i * n];
    positions[i * 3 + 1] = mesh.vertProperties[i * n + 1];
    positions[i * 3 + 2] = mesh.vertProperties[i * n + 2];
  }
  return { positions, indices: new Uint32Array(mesh.triVerts) };
}

function svgOf(cs: CrossSectionT): string {
  const polys = cs.toPolygons();
  if (!polys.length) return '';
  const b = cs.bounds();
  const pad = 2;
  const w = b.max[0] - b.min[0] + 2 * pad;
  const h = b.max[1] - b.min[1] + 2 * pad;
  const d = polys
    .map(
      (p) =>
        'M ' +
        p
          .map(([x, y]) => `${(x - b.min[0] + pad).toFixed(3)},${(b.max[1] - y + pad).toFixed(3)}`)
          .join(' L ') +
        ' Z'
    )
    .join(' ');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(2)}mm" height="${h.toFixed(2)}mm" ` +
    `viewBox="0 0 ${w.toFixed(3)} ${h.toFixed(3)}"><path d="${d}" fill="none" stroke="black" stroke-width="0.2"/></svg>`
  );
}

// ------------------------------------------------------------------ the K library
export function createKernel(wasm: Wasm) {
  const { Manifold, CrossSection } = wasm;
  const parts: PartDef[] = [];
  const settings = { margin: DEFAULT_MARGIN };

  const profile = (points: Pt[], smooth = 3): CrossSectionT => {
    if (!Array.isArray(points) || points.length < 3) throw new Error('profile needs >= 3 points');
    return new CrossSection([smooth > 0 ? chaikin(points, smooth) : points], 'NonZero');
  };

  const roundedRect = (w: number, h: number, r = Math.min(w, h) * 0.15): CrossSectionT => {
    const rr = Math.max(0, Math.min(r, w / 2 - 0.01, h / 2 - 0.01));
    return CrossSection.square([w - 2 * rr, h - 2 * rr], true).offset(rr, 'Round', 2, SEG);
  };

  /** Super-ellipsoid; cross-section radius (1-|z|^p)^(1/p). p=2 ellipsoid, p~3 broad dome. */
  const lobe = (center: Vec3, radii: Vec3, p = 2): ManifoldT => {
    if (center[2] > 1e-9) {
      throw new Error(`lobe centre z=${center[2]} is above the base: that creates an undercut`);
    }
    let s = Manifold.sphere(1, SEG);
    if (p !== 2) {
      s = s.warpBatch((v: Float64Array, count: number) => {
        for (let i = 0; i < count; i++) {
          const x = v[3 * i];
          const y = v[3 * i + 1];
          const z = v[3 * i + 2];
          const rho = Math.hypot(x, y);
          if (rho < 1e-9) continue;
          const target = Math.max(0, 1 - Math.abs(z) ** p) ** (1 / p);
          v[3 * i] = (x * target) / rho;
          v[3 * i + 1] = (y * target) / rho;
        }
      });
    }
    return s.scale(radii).translate(center);
  };

  const aboveBase = (body: ManifoldT): ManifoldT => body.trimByPlane([0, 0, 1], 0);

  /** Dome whose top sits `peak` above z=0, centre buried by `depth`; already trimmed at z=0. */
  const dome = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    peak: number,
    depth = peak * 0.25,
    p = 3
  ): ManifoldT => aboveBase(lobe([x, y, -depth], [rx, ry, peak + depth], p));

  /** Flat face pointing toward `azimuthDeg` (0 = +x, 90 = +y), leaning back `leanDeg`, through xy `through` at z=0. */
  const cliff = (body: ManifoldT, azimuthDeg: number, leanDeg: number, through: Pt): ManifoldT => {
    const a = (azimuthDeg * Math.PI) / 180;
    const l = (Math.max(leanDeg, 0) * Math.PI) / 180;
    const n: Vec3 = [Math.cos(a) * Math.cos(l), Math.sin(a) * Math.cos(l), Math.sin(l)];
    const d = n[0] * through[0] + n[1] * through[1];
    return body.trimByPlane([-n[0], -n[1], -n[2]], -d);
  };

  /** Revolved tiered fir: cone with drafted ledges, radius never grows with height. */
  const fir = (height: number, baseR: number, tiers?: number): ManifoldT => {
    const tipR = Math.min(1, baseR * 0.45);
    const n = tiers ?? (height >= 10 ? 4 : 3);
    const q = (tipR / baseR) ** (1 / n);
    const ledgeQ = q ** 0.4;
    const runQ = q ** 0.6;
    const band = 0.4;
    const ledgeTan = Math.tan((22 * Math.PI) / 180);
    const w = Array.from({ length: n }, (_, i) => 1.3 - (0.5 * i) / Math.max(n - 1, 1));
    const wSum = w.reduce((s, v) => s + v, 0);
    const pts: Pt[] = [
      [0, 0],
      [baseR, 0]
    ];
    let z = 0;
    let r = baseR;
    for (let i = 0; i < n; i++) {
      const ledgeR = r * ledgeQ;
      pts.push([r, z + band]);
      pts.push([ledgeR, z + band + (r - ledgeR) * ledgeTan]);
      z += (w[i] / wSum) * (height - tipR);
      r = Math.max(ledgeR * runQ, tipR);
      pts.push([r, z]);
    }
    for (let k = 1; k <= 6; k++) {
      const t = (k / 6) * (Math.PI / 2);
      pts.push([tipR * Math.cos(t), z + tipR * Math.sin(t)]);
    }
    pts.push([0, z + tipR]);
    return new CrossSection([pts.map(([x, y]) => [Math.max(x, 0), y] as Pt)], 'NonZero').revolve(
      SEG
    );
  };

  /** Merge pieces onto one shared footing so the cluster casts as one piece. */
  const cluster = (
    items: { geom: ManifoldT; x: number; y: number; r: number }[],
    opts: { pad?: number; grow?: number } = {}
  ): ManifoldT => {
    const pad = opts.pad ?? 1.2;
    const grow = opts.grow ?? 0.6;
    const footing = CrossSection.union(
      items.map((it) => CrossSection.circle(it.r + grow, SEG).translate([it.x, it.y]))
    )
      .offset(1.5, 'Round', 2, SEG)
      .offset(-1.5, 'Round', 2, SEG);
    return Manifold.union([
      footing.extrude(pad),
      ...items.map((it) => it.geom.translate([it.x, it.y, 0]))
    ]);
  };

  /** Stack of 2D extrusions, bottom first. Each layer may be cut from a rolled sheet. */
  const stack = (layers: LayerSpec[]) => {
    let z0 = 0;
    const out: PartDef['layers'] = [];
    for (const l of layers) {
      if (!(l.height > 0)) throw new Error('layer height must be > 0');
      out.push({ profile: l.profile, z0, height: l.height });
      z0 += l.height;
    }
    const geom = Manifold.union(
      out.map((l) => l.profile.extrude(l.height).translate([0, 0, l.z0]))
    );
    return { geom, layers: out };
  };

  const part = (spec: PartSpecInput) => {
    if (!spec || typeof spec.id !== 'string' || !spec.id) throw new Error('part needs an id');
    if (parts.some((p) => p.id === spec.id)) throw new Error(`duplicate part id ${spec.id}`);
    let geom: ManifoldT;
    let kind: PartDef['kind'];
    let layers: PartDef['layers'] = [];
    if (spec.layers) {
      ({ geom, layers } = stack(spec.layers));
      kind = 'layers';
    } else if (spec.geom) {
      geom = spec.geom;
      kind = 'solid';
    } else {
      throw new Error(`part ${spec.id} needs geom or layers`);
    }
    const instances = (spec.instances?.length ? spec.instances : [{}]).map((i) => ({
      x: i.x ?? 0,
      y: i.y ?? 0,
      z: i.z ?? 0,
      rotX: i.rotX ?? 0,
      rotZ: i.rotZ ?? 0
    }));
    parts.push({
      id: spec.id,
      name: spec.name ?? spec.id,
      material: spec.material ?? '',
      color: spec.color ?? '#cccccc',
      envelope: !!spec.envelope,
      easy: !!spec.easy,
      notes: spec.notes ?? '',
      geom,
      kind,
      layers,
      instances
    });
    return geom;
  };

  const K = {
    chaikin,
    profile,
    roundedRect,
    circle: (r: number) => CrossSection.circle(r, SEG),
    lobe,
    dome,
    cliff,
    aboveBase,
    fir,
    cluster,
    extrude: (cs: CrossSectionT, h: number) => cs.extrude(h),
    part,
    scene: (opts: { margin?: number }) => {
      if (opts?.margin != null) settings.margin = opts.margin;
    }
  };
  return { K, parts, settings };
}

// ------------------------------------------------------------------ checks
export function undercutRatio(geom: ManifoldT, dz = 0.2): number {
  const b = geom.boundingBox();
  const vol = geom.volume();
  if (!(vol > 0)) return 0;
  const z0 = b.min[2];
  const h = b.max[2] - z0;
  const step = Math.max(dz, h / 300);
  let grown = 0;
  let prev = geom.slice(z0 + 1e-3);
  for (let z = z0 + step; z < b.max[2]; z += step) {
    const cur = geom.slice(z);
    grown += cur.subtract(prev.offset(0.02, 'Round', 2, 16)).area() * step;
    prev = cur;
  }
  return grown / vol;
}

/** Share of a profile's area lost when features thinner than `minWidth` are removed. */
function thinLoss(wasm: Wasm, cs: CrossSectionT, minWidth: number): number {
  const area = cs.area();
  if (!(area > 0)) return 0;
  const opened = cs.offset(-minWidth / 2, 'Round', 2, 32).offset(minWidth / 2, 'Round', 2, 32);
  void wasm;
  return Math.max(0, (area - opened.area()) / area);
}

function placed(geom: ManifoldT, i: Instance): ManifoldT {
  return geom.rotate([i.rotX, 0, 0]).rotate([0, 0, i.rotZ]).translate([i.x, i.y, i.z]);
}

// ------------------------------------------------------------------ run a parts script
export interface ScriptRun {
  run: PartsRun;
  defs: PartDef[];
}

export function runPartsScript(wasm: Wasm, code: string, mode: FabMode): ScriptRun {
  const logs: string[] = [];
  const log = (...a: unknown[]) =>
    logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
  const { K, parts, settings } = createKernel(wasm);
  try {
    const fn = new Function(
      'M',
      'CS',
      'K',
      'console',
      'fetch',
      'XMLHttpRequest',
      'WebSocket',
      'importScripts',
      '"use strict";\n' + code
    );
    fn(
      wasm.Manifold,
      wasm.CrossSection,
      K,
      { log, warn: log, error: log },
      undefined,
      undefined,
      undefined,
      undefined
    );
  } catch (e) {
    const err = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return { run: { ok: false, error: err, logs, parts: [], issues: [] }, defs: [] };
  }
  if (!parts.length) {
    return {
      run: {
        ok: false,
        error: 'The script defined no parts. Call K.part({...}) for each part.',
        logs,
        parts: [],
        issues: []
      },
      defs: []
    };
  }

  const results: PartResult[] = [];
  const issues: string[] = [];
  for (const p of parts) {
    const warnings: string[] = [];
    const status = p.geom.status();
    const volume = p.geom.volume();
    const bounds = boundsOf(p.geom);
    const size = [0, 1, 2].map((k) => r2(bounds.max[k] - bounds.min[k])) as [
      number,
      number,
      number
    ];
    if (status !== 'NoError') warnings.push(`geometry error: ${status}`);
    if (!(volume > 0)) warnings.push('empty geometry (zero volume)');
    if (Math.abs(bounds.min[2]) > 0.05) {
      warnings.push(
        `base is at z=${r2(bounds.min[2])}; every part must sit on z=0 locally (place it with instances.z)`
      );
    }
    const undercut = p.envelope || !(volume > 0) ? 0 : undercutRatio(p.geom);
    if (!p.envelope && undercut > 0.005) {
      warnings.push(
        `undercut ${(undercut * 100).toFixed(1)}%: cross-section grows with height somewhere, so it will not pull out of an open-face mould`
      );
    }
    if (!p.envelope) {
      const foot = p.kind === 'layers' ? p.layers[0].profile : p.geom.slice(0.05);
      const loss = thinLoss(wasm, foot, 1.5);
      if (loss > 0.03)
        warnings.push(
          `${(loss * 100).toFixed(0)}% of the footprint is thinner than 1.5 mm (fragile)`
        );
      for (const [i, l] of p.layers.entries()) {
        if (l.height < 1.5) warnings.push(`layer ${i} is only ${l.height} mm thick (min 1.5 mm)`);
      }
    }
    if (mode === '2.5d' && p.kind === 'solid' && !p.envelope && !p.easy) {
      warnings.push(
        '2.5D mode: free-form solid not allowed. Rebuild it as layers (stacked 2D profiles) or mark easy:true only if it is a trivially mouldable shape'
      );
    }
    results.push({
      id: p.id,
      name: p.name,
      material: p.material,
      color: p.color,
      envelope: p.envelope,
      kind: p.kind,
      easy: p.easy,
      notes: p.notes,
      layers: p.layers.map((l) => ({
        z0: r2(l.z0),
        height: r2(l.height),
        area: r2(l.profile.area())
      })),
      instances: p.instances,
      mesh: meshOf(p.geom),
      stats: {
        size,
        bounds,
        volume: r2(volume),
        status,
        genus: p.geom.genus(),
        undercut: Math.round(undercut * 1e4) / 1e4
      },
      warnings
    });
  }

  // assembly checks
  const envelopes = parts.filter((p) => p.envelope);
  if (envelopes.length > 1) issues.push('more than one envelope part');
  const placedAll = parts
    .filter((p) => !p.envelope)
    .flatMap((p) =>
      p.instances.map((inst, k) => ({ name: `${p.id}#${k}`, geom: placed(p.geom, inst) }))
    );
  for (let i = 0; i < placedAll.length; i++) {
    for (let j = i + 1; j < placedAll.length; j++) {
      const v = placedAll[i].geom.intersect(placedAll[j].geom).volume();
      if (v > 0.05)
        issues.push(`overlap ${placedAll[i].name} x ${placedAll[j].name}: ${r2(v)} mm3`);
    }
  }
  const env = envelopes[0];
  if (env) {
    const envGeom = placed(env.geom, env.instances[0]);
    const eb = envGeom.boundingBox();
    const m = settings.margin;
    for (const it of placedAll) {
      const out = it.geom.subtract(envGeom).volume();
      if (out > 0.05) issues.push(`${it.name} pokes out of the envelope by ${r2(out)} mm3`);
      const b = it.geom.boundingBox();
      const gaps = [
        b.min[0] - eb.min[0],
        eb.max[0] - b.max[0],
        b.min[1] - eb.min[1],
        eb.max[1] - b.max[1],
        b.min[2] - eb.min[2],
        eb.max[2] - b.max[2]
      ];
      const g = Math.min(...gaps);
      if (out <= 0.05 && g < m - 1e-6) {
        issues.push(`${it.name} is ${r2(g)} mm from an envelope face (margin ${m} mm)`);
      }
    }
  }
  return { run: { ok: true, logs, parts: results, issues }, defs: parts };
}

// ------------------------------------------------------------------ tools
export function buildTools(
  wasm: Wasm,
  defs: PartDef[],
  specs: ToolSpec[],
  mode: FabMode,
  only?: string
): ToolsRun {
  const { CrossSection } = wasm;
  const tools: ToolResult[] = [];
  const issues: string[] = [];
  const byId = new Map(defs.map((d) => [d.id, d]));
  const covered = new Set<string>();

  const rrect = (w: number, h: number, r: number) =>
    CrossSection.square([Math.max(w - 2 * r, 0.01), Math.max(h - 2 * r, 0.01)], true).offset(
      r,
      'Round',
      2,
      SEG
    );

  const sourceProfile = (d: PartDef, spec: ToolSpec): CrossSectionT => {
    if (spec.source === 'polygons') {
      if (!spec.polygons?.length) throw new Error('source "polygons" needs polygons');
      return new CrossSection(spec.polygons, 'NonZero');
    }
    if (d.kind === 'layers') {
      const i = spec.layer ?? (spec.source === 'top' ? d.layers.length - 1 : 0);
      const l = d.layers[i];
      if (!l) throw new Error(`part ${d.id} has no layer ${i}`);
      return l.profile;
    }
    return spec.source === 'top' ? d.geom.project() : d.geom.slice(0.05);
  };

  for (const spec of specs) {
    const d = byId.get(spec.partId);
    const warnings: string[] = [];
    const P = spec.params ?? {};
    try {
      if (!d) throw new Error(`unknown partId ${spec.partId}`);
      let geom: ManifoldT;
      let svg: string | undefined;
      let name: string = spec.kind;

      if (spec.kind === 'cutter') {
        const outline = sourceProfile(d, spec);
        const wall = P.wall ?? 1.0;
        const layerH =
          d.kind === 'layers'
            ? (d.layers[spec.layer ?? 0]?.height ?? 5)
            : d.geom.boundingBox().max[2];
        const height = P.height ?? Math.max(layerH + 8, 14);
        const flange = P.flange ?? 3;
        const flangeT = P.flangeThickness ?? 2;
        const blade = outline.offset(wall, 'Round', 2, SEG).subtract(outline).extrude(height);
        const rim = outline
          .offset(wall + flange, 'Round', 2, SEG)
          .subtract(outline.offset(wall * 0.5, 'Round', 2, SEG))
          .extrude(flangeT);
        geom = blade.add(rim);
        svg = svgOf(outline);
        name = `Cutter: ${d.name}${d.kind === 'layers' ? ` (layer ${spec.layer ?? 0})` : ''}`;
        if (d.kind === 'solid' && !d.easy)
          warnings.push('part is a free-form solid: a cutter only gives its footprint');
        if (thinLoss(wasm, outline, 2) > 0.03)
          warnings.push(
            'outline has features thinner than 2 mm: dough may tear or stick in the cutter'
          );
        if (layerH > height - 3) warnings.push('cutter is barely taller than the sheet it cuts');
      } else if (spec.kind === 'stencil') {
        const pattern = sourceProfile(d, spec);
        const t = P.thickness ?? 1.0;
        const margin = P.margin ?? 10;
        const b = pattern.bounds();
        const w = b.max[0] - b.min[0] + 2 * margin;
        const h = b.max[1] - b.min[1] + 2 * margin;
        const cx = (b.min[0] + b.max[0]) / 2;
        const cy = (b.min[1] + b.max[1]) / 2;
        const tab = rrect(14, 12, 3).translate([cx + w / 2 + 4, cy]);
        const plate = rrect(w, h, 4).translate([cx, cy]).add(tab);
        const cut = plate.subtract(pattern);
        const pieces = cut.decompose();
        if (pieces.length > 1) {
          warnings.push(
            `${pieces.length - 1} floating island(s): enclosed parts of the plate fall out; add bridges or simplify the pattern`
          );
        }
        if (thinLoss(wasm, pattern, 1) > 0.05)
          warnings.push('pattern has openings thinner than 1 mm: powder will not pass cleanly');
        geom = cut.extrude(t);
        svg = svgOf(pattern);
        name = `Stencil: ${d.name}`;
      } else if (spec.kind === 'open_mold') {
        const wall = P.wall ?? 4;
        const floor = P.floor ?? 3;
        const opening = spec.opening ?? (d.envelope ? 'top' : 'base');
        const bb = d.geom.boundingBox();
        const H = bb.max[2] - bb.min[2];
        // cavity with its opening at z=0, extending down
        const cavity =
          opening === 'base' ? d.geom.mirror([0, 0, 1]) : d.geom.translate([0, 0, -bb.max[2]]);
        const w = bb.max[0] - bb.min[0] + 2 * wall;
        const h = bb.max[1] - bb.min[1] + 2 * wall;
        const block = rrect(w, h, Math.min(wall, 6))
          .translate([(bb.min[0] + bb.max[0]) / 2, (bb.min[1] + bb.max[1]) / 2])
          .extrude(H + floor)
          .translate([0, 0, -(H + floor)]);
        geom = block.subtract(cavity).translate([0, 0, H + floor]);
        // the casting is pulled up out of the opening: flip so "up" is +z for the check
        const trapped = undercutRatio(cavity.mirror([0, 0, 1]));
        if (trapped > 0.005)
          warnings.push(
            `casting is trapped (${(trapped * 100).toFixed(1)}% undercut): use a flexible silicone mould or split the part`
          );
        name = `${d.envelope ? 'Encapsulating mould' : 'Open-face mould'}: ${d.name}`;
        if (mode === '2.5d' && !d.envelope && !d.easy)
          warnings.push('2.5D mode allows moulds only for the envelope or easy parts');
      } else if (spec.kind === 'silicone_box') {
        const gap = P.gap ?? 5;
        const wall = P.wall ?? 2.4;
        const floor = P.floor ?? 2;
        const cover = P.cover ?? 6;
        const bb = d.geom.boundingBox();
        const iw = bb.max[0] - bb.min[0] + 2 * gap;
        const ih = bb.max[1] - bb.min[1] + 2 * gap;
        const H = bb.max[2] - bb.min[2] + cover;
        const cx = (bb.min[0] + bb.max[0]) / 2;
        const cy = (bb.min[1] + bb.max[1]) / 2;
        const outer = rrect(iw + 2 * wall, ih + 2 * wall, 3).translate([cx, cy]);
        const inner = rrect(iw, ih, 1).translate([cx, cy]);
        const walls = outer.subtract(inner).extrude(floor + H);
        const base = outer.extrude(floor);
        const pocket = d.geom
          .slice(0.05)
          .offset(0.2, 'Round', 2, SEG)
          .extrude(0.8)
          .translate([0, 0, floor - 0.8]);
        geom = walls.add(base).subtract(pocket);
        name = `Silicone mould box: ${d.name}`;
      } else {
        throw new Error(`unknown tool kind ${spec.kind}`);
      }

      const status = geom.status();
      const bb = boundsOf(geom);
      const size = [0, 1, 2].map((k) => r2(bb.max[k] - bb.min[k])) as [number, number, number];
      if (status !== 'NoError') warnings.push(`geometry error: ${status}`);
      if (size.some((s, k) => s > PRINT_BED[k]))
        warnings.push(`larger than a ${PRINT_BED.join('x')} mm print bed`);
      // print orientation: sit on z=0
      geom = geom.translate([0, 0, -bb.min[2]]);
      covered.add(d.id);
      tools.push({
        id: spec.id,
        kind: spec.kind,
        partId: d.id,
        name,
        purpose: spec.purpose ?? '',
        mesh: meshOf(geom),
        stats: { size, volume: r2(geom.volume()), status },
        warnings,
        svg
      });
    } catch (e) {
      issues.push(`${spec.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const d of defs) {
    if ((!only || d.id === only) && !covered.has(d.id)) issues.push(`no tool makes part ${d.id}`);
  }
  return { ok: issues.length === 0, tools, issues };
}
