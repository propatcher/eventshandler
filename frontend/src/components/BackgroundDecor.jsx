import { useEffect, useRef } from 'react';

const GAP = 24;
const BASE_R = 1;
const BASE_A = 0.15;
const RADIUS = 180;

const BLOBS = [
  { bx: 0.15, by: 0.25, r: 0.38, ax: 150, ay: 100, fx: 0.42, fy: 0.30, ph: 0.0, par: 0.18, a: 0.190 },
  { bx: 0.85, by: 0.15, r: 0.32, ax: 110, ay: 140, fx: 0.28, fy: 0.40, ph: 2.1, par: 0.30, a: 0.160 },
  { bx: 0.70, by: 0.78, r: 0.42, ax: 170, ay: 110, fx: 0.23, fy: 0.34, ph: 4.2, par: 0.12, a: 0.200 },
  { bx: 0.30, by: 0.90, r: 0.30, ax: 130, ay: 150, fx: 0.36, fy: 0.25, ph: 1.3, par: 0.24, a: 0.160 },
  { bx: 0.52, by: 0.45, r: 0.35, ax: 190, ay: 130, fx: 0.31, fy: 0.21, ph: 5.4, par: 0.36, a: 0.140 },
  { bx: 0.04, by: 0.62, r: 0.26, ax: 100, ay: 110, fx: 0.39, fy: 0.32, ph: 3.0, par: 0.20, a: 0.160 },
];

export default function BackgroundDecor() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1;
    let base = null;
    let raf = 0;
    let hasPointer = false;
    let intensity = 0;
    let intensityTarget = 0;
    let scrollSmooth = window.scrollY;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const buildBase = () => {
      base = document.createElement('canvas');
      base.width = Math.max(w * dpr, 1);
      base.height = Math.max(h * dpr, 1);
      const b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = `rgba(10,10,10,${BASE_A})`;
      for (let x = 0; x <= w + GAP; x += GAP) {
        for (let y = 0; y <= h + GAP; y += GAP) {
          b.beginPath();
          b.arc(x, y, BASE_R, 0, Math.PI * 2);
          b.fill();
        }
      }
    };

    const drawBlobs = (t) => {
      const m = Math.min(w, h);
      for (const bl of BLOBS) {
        const span = h + 2 * bl.r * m;
        const rawY = bl.by * h + Math.cos(t * bl.fy + bl.ph * 1.7) * bl.ay - scrollSmooth * bl.par;
        const y = (((rawY + bl.r * m) % span) + span) % span - bl.r * m;
        const x = bl.bx * w + Math.sin(t * bl.fx + bl.ph) * bl.ax;
        const r = bl.r * m * (1 + 0.12 * Math.sin(t * 0.45 + bl.ph));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(10,10,10,${bl.a})`);
        g.addColorStop(0.65, `rgba(10,10,10,${bl.a * 0.45})`);
        g.addColorStop(1, 'rgba(10,10,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawHighlight = () => {
      if (intensity < 0.01) return;
      const x0 = Math.max(0, Math.ceil((cur.x - RADIUS) / GAP) * GAP);
      const y0 = Math.max(0, Math.ceil((cur.y - RADIUS) / GAP) * GAP);
      const x1 = Math.min(w + GAP, cur.x + RADIUS);
      const y1 = Math.min(h + GAP, cur.y + RADIUS);
      for (let x = x0; x <= x1; x += GAP) {
        for (let y = y0; y <= y1; y += GAP) {
          const d = Math.hypot(x - cur.x, y - cur.y);
          if (d >= RADIUS) continue;
          const k = 1 - d / RADIUS;
          const e = k * k * (3 - 2 * k) * intensity;
          ctx.beginPath();
          ctx.arc(x, y, BASE_R + e * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10,10,10,${BASE_A + e * 0.45})`;
          ctx.fill();
        }
      }
    };

    const paintStatic = () => {
      ctx.clearRect(0, 0, w, h);
      drawBlobs(0);
      ctx.drawImage(base, 0, 0, w, h);
    };

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      const t = now / 1000;

      const follow = Math.min(0.55 * dt, 1);
      scrollSmooth += (window.scrollY - scrollSmooth) * 0.09 * dt;
      cur.x += (target.x - cur.x) * follow;
      cur.y += (target.y - cur.y) * follow;
      intensity += (intensityTarget - intensity) * 0.10 * dt;

      ctx.clearRect(0, 0, w, h);
      drawBlobs(t);
      ctx.drawImage(base, 0, 0, w, h);
      drawHighlight();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!hasPointer) {
        hasPointer = true;
        cur.x = target.x;
        cur.y = target.y;
      }
      intensityTarget = 1;
    };
    const onLeave = () => { intensityTarget = 0; };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) start();
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(w * dpr, 1);
      canvas.height = Math.max(h * dpr, 1);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildBase();
      paintStatic();
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (fine && !reduced) {
      window.addEventListener('mousemove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    if (!reduced) start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
