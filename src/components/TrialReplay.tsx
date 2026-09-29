"use client";
import { useEffect, useState } from "react";
import type { ReplayTurn } from "@/data/legal";

const LABEL = { prosecution: "Prosecution", defense: "Defense", judge: "Judge" } as const;

export function TrialReplay({ turns }: { turns: ReplayTurn[] }) {
  const [turn, setTurn] = useState(-1);
  const [chars, setChars] = useState(0);
  const [running, setRunning] = useState(false);

  // Type out the current turn; when finished, pause briefly and advance.
  useEffect(() => {
    if (!running || turn < 0) return;
    const full = turns[turn].text.length;
    if (chars < full) {
      const id = setTimeout(() => setChars((c) => Math.min(c + 4, full)), 16);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      if (turn + 1 < turns.length) {
        setTurn(turn + 1);
        setChars(0);
      } else setRunning(false);
    }, 700);
    return () => clearTimeout(id);
  }, [chars, turn, running, turns]);

  function start() {
    setTurn(0);
    setChars(0);
    setRunning(true);
  }
  function skip() {
    setTurn(turns.length - 1);
    setChars(turns[turns.length - 1].text.length);
    setRunning(false);
  }

  const done = !running && turn === turns.length - 1;
  return (
    <div className="card p-5" aria-live="polite">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="eyebrow">Trial replay</span>
          <p className="text-sm text-muted">Condensed from a real benchmark run (post-cutoff case PC_001). No live model call.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={start} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg">
            {turn < 0 ? "Play trial" : "Replay"}
          </button>
          {turn >= 0 && !done && (
            <button onClick={skip} className="rounded-md border border-line px-3 py-1.5 text-sm">
              Skip to verdict
            </button>
          )}
        </div>
      </div>
      {turn < 0 && (
        <p className="py-8 text-center text-sm text-muted">Press play to watch the agents argue a Federal Court of Appeal case.</p>
      )}
      <div className="space-y-3">
        {turns.slice(0, turn + 1).map((t, i) => {
          const text = i === turn ? t.text.slice(0, chars) : t.text;
          return (
            <div key={i} className={`rounded-lg border p-4 ${t.role === "judge" ? "border-accent bg-accent-soft" : "border-line"}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wide text-accent">{LABEL[t.role]}</span>
                <span className="text-xs text-muted">{t.title}</span>
              </div>
              <p className="text-sm leading-relaxed">
                {text}
                {i === turn && running && chars < t.text.length && <span className="ml-0.5 animate-pulse">▍</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
