"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    a: "A Copilot Studio news agent deployed to 5,000+ employees, plus the evaluation behind it: a hand-built gold dataset, five models compared across 13+ metrics, and prompt experiments where chain-of-thought lifted the agent's F1 from 0.25 to 0.42.",
    link: { label: "See the experience", href: "/#experience" },
  },
  {
    q: "Tell me about the legal AI project",
    a: "A multi-agent system where Prosecution and Defense agents argue Federal Court of Appeal cases and a Judge predicts the outcome. It scored 88.9% on 27 post-cutoff cases against a 77.8% majority baseline, and the debate matched a single judge at about six times the cost. There is a replay demo on the page.",
    link: { label: "Open the case study", href: "/projects/legal-agents" },
  },
  {
    q: "What was your Deloitte project?",
    a: "In a Deloitte-sponsored practicum, I led a student team building a six-agent system that turns a client brief into a WBS, RACI, RAID log and status report, with human review, versioned revisions and 129 automated tests.",
    link: { label: "Open the project", href: "/projects/consulting-workplan-agent" },
  },
  {
    q: "Tell me about the Market Research Agent",
    a: "A LangGraph agent that answers questions about five large-cap companies from SEC filings, trained volatility forecasts and database lookups. A judge model verifies each answer against its sources and triggers a bounded retry. It reached 0.95 faithfulness on a 99-question golden set at about $0.0013 per question; retrieval was ablated (a cross-encoder reranker lifted NDCG@6 from 0.44 to 0.56) and four models were compared on cost per correct answer. The case study covers the architecture, forecasting models, evaluation, CI and honest limitations.",
    link: { label: "Open the case study", href: "/projects/market-research-agent" },
  },
  {
    q: "Tell me about the ASL fingerspelling project",
    a: "A Conformer-Transformer that turns video of ASL fingerspelling into text, scored on 14 signers it never saw (test CER 0.307; the first deployed model was 0.334). The error analysis found that it fails by making text up when MediaPipe cannot see the hands, so I added a confidence rule that flags 40% of clips and catches 98.6% of the badly failed ones. I also tried six accuracy ideas and a from-scratch retraining that did not beat it, and reported that. Around it: DVC, MLflow with a gated registry, a monitored FastAPI service, ONNX (1.6x faster), CI with a metric gate and a free live demo.",
    link: { label: "Open the case study", href: "/projects/asl-fingerspelling" },
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

type Msg = { from: "you" | "bot"; text: string; link?: QA["link"]; ai?: boolean };

const MAX_Q = 280;

const ERRORS: Record<number, string> = {
  429: "You have used your typed questions for today. The preset questions still work, or email me.",
  503: "AI answers are paused right now. The preset questions still work, or email me.",
  400: "Please keep your question under 280 characters.",
  403: "That request was blocked. Please use the chat on the site itself.",
};

// Section links ("/#skills") on the home page are scrolled to by hand, because Next loses the
// scroll when the chat panel closes during the same click. Other links are normal.
function ChatLink({ href, onNavigate, className, children }: { href: string; onNavigate: () => void; className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const sameHome = pathname === "/" && href.startsWith("/#");
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        onNavigate();
        if (!sameHome) return;
        e.preventDefault();
        const id = href.slice(2);
        // Let the panel close first.
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
          history.pushState(null, "", href);
        }, 60);
      }}
    >
      {children}
    </Link>
  );
}

/** Turns paths like /projects/legal-agents or /#experience in an answer into links. */
function Linkified({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const parts = text.split(/((?<![\w/.:-])\/projects\/[a-z0-9-]+|(?<![\w/.:-])\/#[a-z]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\/(projects\/|#)/.test(part) ? (
          <ChatLink key={i} href={part} onNavigate={onNavigate} className="font-medium text-accent underline underline-offset-2">
            {part}
          </ChatLink>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function AskChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi, I am a quick guide to Sohen's work. Pick a question below." },
  ]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const checked = useRef(false);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs, typing, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Ask once whether to show the text box. This call is free.
  useEffect(() => {
    if (!open || checked.current) return;
    checked.current = true;
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((d: { enabled?: boolean }) => setAiEnabled(Boolean(d.enabled)))
      .catch(() => setAiEnabled(false));
  }, [open]);

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

  async function askAi(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || typing || q.length > MAX_Q) return;
    setInput("");
    // A typed question that matches a preset gets the stored answer, with no model call.
    const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const preset = QAS.find((x) => norm(x.q) === norm(q));
    if (preset) return ask(preset);
    const history = [...msgs, { from: "you" as const, text: q }]
      .filter((m) => m.from === "you" || m.ai)
      .slice(-4)
      .map((m) => ({ role: m.from === "you" ? "user" : "assistant", content: m.text }));
    setMsgs((m) => [...m, { from: "you", text: q }]);
    setTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        let msg = ERRORS[res.status] ?? "Something went wrong. Please try again, or use the preset questions.";
        if (res.status === 429) {
          const d = (await res.json().catch(() => ({}))) as { reason?: string };
          if (d.reason === "global_daily") msg = "Today's AI question budget has been used up. The preset questions still work, or email me.";
        }
        if (res.status === 503) {
          const d = (await res.clone().json().catch(() => ({}))) as { error?: string };
          if (d.error === "busy") msg = "The AI is busy right now. Please try again in a little while, or use the preset questions.";
          else setAiEnabled(false);
        }
        setMsgs((m) => [...m, { from: "bot", text: msg }]);
        return;
      }
      setMsgs((m) => [...m, { from: "bot", text: "", ai: true }]);
      setTyping(false);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { from: "bot", text: acc, ai: true }]);
      }
      if (!acc.trim()) {
        setMsgs((m) => [...m.slice(0, -1), { from: "bot", text: "I could not produce an answer. Please try rephrasing, or use the preset questions." }]);
      }
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Something went wrong. Please try again, or use the preset questions." }]);
    } finally {
      setTyping(false);
    }
  }

  const remaining = QAS.filter((x) => !asked.has(x.q));

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div
          role="dialog"
          aria-label="Ask about Sohen"
          className="card flex h-[min(36rem,calc(100vh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium">Ask about Sohen</p>
              <p className="text-xs text-muted">{aiEnabled ? "Pick a question or type your own" : "Pick a question"}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-ink">
              ✕
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-auto p-3 text-sm" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "you" ? "flex justify-end" : "flex"}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 leading-relaxed ${m.from === "you" ? "bg-accent text-bg" : "bg-accent-soft"}`}>
                  {m.from === "bot" ? <Linkified text={m.text} onNavigate={() => setOpen(false)} /> : m.text}
                  {m.link &&
                    (m.link.external ? (
                      <a href={m.link.href} target={m.link.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener" className="mt-2 block font-medium text-accent underline underline-offset-2">
                        {m.link.label} →
                      </a>
                    ) : (
                      <ChatLink href={m.link.href} onNavigate={() => setOpen(false)} className="mt-2 block font-medium text-accent underline underline-offset-2">
                        {m.link.label} →
                      </ChatLink>
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
          <div className="max-h-32 space-y-1.5 overflow-auto border-t border-line p-3">
            {remaining.length === 0 ? (
              <p className="text-xs text-muted">
                That covers the presets. For anything else, email{" "}
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
          {aiEnabled && (
            <form onSubmit={askAi} className="border-t border-line p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_Q))}
                  maxLength={MAX_Q}
                  placeholder="Ask your own question…"
                  aria-label="Ask your own question"
                  className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={typing || !input.trim()}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted">
                Typed questions are answered by an AI model from this site&apos;s content and can be wrong. Please do not share personal information.
              </p>
            </form>
          )}
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
