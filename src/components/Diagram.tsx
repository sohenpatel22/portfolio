const DIAGRAMS: Record<string, { title: string; stages: { label: string; sub?: string; accent?: boolean }[][] }> = {
  "legal-agents": {
    title: "One trial, end to end",
    stages: [
      [{ label: "Case packet", sub: "facts + relief" }],
      [{ label: "Hybrid retrieval", sub: "BM25 + Qdrant, RRF" }],
      [
        { label: "Prosecution agent", sub: "argues for moving party" },
        { label: "Defense agent", sub: "argues for responding party" },
      ],
      [{ label: "Judge agent", sub: "weighs both sides", accent: true }],
      [{ label: "Verdict + confidence", sub: "scored vs baseline", accent: true }],
    ],
  },
  "market-research-agent:system": {
    title: "System overview",
    stages: [
      [{ label: "SEC EDGAR", sub: "10-K and 10-Q filings" }, { label: "yfinance", sub: "prices + fundamentals" }],
      [{ label: "Ingest", sub: "chunk by Item, local embeddings, DVC" }],
      [{ label: "PostgreSQL + pgvector", sub: "chunks, prices, forecasts" }],
      [{ label: "LangGraph agent", sub: "route, gather, generate, grade", accent: true }],
      [
        { label: "FastAPI + SSE" },
        { label: "Gradio UI" },
        { label: "MCP server" },
        { label: "Power BI" },
      ],
    ],
  },
  "market-research-agent": {
    title: "One question, with a verification loop",
    stages: [
      [{ label: "Question", sub: "refused if out of scope" }],
      [{ label: "Route", sub: "pick tools" }],
      [
        { label: "Hybrid filing search", sub: "RRF + cross-encoder" },
        { label: "Forecast models", sub: "LSTM vs HAR-RV" },
        { label: "SQL lookups", sub: "whitelisted, read-only" },
      ],
      [{ label: "Generate", sub: "cited draft" }],
      [{ label: "Grade", sub: "retry with rewritten query", accent: true }],
      [{ label: "Verified answer", sub: "citations checked", accent: true }],
    ],
  },
  "asl-fingerspelling": {
    title: "From video to text",
    stages: [
      [{ label: "Video" }],
      [{ label: "MediaPipe", sub: "84 landmark values / frame" }],
      [{ label: "Normalise", sub: "wrist-centre, 64 frames" }],
      [{ label: "Conformer encoder" }],
      [{ label: "Transformer decoder", sub: "beam search" }],
      [{ label: "Text", accent: true }],
    ],
  },
  "consulting-workplan-agent": {
    title: "Brief to deliverables",
    stages: [
      [{ label: "Client brief" }],
      [{ label: "Brief parser", sub: "confirm open questions" }],
      [
        { label: "WBS agent" },
        { label: "RACI agent" },
        { label: "RAID agent" },
      ],
      [{ label: "Validators", sub: "cross-artifact checks", accent: true }],
      [{ label: "Human review", sub: "revise + version" }],
      [{ label: "DOCX / XLSX export", accent: true }],
    ],
  },
  "two-stage-recsys": {
    title: "Retrieve, then rank",
    stages: [
      [{ label: "All movies", sub: "1,682" }],
      [{ label: "Two-Tower retrieval", sub: "InfoNCE + hard negatives" }],
      [{ label: "200 candidates / user" }],
      [{ label: "MF ranker", sub: "LambdaRank fine-tune", accent: true }],
      [{ label: "Top-10", accent: true }],
    ],
  },
};

export function hasDiagram(slug: string) {
  return slug in DIAGRAMS;
}

export function Diagram({ slug }: { slug: string }) {
  const d = DIAGRAMS[slug];
  if (!d) return null;
  return (
    <figure className="flow-fig card mt-10 p-5">
      <figcaption className="eyebrow mb-4">{d.title}</figcaption>
      <div className="flow-row">
        {d.stages.map((stage, i) => (
          <div key={i} className="flow-step">
            {i > 0 && <span className="flow-line" aria-hidden />}
            <div className="flow-stage">
              {stage.map((n) => (
                <div key={n.label} className={`flow-node ${n.accent ? "accent" : ""}`}>
                  <div className="font-medium">{n.label}</div>
                  {n.sub && <div className="mt-0.5 text-xs text-muted">{n.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
