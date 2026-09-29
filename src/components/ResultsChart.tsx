type Row = { label: string; n: number; accuracy: number; baseline: number; cost: number };

/** Horizontal bars: accuracy vs the majority/chance baseline, with n and cost per run. */
export function ResultsChart({ rows }: { rows: Row[] }) {
  return (
    <figure className="card p-5">
      <figcaption className="mb-4 text-sm text-muted">
        Accuracy by run. The dark tick marks the majority-class baseline; a bar only counts as a win when it clears it.
      </figcaption>
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span>{r.label}</span>
              <span className="font-mono text-xs text-muted">
                n={r.n} · ${r.cost.toFixed(2)}
              </span>
            </div>
            <div
              className="relative h-6 rounded bg-line/60"
              role="img"
              aria-label={`${r.label}: ${r.accuracy}% accuracy, baseline ${r.baseline}%`}
            >
              <div className="h-full rounded bg-accent" style={{ width: `${r.accuracy}%` }} />
              <div className="absolute -inset-y-0.5 w-0.5 bg-ink" style={{ left: `${r.baseline}%` }} title={`baseline ${r.baseline}%`} />
              <span className="absolute inset-y-0 left-2 flex items-center font-mono text-xs font-medium text-bg">{r.accuracy}%</span>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
