import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

import type { Instance, MeshData, PartResult, RenderImage, ToolResult } from './types.ts';

export interface SceneObject {
  label: string;
  mesh: MeshData;
  color: string;
  opacity?: number;
  /** draw crease edges (used for the glassy envelope) */
  outline?: boolean;
  placements: Instance[];
}

const ORIGIN: Instance = { x: 0, y: 0, z: 0, rotX: 0, rotZ: 0 };
const TOOL_COLOR = '#e3b23c';

export function partsToObjects(parts: PartResult[]): SceneObject[] {
  return parts.map((p) => ({
    label: p.name,
    mesh: p.mesh,
    color: p.color,
    opacity: p.envelope ? 0.18 : 1,
    outline: p.envelope,
    placements: p.instances
  }));
}

/** One part at its own origin (base on z = 0). */
export function partAlone(p: PartResult): SceneObject {
  return {
    label: p.name,
    mesh: p.mesh,
    color: p.color,
    opacity: p.envelope ? 0.35 : 1,
    outline: p.envelope,
    placements: [ORIGIN]
  };
}

/** Unique parts or tools laid out on a grid (rows run along x, back to front), each at its own origin. */
export function gridObjects(
  items: { label: string; mesh: MeshData; color: string }[],
  gap = 10
): SceneObject[] {
  const cols = Math.ceil(Math.sqrt(items.length));
  const boxes = items.map((it) => boundsOf(it.mesh));
  const cell = Math.max(...boxes.map((b) => Math.max(b.max.x - b.min.x, b.max.y - b.min.y))) + gap;
  return items.map((it, i) => {
    const b = boxes[i];
    const placement = {
      ...ORIGIN,
      x: (i % cols) * cell - (b.min.x + b.max.x) / 2,
      y: -Math.floor(i / cols) * cell - (b.min.y + b.max.y) / 2
    };
    return { ...it, placements: [placement] };
  });
}

/** The part printed as a master; a silicone mould box is useless without it. */
export function needsMaster(tools: ToolResult[]) {
  return tools.some((t) => t.kind === 'silicone_box');
}

/** Tools for one part, plus that part as the master when a silicone box needs one. */
function toolItems(tools: ToolResult[], part?: PartResult) {
  const items = tools.map((t) => ({
    label: t.name,
    id: t.id,
    sub: `${t.kind} · ${fmtSize(t.stats.size)}`,
    mesh: t.mesh,
    color: TOOL_COLOR
  }));
  if (part && needsMaster(tools)) {
    items.push({
      label: `Master: ${part.name}`,
      id: `${part.id} master`,
      sub: `master for the silicone box · ${fmtSize(part.stats.size)}`,
      mesh: part.mesh,
      color: part.color
    });
  }
  return items;
}

export function toolsToObjects(tools: ToolResult[], part?: PartResult): SceneObject[] {
  return gridObjects(toolItems(tools, part));
}

function boundsOf(mesh: MeshData) {
  const b = new THREE.Box3();
  const p = mesh.positions;
  for (let i = 0; i < p.length; i += 3)
    b.expandByPoint(new THREE.Vector3(p[i], p[i + 1], p[i + 2]));
  return b;
}

function geometryOf(mesh: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
  g.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  return toCreasedNormals(g, (35 * Math.PI) / 180);
}

function matrixOf(i: Instance): THREE.Matrix4 {
  const rx = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(i.rotX ?? 0));
  const rz = new THREE.Matrix4().makeRotationZ(THREE.MathUtils.degToRad(i.rotZ ?? 0));
  const t = new THREE.Matrix4().makeTranslation(i.x, i.y, i.z);
  return t.multiply(rz).multiply(rx);
}

export function buildScene(objects: SceneObject[]): { scene: THREE.Scene; box: THREE.Box3 } {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f4f4f2');
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a8a80', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(-0.6, -1, 1.4);
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#ffffff', 0.6);
  fill.position.set(1, 0.8, 0.6);
  scene.add(fill);

  const box = new THREE.Box3();
  const opaque = new THREE.Box3();
  for (const o of objects) {
    const geom = geometryOf(o.mesh);
    const transparent = (o.opacity ?? 1) < 1;
    const mat = new THREE.MeshStandardMaterial({
      color: o.color,
      roughness: transparent ? 0.1 : 0.7,
      metalness: 0,
      transparent,
      opacity: o.opacity ?? 1,
      depthWrite: !transparent,
      side: transparent ? THREE.DoubleSide : THREE.FrontSide
    });
    for (const p of o.placements) {
      const m = new THREE.Mesh(geom, mat);
      m.matrixAutoUpdate = false;
      m.matrix.copy(matrixOf(p));
      m.renderOrder = transparent ? 1 : 0;
      scene.add(m);
      m.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(m);
      box.union(b);
      if (!transparent) opaque.union(b);
      if (o.outline) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geom, 30),
          new THREE.LineBasicMaterial({ color: '#7fb6c2' })
        );
        edges.matrixAutoUpdate = false;
        edges.matrix.copy(m.matrix);
        scene.add(edges);
      }
    }
  }
  return { scene, box: box.isEmpty() ? opaque : box };
}

export interface View {
  label: string;
  azimuth: number; // degrees, -90 = viewer in front (at -y)
  elevation: number;
}

export const SCENE_VIEWS: View[] = [
  { label: 'front', azimuth: -90, elevation: 12 },
  { label: 'front-right', azimuth: -50, elevation: 28 },
  { label: 'front-left', azimuth: -130, elevation: 28 },
  { label: 'top', azimuth: -90, elevation: 88 }
];

export function placeCamera(camera: THREE.PerspectiveCamera, box: THREE.Box3, view: View) {
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.05;
  const az = THREE.MathUtils.degToRad(view.azimuth);
  const el = THREE.MathUtils.degToRad(view.elevation);
  camera.up.set(0, 0, 1);
  camera.position.set(
    sphere.center.x + dist * Math.cos(el) * Math.cos(az),
    sphere.center.y + dist * Math.cos(el) * Math.sin(az),
    sphere.center.z + dist * Math.sin(el)
  );
  camera.near = dist / 100;
  camera.far = dist * 10;
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
}

let shared: THREE.WebGLRenderer | null = null;
function renderer(size: number) {
  if (!shared) {
    shared = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    shared.setPixelRatio(1);
  }
  shared.setSize(size, size, false);
  return shared;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
}

/** Render the scene from several views; returns JPEG data URLs. */
export function snapshot(objects: SceneObject[], views = SCENE_VIEWS, size = 640): RenderImage[] {
  const { scene, box } = buildScene(objects);
  const r = renderer(size);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  const out = views.map((view) => {
    placeCamera(camera, box, view);
    r.render(scene, camera);
    return { label: view.label, url: r.domElement.toDataURL('image/jpeg', 0.85) };
  });
  disposeScene(scene);
  return out;
}

/** One labelled tile per item (rendered alone), composed into one sheet image. */
export function sheet(
  items: { label: string; mesh: MeshData; color: string; sub?: string }[],
  title: string,
  tile = 320
): RenderImage {
  const cols = Math.min(4, Math.max(1, items.length));
  const rows = Math.ceil(items.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * tile;
  canvas.height = rows * tile;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4f4f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  items.forEach((it, i) => {
    const { scene, box } = buildScene([{ ...it, placements: [ORIGIN] }]);
    const r = renderer(tile);
    placeCamera(camera, box, { label: '', azimuth: -60, elevation: 28 });
    r.render(scene, camera);
    const x = (i % cols) * tile;
    const y = Math.floor(i / cols) * tile;
    ctx.drawImage(r.domElement, x, y);
    ctx.fillStyle = '#171717';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(it.label, x + 10, y + 22);
    if (it.sub) {
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#4d4d4d';
      ctx.fillText(it.sub, x + 10, y + 40);
    }
    ctx.strokeStyle = '#dddddd';
    ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
    disposeScene(scene);
  });
  return { label: title, url: canvas.toDataURL('image/jpeg', 0.85) };
}

const fmtSize = (s: [number, number, number]) => s.map((v) => v.toFixed(1)).join(' × ') + ' mm';

const ISO: View = { label: 'iso', azimuth: -60, elevation: 28 };

/** Small node thumbnail of one part. */
export function partThumbnail(p: PartResult): string {
  return snapshot([partAlone(p)], [ISO], 320)[0].url;
}

/** Small node thumbnail of a set of tools. */
export function toolsThumbnail(tools: ToolResult[], part?: PartResult): string {
  return snapshot(toolsToObjects(tools, part), [ISO], 320)[0].url;
}

/** What one part's tool agent sees: the part alone, and in the scene with the rest ghosted. */
export function renderFocus(parts: PartResult[], id: string): RenderImage[] {
  const p = parts.find((x) => x.id === id);
  if (!p) return [];
  const alone = snapshot(
    [partAlone(p)],
    [
      { label: 'front-right', azimuth: -50, elevation: 28 },
      { label: 'front-left', azimuth: -130, elevation: 28 },
      { label: 'top', azimuth: -90, elevation: 88 }
    ]
  ).map((v) => ({ ...v, label: `${id} alone ${v.label}` }));
  const scene = partsToObjects(parts).map((o, i) =>
    parts[i].id === id
      ? o
      : { ...o, opacity: parts[i].envelope ? 0.12 : 0.22, outline: parts[i].envelope }
  );
  const inScene = snapshot(scene, [{ label: '', azimuth: -50, elevation: 28 }]).map((v) => ({
    ...v,
    label: `${id} in scene (others ghosted)`
  }));
  return [...alone, ...inScene];
}

export function renderParts(parts: PartResult[]): RenderImage[] {
  const views = snapshot(partsToObjects(parts)).map((v) => ({ ...v, label: `scene ${v.label}` }));
  const pieces = parts.filter((p) => !p.envelope);
  if (!pieces.length) return views;
  return [
    ...views,
    sheet(
      pieces.map((p) => ({
        label: `${p.id} ×${p.instances.length}`,
        sub: fmtSize(p.stats.size),
        mesh: p.mesh,
        color: p.color
      })),
      'parts sheet'
    )
  ];
}

export function renderTools(tools: ToolResult[], part?: PartResult): RenderImage[] {
  if (!tools.length) return [];
  return [
    sheet(
      toolItems(tools, part).map((t) => ({ ...t, label: t.id })),
      'tools sheet'
    )
  ];
}
