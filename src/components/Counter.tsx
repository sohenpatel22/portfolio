"use client";
import { useEffect, useRef, useState } from "react";

export function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    setN(0);
    let raf = 0;
    let safety: ReturnType<typeof setTimeout> | undefined;
    let started = false;
    // If the page never becomes visible (background tab) or never intersects, still show the real value.
    const idle = setTimeout(() => {
      if (!started) setN(to);
    }, 3000);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      started = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / 900, 1);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // Timers still run when animation frames are paused (background tab), so always land on the real value.
      safety = setTimeout(() => setN(to), 1400);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      if (safety) clearTimeout(safety);
    };
  }, [to]);
  return (
    <span ref={ref}>
      {n.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
