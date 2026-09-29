import Link from "next/link";
import { projects } from "@/data/projects";

export function ProjectNav({ slug }: { slug: string }) {
  const i = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  return (
    <nav className="lab-projectnav mt-14 grid gap-3 border-t border-line pt-8 sm:grid-cols-2" aria-label="More projects">
      <Link href={`/projects/${prev.slug}`} className="card block p-4">
        <span className="eyebrow">← Previous</span>
        <span className="mt-1 block font-serif text-lg font-semibold leading-snug">{prev.title}</span>
      </Link>
      <Link href={`/projects/${next.slug}`} className="card block p-4 text-right">
        <span className="eyebrow">Next →</span>
        <span className="mt-1 block font-serif text-lg font-semibold leading-snug">{next.title}</span>
      </Link>
    </nav>
  );
}
