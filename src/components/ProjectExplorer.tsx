"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project } from "@/data/projects";
import { Reveal } from "./Reveal";

export function OpenIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="absolute right-4 top-4 h-5 w-5 text-muted transition-colors group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

export function ProjectExplorer({ projects }: { projects: Project[] }) {
  const allTags = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.tags))).sort(), [projects]);
  const [tag, setTag] = useState<string | null>(null);
  const shown = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter projects">
        {[null, ...allTags].map((t) => (
          <button
            key={t ?? "all"}
            onClick={() => setTag(t)}
            aria-pressed={tag === t}
            className={`chip cursor-pointer ${tag === t ? "!border-accent !text-accent" : "hover:!text-ink"}`}
          >
            {t ?? "All"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 2) * 90} className="flex">
          <Link href={`/projects/${p.slug}`} className="card group relative flex w-full flex-col p-5 pr-11">
            <span className="eyebrow">{p.kicker}</span>
            <h3 className="mt-2 font-serif text-xl font-semibold leading-snug">{p.title}</h3>
            <p className="mt-3 font-mono text-2xl font-medium text-accent">{p.metric.value}</p>
            <p className="text-sm text-muted">{p.metric.label}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed">{p.summary}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.stack.slice(0, 5).map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
            </div>
            <OpenIcon />
          </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
