import { useEffect, useRef } from 'react';

const GAP = 24;
const BASE_R = 1;
const BASE_A = 0.15;
const RADIUS = 180;

const BLOBS = [
  { bx: 0.12, r: 0.16, vy: 26, wob: 90, wf: 0.35, ph: 0.0, par: 0.16, a: 0.26 },
  { bx: 0.30, r: 0.21, vy: 18, wob: 120, wf: 0.24, ph: 1.7, par: 0.26, a: 0.30 },
  { bx: 0.48, r: 0.13, vy: 38, wob: 70, wf: 0.45, ph: 3.1, par: 0.10, a: 0.24 },
  { bx: 0.64, r: 0.19, vy: 22, wob: 110, wf: 0.28, ph: 4.4, par: 0.32, a: 0.28 },
  { bx: 0.80, r: 0.15, vy: 32, wob: 80, wf: 0.38, ph: 0.9, par: 0.14, a: 0.25 },
  { bx: 0.93, r: 0.12, vy: 42, wob: 60, wf: 0.50, ph: 2.5, par: 0.22, a: 0.22 },
  { bx: 0.05, r: 0.18, vy: 20, wob: 100, wf: 0.30, ph: 5.2, par: 0.20, a: 0.27 },
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
        const R = bl.r * m;
        const span = h + 2 * R;
        const y0 = (bl.ph / 6.28) * span;
        const rawY = y0 - t * bl.vy - scrollSmooth * bl.par;
        const y = (((rawY + R) % span) + span) % span - R;
        const x = bl.bx * w + Math.sin(t * bl.wf + bl.ph) * bl.wob;
        const r = R * (1 + 0.1 * Math.sin(t * 0.5 + bl.ph));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(10,10,10,${bl.a})`);
        g.addColorStop(0.72, `rgba(10,10,10,${bl.a * 0.8})`);
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
