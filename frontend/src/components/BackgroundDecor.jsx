import { useEffect, useRef } from 'react';

const GAP = 24;
const DOT = 2;
const BASE_A = 0.16;
const CURSOR_R = 180;

const BLOBS = [
  { bx: 0.12, r: 0.20, vy: 26, wob: 90, wf: 0.35, ph: 0.0, par: 0.16, s: 1.0 },
  { bx: 0.32, r: 0.26, vy: 18, wob: 120, wf: 0.24, ph: 1.7, par: 0.26, s: 0.9 },
  { bx: 0.50, r: 0.16, vy: 38, wob: 70, wf: 0.45, ph: 3.1, par: 0.10, s: 0.8 },
  { bx: 0.66, r: 0.24, vy: 22, wob: 110, wf: 0.28, ph: 4.4, par: 0.32, s: 1.0 },
  { bx: 0.82, r: 0.18, vy: 32, wob: 80, wf: 0.38, ph: 0.9, par: 0.14, s: 0.85 },
  { bx: 0.95, r: 0.14, vy: 42, wob: 60, wf: 0.50, ph: 2.5, par: 0.22, s: 0.75 },
  { bx: 0.04, r: 0.22, vy: 20, wob: 100, wf: 0.30, ph: 5.2, par: 0.20, s: 0.9 },
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
    let raf = 0;
    let hasPointer = false;
    let intensity = 0;
    let intensityTarget = 0;
    let scrollSmooth = window.scrollY;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const blobPositions = (t) => {
      const m = Math.min(w, h);
      return BLOBS.map((bl) => {
        const R = bl.r * m;
        const span = h + 2 * R;
        const y0 = (bl.ph / 6.28) * span;
        const rawY = y0 - t * bl.vy - scrollSmooth * bl.par;
        const y = (((rawY + R) % span) + span) % span - R;
        const x = bl.bx * w + Math.sin(t * bl.wf + bl.ph) * bl.wob;
        const r = R * (1 + 0.08 * Math.sin(t * 0.5 + bl.ph));
        return { x, y, r, r2: r * r, s: bl.s };
      });
    };

    const paint = (t) => {
      const blobs = blobPositions(t);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a0a';
      const cursorOn = intensity > 0.01;
      for (let gx = 0; gx <= w + GAP; gx += GAP) {
        for (let gy = 0; gy <= h + GAP; gy += GAP) {
          let f = 0;
          for (const b of blobs) {
            const dx = gx - b.x;
            if (dx > b.r || dx < -b.r) continue;
            const dy = gy - b.y;
            if (dy > b.r || dy < -b.r) continue;
            const k = 1 - (dx * dx + dy * dy) / b.r2;
            if (k > 0) f += k * k * b.s;
          }
          if (cursorOn) {
            const d = Math.hypot(gx - cur.x, gy - cur.y);
            if (d < CURSOR_R) {
              const k = 1 - d / CURSOR_R;
              f += k * k * (3 - 2 * k) * intensity;
            }
          }
          const e = f > 1 ? 1 : f;
          const s = DOT + e * 3.2;
          ctx.globalAlpha = BASE_A + e * 0.5;
          ctx.fillRect(gx - s / 2, gy - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      const follow = Math.min(0.55 * dt, 1);
      scrollSmooth += (window.scrollY - scrollSmooth) * 0.09 * dt;
      cur.x += (target.x - cur.x) * follow;
      cur.y += (target.y - cur.y) * follow;
      intensity += (intensityTarget - intensity) * 0.10 * dt;
      paint(now / 1000);
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
      paint(performance.now() / 1000);
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
