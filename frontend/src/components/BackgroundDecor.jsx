import { useEffect, useRef } from 'react';

const GAP = 24;
const BASE_R = 1;
const BASE_A = 0.15;
const RADIUS = 170;

export default function BackgroundDecor() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interactive = fine && !reduced;

    let w = 0, h = 0, dpr = 1;
    let base = null;
    let raf = 0;
    let running = false;
    const cur = { x: -9999, y: -9999 };
    const target = { x: -9999, y: -9999 };

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

    const paint = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(base, 0, 0, w, h);
      if (!interactive) return;
      const x0 = Math.max(0, Math.ceil((cur.x - RADIUS) / GAP) * GAP);
      const y0 = Math.max(0, Math.ceil((cur.y - RADIUS) / GAP) * GAP);
      const x1 = Math.min(w + GAP, cur.x + RADIUS);
      const y1 = Math.min(h + GAP, cur.y + RADIUS);
      for (let x = x0; x <= x1; x += GAP) {
        for (let y = y0; y <= y1; y += GAP) {
          const d = Math.hypot(x - cur.x, y - cur.y);
          if (d >= RADIUS) continue;
          const k = 1 - d / RADIUS;
          const e = k * k * (3 - 2 * k);
          ctx.beginPath();
          ctx.arc(x, y, BASE_R + e * 1.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(10,10,10,${BASE_A + e * 0.5})`;
          ctx.fill();
        }
      }
    };

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.16;
      cur.y += (target.y - cur.y) * 0.16;
      paint();
      if (Math.hypot(target.x - cur.x, target.y - cur.y) > 0.4) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e) => { target.x = e.clientX; target.y = e.clientY; wake(); };
    const onLeave = () => { target.x = -9999; target.y = -9999; wake(); };

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
      paint();
    };

    resize();
    window.addEventListener('resize', resize);
    if (interactive) {
      window.addEventListener('mousemove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
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
