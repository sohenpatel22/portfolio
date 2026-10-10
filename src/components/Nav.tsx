"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  ["Experience", "experience"],
  ["Projects", "projects"],
  ["Skills", "skills"],
  ["Education", "education"],
  ["Beyond work", "extracurricular"],
  ["Contact", "contact"],
];

export function Nav() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const els = links.map(([, id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-x flex h-14 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-lg font-semibold">
          Sohen Patel
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
          {links.map(([l, id]) => (
            <Link key={id} href={`/#${id}`} data-active={active === id} className="nav-link hover:text-ink">
              {l}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => window.dispatchEvent(new Event("open-palette"))}
            className="rounded-md border border-line p-2 text-muted hover:border-accent hover:text-ink"
            aria-label="Open menu"
            title="Menu (Ctrl K)"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
