import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { projects, visibleProjects, type Table } from "@/data/projects";
import { legalResults, legalFacts, replay } from "@/data/legal";
import { ResultsChart } from "@/components/ResultsChart";
import { TrialReplay } from "@/components/TrialReplay";
import { Diagram } from "@/components/Diagram";
import { ProjectNav } from "@/components/ProjectNav";

type Props = { params: Promise<{ slug: string }> };

function DataTable({ table }: { table: Table }) {
  return (
    <figure className="mt-5">
      {table.caption && <figcaption className="eyebrow mb-2">{table.caption}</figcaption>}
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-accent-soft">
              {table.columns.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-mono text-xs font-medium uppercase tracking-wide text-accent">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="border-t border-line align-top">
                {r.map((cell, j) => (
                  <td key={j} className={`px-3 py-2 leading-relaxed ${j === 0 ? "font-medium" : "text-muted"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function generateStaticParams() {
  return visibleProjects.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = visibleProjects.find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p || !visibleProjects.includes(p)) notFound();
  const isLegal = p.slug === "legal-agents";

  return (
    <article className="container-x max-w-3xl py-14">
      <Link href="/#projects" className="text-sm text-muted hover:text-ink">← All projects</Link>
      <p className="eyebrow mt-6">{p.kicker}</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight">{p.title}</h1>
      
      <div className="card mt-8 p-5">
        <p className="font-mono text-3xl font-medium text-accent">{p.metric.value}</p>
        <p className="text-sm text-muted">{p.metric.label}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {p.demo && <a href={p.demo} target="_blank" rel="noopener" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg">Live demo</a>}
        {p.repo && <a href={p.repo} target="_blank" rel="noopener" className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">Source on GitHub</a>}
      </div>

      <p className="mt-6 leading-relaxed text-muted">{p.overview}</p>
      {p.facts && (
        <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-line py-5 sm:grid-cols-3">
          {p.facts.map((f) => (
            <div key={f.k}>
              <dt className="font-mono text-xl font-medium text-accent">{f.k}</dt>
              <dd className="mt-0.5 text-xs leading-snug text-muted">{f.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {p.docs && (
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="eyebrow">Docs in the repo</span>
          {p.docs.map((d) => (
            <a key={d.href} href={d.href} target="_blank" rel="noopener" className="text-accent underline underline-offset-2">
              {d.label}
            </a>
          ))}
        </p>
      )}
      <Diagram slug={`${p.slug}:system`} />
      <Diagram slug={p.slug} />
      {p.images && (
        <div className="mt-8 space-y-6">
          {p.images.map((im) => (
            <figure key={im.src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt={im.alt} width={im.width} height={im.height} loading="lazy" className="w-full rounded-lg border border-line bg-white" />
              <figcaption className="mt-2 text-xs text-muted">{im.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {p.sections.map((sec) => (
        <section key={sec.title}>
          <h2 className="mt-12 font-serif text-2xl font-semibold">{sec.title}</h2>
          {sec.intro && <p className="mt-3 leading-relaxed text-muted">{sec.intro}</p>}
          {sec.table && <DataTable table={sec.table} />}
          {sec.items.length > 0 && (
            <ul className="mt-5 list-disc space-y-3 pl-5 leading-relaxed marker:text-accent">
              {sec.items.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
        </section>
      ))}

      {isLegal && (
        <>
          <h2 className="mt-12 font-serif text-2xl font-semibold">Results, with the caveats</h2>
          <p className="mt-3 text-muted">
            The headline number comes from 27 Federal Court of Appeal decisions dated after the model&apos;s knowledge cutoff, so memorisation cannot explain it.
            The sample is small (95% CI roughly 72 to 96%), the model is a single one, and on this set the multi-agent debate matched a single judge at about six times the cost.
            Earlier perfect scores on rebuilt packets are not reported here because they may reflect leakage.
          </p>
          <div className="mt-5"><ResultsChart rows={legalResults} /></div>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {legalFacts.map((f) => (
              <div key={f.k}>
                <dt className="font-mono text-xl text-accent">{f.k}</dt>
                <dd className="text-xs text-muted">{f.v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-12 mb-4 font-serif text-2xl font-semibold">Watch it argue a case</h2>
          <TrialReplay turns={replay} />
          <p className="mt-10 rounded-md border border-line p-4 text-sm text-muted">
            MEng research project at the University of Toronto, built on a prototype started by an earlier team and extended by me into a benchmarked system. It is not a legal decision system, not legal advice, and not a sealed evaluation.
          </p>
        </>
      )}

      <h2 className="mt-12 font-serif text-2xl font-semibold">Stack</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">{p.stack.map((s) => <span key={s} className="chip">{s}</span>)}</div>
      <ProjectNav slug={p.slug} />
    </article>
  );
}
