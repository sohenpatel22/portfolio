"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type Cmd = { label: string; hint: string; href: string; external?: boolean };

export function CommandPalette({ commands }: { commands: Cmd[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return commands.filter((c) => !s || `${c.label} ${c.hint}`.toLowerCase().includes(s));
  }, [q, commands]);

  function go(c: Cmd) {
    setOpen(false);
    if (c.external) window.open(c.href, "_blank", "noopener");
    else router.push(c.href);
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[15vh]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="card w-full max-w-lg overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
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
          placeholder="Jump to a project, section or link…"
          className="w-full border-b border-line bg-transparent px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-72 overflow-auto py-1">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">No matches</li>}
          {results.map((c, i) => (
            <li key={c.href + c.label}>
              <button
                onClick={() => go(c)}
                onMouseEnter={() => setSel(i)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${i === sel ? "bg-accent-soft" : ""}`}
              >
                <span>{c.label}</span>
                <span className="font-mono text-xs text-muted">{c.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
