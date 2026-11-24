<script lang="ts">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

  import { buildScene, placeCamera, type SceneObject } from '#lib/fab/render.ts';

  let { objects, class: cls = '' }: { objects: SceneObject[]; class?: string } = $props();

  let canvas: HTMLCanvasElement;

  $effect(() => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    const { scene, box } = buildScene(objects);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
    placeCamera(camera, box, { label: '', azimuth: -60, elevation: 25 });
    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(box.getCenter(new THREE.Vector3()));
    controls.update();

    const draw = () => renderer.render(scene, camera);
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    controls.addEventListener('change', draw);
    resize();

    return () => {
      observer.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
    };
  });
</script>

<canvas bind:this={canvas} class={['block touch-none rounded-box bg-base-200', cls]}></canvas>
