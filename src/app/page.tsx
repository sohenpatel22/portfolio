import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { profile, stats, experience, skills, education, achievements } from "@/data/profile";
import { majorProjects, minorProjects } from "@/data/projects";
import { Counter } from "@/components/Counter";
import { ProjectExplorer, MoreLabel } from "@/components/ProjectExplorer";
import { Reveal } from "@/components/Reveal";

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-line py-16">
      <div className="container-x">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 mb-8 font-serif text-3xl font-semibold tracking-tight">{title}</h2>
        </Reveal>
        <Reveal delay={80}>{children}</Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const hasPhoto = fs.existsSync(path.join(process.cwd(), "public", "headshot.jpg"));
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    email: `mailto:${profile.email}`,
    url: "https://sohenpatel.vercel.app",
    sameAs: [profile.github, profile.linkedin],
    alumniOf: "University of Toronto",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <div className="relative overflow-hidden">
      <div className="hero-glow" aria-hidden />
      <section className="container-x pt-16 pb-14 md:pt-24">
        <div className="flex flex-col-reverse items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{profile.role} · {profile.location}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">{profile.name}</h1>
            <p className="mt-5 text-xl leading-snug">{profile.tagline}</p>
            <p className="mt-4 text-muted">{profile.summary}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={profile.resume} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg" download>
                Download resume
              </a>
              <Link href="/#projects" className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">View projects</Link>
              <a href={profile.github} target="_blank" rel="noopener" className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">GitHub</a>
              <a href={profile.linkedin} target="_blank" rel="noopener" className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">LinkedIn</a>
            </div>
          </div>
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo} alt="Portrait of Sohen Patel" width={720} height={900} fetchPriority="high" decoding="async" className="aspect-[4/5] w-56 rounded-2xl border border-line object-cover md:w-72" />
          ) : (
            <div aria-hidden className="flex aspect-[4/5] w-56 items-center justify-center rounded-2xl border border-line bg-accent-soft font-serif text-5xl text-accent md:w-72">SP</div>
          )}
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-line pt-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="font-mono text-3xl font-medium text-accent"><Counter to={s.value} suffix={s.suffix} /></dt>
              <dd className="mt-1 text-sm text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>
      </div>

      <Section id="experience" eyebrow="Experience" title="Where I have worked">
        <div className="tl-list space-y-8">
          {experience.map((e) => (
            <article key={e.org} className="tl-item grid gap-2 md:grid-cols-[14rem_1fr] md:gap-8">
              <div>
                <p className="font-mono text-xs text-muted">{e.period}</p>
                <h3 className="mt-1 font-serif text-lg font-semibold">{e.org}</h3>
                <p className="text-sm text-muted">{e.place}</p>
              </div>
              <div>
                <p className="font-medium">{e.role}</p>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-accent">
                  {e.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
                {e.more && (
                  <details className="group mt-4 rounded-lg border border-line bg-surface">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium hover:text-accent">
                      <span>More detail on how I did it</span>
                      <span aria-hidden className="font-mono text-accent transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="space-y-5 border-t border-line px-4 py-4">
                      {e.more.map((g) => (
                        <div key={g.title}>
                          <h4 className="eyebrow mb-2">{g.title}</h4>
                          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-accent">
                            {g.items.map((it) => <li key={it}>{it}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="projects" eyebrow="Selected work" title="Projects">
        <ProjectExplorer projects={majorProjects} />
        <h3 className="eyebrow mt-12 mb-3">More work</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {minorProjects.map((m) => (
            <li key={m.slug}>
              <Link href={`/projects/${m.slug}`} className="card group block p-4">
                <span className="text-sm font-medium">{m.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{m.summary}</span>
                <MoreLabel />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="skills" eyebrow="Toolbox" title="Skills">
        <div className="grid gap-6 sm:grid-cols-2">
          {skills.map((g) => (
            <div key={g.group}>
              <h3 className="mb-2 text-sm font-medium">{g.group}</h3>
              <div className="flex flex-wrap gap-1.5">{g.items.map((i) => <span key={i} className="chip">{i}</span>)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="education" eyebrow="Background" title="Education and recognition">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-5">
            {education.map((e) => (
              <div key={e.school}>
                <p className="font-mono text-xs text-muted">{e.period}</p>
                <h3 className="font-serif text-lg font-semibold">{e.school}</h3>
                <p className="text-sm">{e.degree}</p>
                <p className="mt-1 text-sm text-muted">{e.note}</p>
              </div>
            ))}
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-accent">
            {achievements.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      </Section>

      <Section id="contact" eyebrow="Contact" title="Let us talk">
        <p className="max-w-xl text-muted">I am looking for full-time AI / ML engineer roles. The fastest way to reach me is email.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`mailto:${profile.email}`} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg">{profile.email}</a>
          <a href={profile.linkedin} target="_blank" rel="noopener" className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">LinkedIn</a>
          <a href={profile.github} target="_blank" rel="noopener" className="rounded-md border border-line px-4 py-2 text-sm hover:border-accent">GitHub</a>
        </div>
      </Section>
    </>
  );
}
