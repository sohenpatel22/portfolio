"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type Cmd = { label: string; hint: string; href: string; group: string; external?: boolean };

const GROUPS = ["Sections", "Projects", "Links"];

/** The site menu: opened by the hamburger button or Ctrl+K. Search, then pick a section, project or link. */
export function CommandPalette({ commands }: { commands: Cmd[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQ("");
        setSel(0);
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => {
      setQ("");
      setSel(0);
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  // Focus the search box only where there is a keyboard, so phones do not pop their keyboard open.
  useEffect(() => {
    if (open && window.matchMedia("(pointer: fine)").matches) setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const found = commands.filter((c) => !s || `${c.label} ${c.hint} ${c.group}`.toLowerCase().includes(s));
    return GROUPS.flatMap((g) => found.filter((c) => c.group === g));
  }, [q, commands]);

  // Keep the highlighted row in view while moving with the arrow keys.
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function go(c: Cmd) {
    setOpen(false);
    if (c.external) {
      if (c.href.startsWith("mailto:")) window.location.href = c.href;
      else window.open(c.href, "_blank", "noopener");
    } else if (pathname === "/" && c.href.startsWith("/#")) {
      // Scroll by hand on the home page, because closing the menu can swallow Next's hash scroll.
      setTimeout(() => {
        document.getElementById(c.href.slice(2))?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", c.href);
      }, 60);
    } else if (c.href === "/" && pathname === "/") {
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60);
    } else router.push(c.href);
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 p-3 pt-16 sm:p-4 sm:pt-16"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <div className="card menu-in flex max-h-[calc(100vh-5rem)] w-full flex-col overflow-hidden shadow-xl sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === "Enter" && results[sel]) go(results[sel]);
            }}
            placeholder="Search sections, projects, links"
            aria-label="Search the menu"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="py-3 text-muted hover:text-ink">
            ✕
          </button>
        </div>
        <ul ref={list} className="flex-1 overflow-auto py-1">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">No matches</li>}
          {results.map((c, i) => {
            const heading = i === 0 || results[i - 1].group !== c.group;
            return (
              <li key={c.href + c.label}>
                {heading && <p className="eyebrow px-4 pb-1 pt-3">{c.group}</p>}
                <button
                  data-index={i}
                  onClick={() => go(c)}
                  onMouseEnter={() => setSel(i)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm ${i === sel ? "bg-accent-soft" : ""}`}
                >
                  <span>{c.label}</span>
                  <span className="shrink-0 text-xs text-muted">{c.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="hidden border-t border-line px-4 py-2 text-xs text-muted sm:block">
          <kbd className="font-mono">↑↓</kbd> move · <kbd className="font-mono">Enter</kbd> open · <kbd className="font-mono">Esc</kbd> close · <kbd className="font-mono">Ctrl K</kbd> toggle
        </p>
      </div>
    </div>
  );
}
