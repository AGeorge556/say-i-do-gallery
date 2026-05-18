import { useEffect, useRef } from "react";
import * as THREE from "three";

const COUNT = 220;

// Warm cream/gold palette matching the site
const PALETTE = ["#F5E6D3", "#E8CFA8", "#D4B896", "#EDD9B8", "#C9A882", "#F2DCBC"];

function makeCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const texture = makeCircleTexture();

    // Build geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const tmpColor = new THREE.Color();

    const spread = { x: 14, y: 9, z: 4 };

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;

      tmpColor.set(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      colors[i * 3]     = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Per-particle drift
    const drift = Array.from({ length: COUNT }, () => ({
      vy: Math.random() * 0.004 + 0.001,
      vx: (Math.random() - 0.5) * 0.0015,
      phase: Math.random() * Math.PI * 2,
    }));

    let rafId = 0;
    let t = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.012;

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        const d = drift[i];
        pos[i * 3]     += d.vx + Math.sin(t * 0.4 + d.phase) * 0.0008;
        pos[i * 3 + 1] += d.vy;

        // Wrap vertically
        if (pos[i * 3 + 1] > spread.y / 2) {
          pos[i * 3 + 1] = -spread.y / 2;
          pos[i * 3]     = (Math.random() - 0.5) * spread.x;
        }
        // Bounce horizontally
        if (Math.abs(pos[i * 3]) > spread.x / 2) {
          drift[i].vx *= -1;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Slow whole-system drift
      points.rotation.z += 0.00015;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.remove();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
