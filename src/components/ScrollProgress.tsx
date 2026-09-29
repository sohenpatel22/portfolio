"use client";
import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? Math.min(scrollY / h, 1) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);
  return <div ref={ref} className="scroll-progress" aria-hidden />;
}
