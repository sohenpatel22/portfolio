"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/profile";

type QA = { q: string; a: string; link?: { label: string; href: string; external?: boolean } };

const QAS: QA[] = [
  {
    q: "What roles are you looking for?",
    a: "Full-time AI / ML engineer roles where I build and evaluate LLM, agentic and applied ML systems. I am strongest where the work needs both engineering and rigorous measurement.",
    link: { label: "Email me", href: `mailto:${profile.email}`, external: true },
  },
  {
    q: "What did you build at Ontario Health?",
    a: "A Copilot Studio news agent deployed to 5,000+ employees, plus the evaluation behind it: a hand-built gold dataset, five models compared across 13+ metrics, and prompt experiments where chain-of-thought lifted F1 from 0.25 to 0.57.",
    link: { label: "See the experience", href: "/#experience" },
  },
  {
    q: "Tell me about the legal AI project",
    a: "A multi-agent system where Prosecution and Defense agents argue Federal Court of Appeal cases and a Judge predicts the outcome. It scored 88.9% on 27 post-cutoff cases against a 77.8% majority baseline, and the debate matched a single judge at about six times the cost. There is a replay demo on the page.",
    link: { label: "Open the case study", href: "/projects/legal-agents" },
  },
  {
    q: "What did you do at Deloitte?",
    a: "I led an engineering team building a six-agent system that turns a client brief into a WBS, RACI, RAID log and status report, with human review, versioned revisions and 129 automated tests.",
    link: { label: "Open the project", href: "/projects/consulting-workplan-agent" },
  },
  {
    q: "How do you evaluate LLM systems?",
    a: "Against a hand-built gold set, with recall split by confidence tier, every unmatched answer adjudicated (real, hallucinated, out of scope), bootstrap confidence intervals and a baseline to beat. I also debug the evaluator itself: I found and fixed several scoring bugs that were distorting results.",
  },
  {
    q: "Which project shows your MLOps skills?",
    a: "ASL Fingerspelling: DVC pipelines, MLflow tracking with a gated model registry, a FastAPI service with Prometheus metrics and drift monitoring, Docker, ONNX export and CI that gates on model quality. It has a live demo.",
    link: { label: "Open the project", href: "/projects/asl-fingerspelling" },
  },
  {
    q: "What is your tech stack?",
    a: "Python, PyTorch, scikit-learn, LangChain, RAG and vector databases, FastAPI, Docker, MLflow, DVC, pytest and CI/CD, with AWS and SQL for data work.",
    link: { label: "See all skills", href: "/#skills" },
  },
  {
    q: "What did you do before moving into AI?",
    a: "I was a graduate engineer at ArcelorMittal Nippon Steel India, turning SAP and project data into KPI dashboards for a plant expansion from 7 to 14 MMTPA and contributing to a 16.7% reduction in project timelines. That is where my data-analytics habits come from.",
    link: { label: "See the experience", href: "/#experience" },
  },
  {
    q: "Where did you study?",
    a: "University of Toronto (MEng in Data Analytics and Machine Learning, GPA 3.81/4.0, expected Jan 2027), after a B.E. in Mechanical Engineering from Gujarat Technological University. I am also a teaching assistant for two U of T courses.",
    link: { label: "See education", href: "/#education" },
  },
  {
    q: "Can I get your resume?",
    a: "Of course. It is a single-page PDF.",
    link: { label: "Download resume", href: profile.resume, external: true },
  },
];

type Msg = { from: "you" | "bot"; text: string; link?: QA["link"] };

export function AskChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi, I am a quick guide to Sohen's work. Pick a question below." },
  ]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs, typing, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  function ask(item: QA) {
    if (typing) return;
    setAsked((s) => new Set(s).add(item.q));
    setMsgs((m) => [...m, { from: "you", text: item.q }]);
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "bot", text: item.a, link: item.link }]);
      setTyping(false);
    }, 550);
  }

  const remaining = QAS.filter((x) => !asked.has(x.q));

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div
          role="dialog"
          aria-label="Ask about Sohen"
          className="card flex h-[min(34rem,calc(100vh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Ask about Sohen</p>
              <p className="text-xs text-muted">Pick a question</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-auto p-3 text-sm" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "you" ? "flex justify-end" : "flex"}>
                <div className={`max-w-[88%] rounded-lg px-3 py-2 leading-relaxed ${m.from === "you" ? "bg-accent text-bg" : "bg-accent-soft"}`}>
                  {m.text}
                  {m.link &&
                    (m.link.external ? (
                      <a href={m.link.href} target={m.link.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener" className="mt-2 block font-medium text-accent underline underline-offset-2">
                        {m.link.label} →
                      </a>
                    ) : (
                      <Link href={m.link.href} onClick={() => setOpen(false)} className="mt-2 block font-medium text-accent underline underline-offset-2">
                        {m.link.label} →
                      </Link>
                    ))}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex">
                <div className="flex gap-1 rounded-lg bg-accent-soft px-3 py-2.5" aria-label="Typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="max-h-40 space-y-1.5 overflow-auto border-t border-line p-3">
            {remaining.length === 0 ? (
              <p className="text-xs text-muted">
                That covers it. For anything else, email{" "}
                <a className="text-accent underline" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
                .
              </p>
            ) : (
              remaining.map((x) => (
                <button
                  key={x.q}
                  onClick={() => ask(x)}
                  disabled={typing}
                  className="block w-full rounded-full border border-line px-3 py-1.5 text-left text-xs transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {x.q}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-accent px-4 py-3 text-sm font-medium text-bg shadow-lg transition-transform hover:-translate-y-0.5"
        >
          Ask about Sohen
        </button>
      )}
    </div>
  );
}
