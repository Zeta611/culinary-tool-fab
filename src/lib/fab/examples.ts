/** Reference scripts: used in the system prompt as a worked example and in tests. */

export const MIRROR_LAKE_EXAMPLE = String.raw`// Mirror Lake wagashi: 60 mm clear agar cube with a stylised landscape inside.
K.scene({ margin: 4 });
const CUBE = 60, FLOOR = 8, SLAB = 5;
const GROUND = FLOOR + SLAB;

K.part({ id: 'agar_cube', name: 'Agar cube', material: 'clear kanten', color: '#e8f4f6',
  envelope: true, geom: M.cube([CUBE, CUBE, CUBE], true).translate([0, 0, CUBE / 2]) });

// Shore slab with the lake cut out (2D, cookie-cutter friendly)
const outline = K.roundedRect(47, 47, 6);
const lake = K.profile([[-7,-32],[5,-32],[6,-22],[8,-13],[6.5,-5],[2,0],[-4,0.5],[-9,-3],[-10.5,-10],[-8,-19]], 4);
const shore = outline.subtract(lake).offset(-1, 'Round').offset(1, 'Round');
K.part({ id: 'shore_slab', name: 'Shore slab', material: 'shiro-an nerikiri', color: '#d9cbb0',
  layers: [{ profile: shore, height: SLAB }], instances: [{ z: FLOOR }] });
K.part({ id: 'lake', name: 'Lake', material: 'blue kanten', color: '#5fa9b8',
  layers: [{ profile: outline.intersect(lake).offset(-0.4, 'Round'), height: 3 }], instances: [{ z: FLOOR }] });

// Granite domes: union of super-ellipsoid domes, sheer face cut with K.cliff
const watkins = K.cliff(
  K.dome(0, 0, 8.5, 6, 21, 6).add(K.dome(-6, 1.5, 5.5, 4.5, 15, 5)).add(K.dome(3.5, 3, 4.5, 3.5, 17, 4)),
  -20, 8, [5.5, 0]);
K.part({ id: 'mtn_left', name: 'Left massif', material: 'grey nerikiri', color: '#c9c7c0',
  geom: watkins, instances: [{ x: -11.8, y: 14.2, z: GROUND }] });

// Fir clusters on a shared footing
const firs = K.cluster([
  { geom: K.fir(10.5, 2.9), x: 0, y: 0.8, r: 2.9 },
  { geom: K.fir(8, 2.5), x: -3.3, y: -1, r: 2.5 },
  { geom: K.fir(8.5, 2.5), x: 3, y: -1.2, r: 2.5 },
]);
K.part({ id: 'firs', name: 'Fir cluster', material: 'matcha nerikiri', color: '#3f6b3a',
  geom: firs, instances: [{ x: -2, y: 7, z: GROUND }, { x: 15, y: -11, z: GROUND, rotZ: 200 }] });
`;
