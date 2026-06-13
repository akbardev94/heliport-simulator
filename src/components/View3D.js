"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

function setupRenderer(THREE, renderer) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

function setupLights(THREE, scene, safetyM) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  scene.add(new THREE.HemisphereLight(0xd8eeff, 0x6a8a50, 0.38));

  const sun = new THREE.DirectionalLight(0xffffff, 0.95);
  sun.position.set(safetyM * 0.6, safetyM * 1.3, safetyM * 0.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = safetyM * 6;
  const s = safetyM * 1.1;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  scene.add(sun);
}

/** 3D preview of heliport pads only (Safety / FATO / TLOF) — no helicopter model. */
const View3D = forwardRef(function View3D({ dims }, ref) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      const r = rendererRef.current;
      if (!r) return null;
      try {
        return r.domElement.toDataURL("image/png");
      } catch {
        return null;
      }
    },
  }));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let raf;
    let renderer;
    let controls;
    let resizeObs;

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
        if (cancelled || !mountRef.current) return;

        const width = mount.clientWidth || 320;
        const height = 320;
        const safetyM = dims.fato + 2 * dims.safety || 20;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#b8daf0");

        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
        camera.position.set(safetyM * 1.05, safetyM * 0.88, safetyM * 1.08);

        renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        setupRenderer(THREE, renderer);
        mount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.target.set(0, 0.35, 0);
        controls.maxPolarAngle = Math.PI / 2.05;
        controls.minDistance = safetyM * 0.45;
        controls.maxDistance = safetyM * 2.8;
        controls.update();

        setupLights(THREE, scene, safetyM);

        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(safetyM * 2.6, safetyM * 2.6),
          new THREE.MeshStandardMaterial({ color: 0x7d9b5e, flatShading: true, roughness: 0.95 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        const plate = (size, color, y) => {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(size, 0.26, size),
            new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 })
          );
          m.position.y = y;
          m.receiveShadow = true;
          m.castShadow = true;
          return m;
        };
        scene.add(plate(safetyM, 0xc9d6bb, 0.13));
        scene.add(plate(dims.fato || 14, 0xb9bec4, 0.3));
        scene.add(plate(dims.tlof || 11, 0x4f6868, 0.48));

        const mark = new THREE.Mesh(
          new THREE.BoxGeometry((dims.tlof || 11) * 0.4, 0.05, (dims.tlof || 11) * 0.4),
          new THREE.MeshStandardMaterial({ color: 0xf5a623, flatShading: true })
        );
        mark.position.y = 0.66;
        mark.castShadow = true;
        scene.add(mark);

        const animate = () => {
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(animate);
        };
        animate();

        resizeObs = new ResizeObserver(() => {
          const w = mount.clientWidth || 320;
          camera.aspect = w / height;
          camera.updateProjectionMatrix();
          renderer.setSize(w, height);
        });
        resizeObs.observe(mount);

        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("View3D init failed:", err);
        if (!cancelled) setError("Gagal memuat pratinjau 3D. Muat ulang halaman.");
      }
    })();

    return () => {
      cancelled = true;
      setReady(false);
      cancelAnimationFrame(raf);
      controls?.dispose();
      renderer?.dispose();
      rendererRef.current = null;
      resizeObs?.disconnect();
      if (renderer?.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [dims.fato, dims.safety, dims.tlof]);

  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className={`h-[320px] w-full cursor-grab overflow-hidden rounded-lg border border-slate-200 bg-[#b8daf0] active:cursor-grabbing ${
          ready ? "" : "animate-pulse"
        }`}
      />
      {ready && (
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-500/90">
          Geser untuk putar · scroll untuk zoom
        </p>
      )}
    </div>
  );
});

export default View3D;
