// @ts-nocheck
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCharacterModel } from '../game/render3d/models.js';

interface ModelPreviewCanvasProps {
  modelId: string | number;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    if (obj.geometry) obj.geometry.dispose?.();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => mat.dispose?.());
    }
  });
}

export function ModelPreviewCanvas({ modelId }: ModelPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stage = canvas.parentElement || canvas;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a1017');

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 9000);
    const target = new THREE.Vector3(0, 42, 0);

    const hemi = new THREE.HemisphereLight(0xdce8f6, 0x1d2430, 0.8);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffe8ca, 2.5);
    key.position.set(260, 440, 320);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x8ab4ff, 0.75);
    rim.position.set(-280, 220, -260);
    scene.add(rim);

    const floor = new THREE.GridHelper(420, 14, 0x486171, 0x24313c);
    floor.position.y = -0.5;
    scene.add(floor);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    let model: THREE.Group | null = null;
    try {
      model = createCharacterModel(modelId) as THREE.Group;
      modelRoot.add(model);

      const box = new THREE.Box3().setFromObject(model);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y;

        const maxDim = Math.max(size.x, size.y, size.z, 80);
        target.set(0, Math.max(36, size.y * 0.45), 0);
        camera.position.set(maxDim * 0.95, maxDim * 0.72, maxDim * 1.95);
        camera.lookAt(target);
        camera.near = Math.max(0.1, maxDim / 120);
        camera.far = maxDim * 14;
        camera.updateProjectionMatrix();
      }
    } catch (err) {
      console.error('[ModelPreviewCanvas] failed to create model', modelId, err);
    }

    let disposed = false;
    let frame = 0;
    let lastTime = performance.now();

    function resize() {
      const w = Math.max(1, stage.clientWidth | 0);
      const h = Math.max(1, stage.clientHeight | 0);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    function tick(now: number) {
      if (disposed) return;
      const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
      lastTime = now;
      modelRoot.rotation.y += dt * 0.42;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      if (model) {
        modelRoot.remove(model);
        disposeObject(model);
      }
      renderer.dispose();
    };
  }, [modelId]);

  return <canvas ref={canvasRef} className="model-preview-canvas" aria-label="模型預覽" />;
}
