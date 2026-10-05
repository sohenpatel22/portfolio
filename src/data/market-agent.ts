import type { Project } from "./projects";

const GH = "https://github.com/sohenpatel22/market_research_AI_agent";
const blob = (p: string) => `${GH}/blob/master/${p}`;

export const marketResearchAgent: Project = {
  slug: "market-research-agent",
  tier: "major",
  title: "Market Research Agent: Agentic RAG over SEC Filings",
  kicker: "LangGraph · RAG · forecasting · LLMOps",
  summary:
    "A research assistant that answers questions about five large-cap companies by combining SEC filing text, trained volatility forecasts and database lookups. Every answer is cited, a judge model verifies it before it is shown, and every quality claim is measured on a 99-question golden set.",
  overview:
    "Most RAG demos stop at 'it answers'. I built this one the way I would want a production assistant to behave: it refuses what it should not do, shows its evidence, checks its own answer and retries when the evidence is weak, and tells the user when it could not verify something. I then measured each design choice instead of assuming it: retrieval was ablated, four language models were compared on cost per correct answer, and the forecasting models were tested against honest baselines, including where they lose. It was built solo over six weeks (244 commits, 130 tests) with architecture decision records, CI and a documented deployment path.",
  metric: { value: "0.95", label: "RAGAS faithfulness on a 99-question golden set, at about $0.0013 per question" },
  tags: ["LLM / Agents", "RAG", "Evaluation", "MLOps", "Time series"],
  stack: [
    "Python", "LangGraph", "LangChain", "PostgreSQL", "pgvector", "PyTorch", "scikit-learn", "FastAPI", "Gradio",
    "Langfuse", "RAGAS", "DeepEval", "MLflow", "DVC", "Docker", "GitHub Actions", "MCP", "Power BI",
  ],
  repo: GH,
  facts: [
    { k: "244", v: "commits over six weeks, built solo" },
    { k: "130", v: "automated tests plus a paid quality gate in CI" },
    { k: "99", v: "golden questions in 8 categories" },
    { k: "5.4k", v: "filing chunks in one Postgres database" },
    { k: "$0.0013", v: "average cost per answered question" },
    { k: "6", v: "architecture decision records" },
  ],
  docs: [
    { label: "Architecture", href: blob("docs/architecture.md") },
    { label: "Model card", href: blob("docs/model-card.md") },
    { label: "Decision records", href: `${GH}/tree/master/docs/adr` },
    { label: "Power BI recipe", href: blob("docs/power-bi.md") },
    { label: "Deployment guides", href: blob("docs/oracle-deploy.md") },
  ],
  images: [
    {
      src: "/projects/market-research-agent/ui-chat.jpg",
      alt: "Ask tab showing a cited answer about NVIDIA export controls with a volatility forecast and a quality check",
      caption: "Ask tab: a cited answer, the model forecast next to its baseline, and the grader's quality verdict.",
      width: 800,
      height: 633,
    },
    {
      src: "/projects/market-research-agent/ui-forecast.jpg",
      alt: "Forecast tab showing price, realized volatility and the LSTM and HAR forecasts",
      caption: "Forecast tab: realized volatility with the LSTM forecast and the HAR baseline it has to beat.",
      width: 800,
      height: 633,
    },
    {
      src: "/projects/market-research-agent/provider-frontier.png",
      alt: "Chart of answer quality against cost per question for four language models",
      caption: "Quality versus cost across four models on the same 69 questions.",
      width: 1125,
      height: 675,
    },
  ],
  sections: [
    {
      title: "The problem and the scope",
      intro:
        "A financial analyst asking 'what supply chain risks does Apple report, and what is the model's volatility outlook?' needs two kinds of evidence at once: text from regulatory filings and a number from a model. A plain chatbot invents both. The goal was an assistant whose every claim can be traced back to a filing excerpt, a database row or a model output, and which says so when it cannot.",
      items: [
        "Coverage: five large-cap companies (AAPL, MSFT, NVDA, JPM, XOM), their most recent 10-K and 10-Q filings, about ten years of daily prices and quarterly fundamentals.",
        "Question types it handles: what a company says in its filings, price and fundamentals lookups, near-term volatility and direction forecasts, comparisons across companies, and questions that mix these.",
        "Question types it refuses: trades, personalised financial advice, and attempts to override its instructions. These are refused at the first step, before any tool runs.",
        "Positioning: research and education only. The interface and every forecast say it is not investment advice.",
      ],
    },
    {
      title: "How one question flows through the agent",
      intro:
        "The agent is a fixed LangGraph state machine rather than a free-running tool-calling loop, so cost and latency are bounded and the behaviour is testable with fake models.",
      items: [
        "Route: an LLM returns a validated decision (intent, tickers, which tools to use, a standalone search query). Out-of-scope requests go straight to a refusal. If routing itself fails, the agent falls back to a plain filings search instead of crashing.",
        "Gather: runs the chosen tools. Filing search runs on every pass; forecasts and database lookups run once per question, not once per retry. If a question names several companies, each company is searched separately and the results are interleaved, so a comparison cannot be answered from one company's text alone. Tool failures are recorded and shown, never hidden.",
        "Generate: drafts a structured answer using only the retrieved excerpts, forecasts and rows, citing sources by number.",
        "Grade: a separate judge model checks the draft against the same evidence and returns whether it is grounded, whether it is relevant, and a 0 to 1 score. An answer passes only if it is both grounded and relevant and scores at least 0.7. If the grader itself fails, the answer is marked unverified rather than passed.",
        "Rewrite and retry: on failure, the grader's feedback is used to write a better search query and the agent gathers again, at most twice, with LangGraph's recursion limit as a second guard.",
        "Finalize: citations are verified against what was actually retrieved (hallucinated source numbers are dropped), excerpts are sanitised, and the answer is returned with its forecasts, data, retry count and a quality flag.",
        "Every step returns a validated Pydantic object through structured output; if a model replies in plain text instead of calling the schema function, the call is retried with a changed prompt.",
      ],
    },
    {
      title: "The three tools",
      table: {
        columns: ["Tool", "What it does", "How it is kept safe"],
        rows: [
          ["Filing search", "Hybrid vector and keyword search over filing chunks, then cross-encoder reranking", "Excerpts are treated as untrusted data: injection-looking lines are stripped, length is capped, and text is wrapped in tags the prompt marks as data"],
          ["Forecaster", "A pooled LSTM for next-week volatility and a classifier for roughly one-month direction", "Loads a versioned model bundle; unseen tickers are rejected, not extrapolated; every output states the horizon and uncertainty"],
          ["Database lookups", "Latest price, price change over N days, and fundamentals by metric name", "The model never writes SQL. It picks one of three whitelisted, parameterised queries, run in a read-only transaction, with ticker and metric names validated and LIKE wildcards escaped"],
        ],
      },
      items: [],
    },
    {
      title: "Data pipeline",
      items: [
        "Sources: yfinance for prices and fundamentals; SEC EDGAR for filings, with the descriptive User-Agent the SEC requires and throttled requests to stay under its fair-access limit.",
        "Chunking: filings are split by their 'Item' headings (table-of-contents lines are merged away) so a chunk knows which section it came from, then cut into 1,000-character pieces with 150 characters of overlap. The result is about 5,400 chunks.",
        "Embeddings: computed locally with a Hugging Face model (BAAI/bge-small-en-v1.5, 384 dimensions), so no external embedding API is needed.",
        "Storage: one PostgreSQL database with pgvector holds prices, fundamentals (stored long and tidy because the metrics vary by company) and the document chunks, with an HNSW index for vectors and a full-text index for keywords.",
        "Reliability: every insert is idempotent, every raw response is cached so re-runs do not hit the sources, and raw data is versioned with DVC. A weekly workflow re-runs ingestion against the production database (Neon).",
        "A lesson from the first production seed: serverless databases drop idle connections, so ingestion keeps transactions short, disables prepared statements behind the connection pooler and normalises connection URLs.",
      ],
    },
    {
      title: "Retrieval, measured instead of assumed",
      intro:
        "Dense and keyword search results are fused with reciprocal rank fusion, then a cross-encoder rereads the top candidates. I tested whether each part earns its place on the 50 single-company filing questions, with no LLM calls involved.",
      table: {
        columns: ["Retriever", "NDCG@6", "Recall@6", "MRR"],
        rows: [
          ["Dense only", "0.461", "0.780", "0.577"],
          ["Keyword only", "0.284", "0.520", "0.355"],
          ["Hybrid (RRF)", "0.439", "0.740", "0.571"],
          ["Hybrid + cross-encoder rerank", "0.559", "0.820", "0.745"],
        ],
      },
      items: [
        "The finding that surprised me: plain hybrid slightly trailed dense-only on this data, because the keyword leg alone is weak on filing prose. The reranker is what pays off (+0.12 NDCG@6), so it is on by default. The ordering was identical on the original 23 questions.",
        "Down-weighting the keyword leg helped un-reranked hybrid but not the reranked pipeline, so I kept standard equal-weight fusion.",
        "Caveat I state in the repo: 50 questions make the gaps clearer but I did not significance-test them.",
      ],
    },
    {
      title: "Forecasting models, including where they lose",
      intro:
        "The agent calls trained models for near-term outlook questions. They are small and evaluated strictly: one chronological 70/15/15 split shared by all tickers, with the last 5 (volatility) or 21 (direction) days of train and validation purged so overlapping forward-looking targets cannot leak across a boundary.",
      table: {
        caption: "Next-week volatility, test set (most recent 15% of dates)",
        columns: ["Model", "RMSE (vol)", "QLIKE (lower is better)"],
        rows: [
          ["Pooled LSTM", "0.0840", "0.202"],
          ["HAR-RV", "0.0890", "0.223"],
          ["ARIMA(1,0,1)", "0.0885", "0.239"],
          ["Persistence", "0.1062", "0.288"],
          ["GARCH(1,1)-t", "0.0991", "0.311"],
        ],
      },
      items: [
        "Target: log annualised volatility over the next five trading days, estimated from daily highs and lows with the Parkinson estimator. Features are daily, weekly and monthly log volatility plus returns, standardised per ticker using training rows only.",
        "The LSTM is deliberately small (22-day window, 32 hidden units, one layer), trained with Adam and early stopping on validation loss. Because forecast errors overlap, significance uses a Diebold-Mariano test with Newey-West errors: the LSTM beats the HAR-RV baseline with p = 0.001.",
        "It does not win everywhere. Skill against HAR by ticker: AAPL +7.7%, JPM +8.6%, MSFT +6.2%, NVDA +2.2%, and XOM -5.1%, where the simple baseline is better. The model card says so.",
        "The direction classifier (momentum, volatility, drawdown, volume and RSI features) is weak: test ROC-AUC 0.62 and accuracy 0.55, below the 0.65 always-up base rate. I kept it, labelled it as weak in the interface, and do not present it as a signal.",
        "Operations: models are tracked in MLflow and saved as versioned bundles. A monthly workflow runs a walk-forward check: it holds out the latest 60 trading days, trains a challenger on the data before them, scores both on those days, and opens a pull request only if the challenger improves by more than 2%. It also compares the current model's holdout error with its original test error as a drift signal, and costs no LLM calls.",
        "Forecasts and an out-of-sample volatility backtest are published back to Postgres so a Power BI dashboard can chart them.",
      ],
    },
    {
      title: "Evaluation designed so it can fail",
      intro:
        "LLM judges are useful but noisy and cost money, while some behaviours can be checked exactly. So evaluation has layers, all driven by one thresholds file.",
      table: {
        caption: "The 99-question golden set",
        columns: ["Category", "n", "What it tests"],
        rows: [
          ["Single-company filings", "50", "Answers from one company's text; drafted by an LLM from sampled chunks, so the true source is known, then hand-curated"],
          ["Comparisons", "6", "Must cite every company named"],
          ["Mixed", "4", "Filing text plus a forecast and/or a lookup in one question"],
          ["Forecast", "10", "The right model for the right ticker and horizon, with honest framing"],
          ["Data lookups", "10", "Prices and fundamentals checked against database snapshots"],
          ["Unanswerable", "7", "A 1999 revenue figure, a Mars colony, a company not covered: the right behaviour is to say so"],
          ["Out of scope", "7", "Trades and personal advice must be refused"],
          ["Adversarial", "5", "Injection and key-extraction attempts must be refused"],
        ],
      },
      items: [
        "Layer 1, free and exact: refusals happen exactly when expected, the forecast and database tools were actually called, numeric facts from the database appear in the answer (tolerating '$90.0 billion' versus '90,007,000,000'), and citations are present.",
        "Layer 2, run deliberately: RAGAS faithfulness, answer relevancy, context precision and context recall on the filing questions, with cost and latency per run.",
        "Layer 3, in CI: a DeepEval faithfulness and relevancy gate on six items against a small committed corpus, so it works on an empty database and skips itself when no API key is present.",
        "The first 38 questions were frozen when the set grew to 99, so earlier results stay comparable.",
      ],
    },
    {
      title: "Results, and what the expanded set exposed",
      table: {
        caption: "Baseline: DeepSeek agent, reranker on, cache off, n = 99",
        columns: ["Metric", "Result"],
        rows: [
          ["Faithfulness", "0.95"],
          ["Answer relevancy", "0.86"],
          ["Context precision", "0.83"],
          ["Context recall", "0.92"],
          ["Refusals, forecast and SQL tool use, numeric facts", "100%"],
          ["Unanswerable questions handled honestly", "7 of 7"],
          ["Latency", "4.3 s median, 12.4 s at p95"],
          ["Cost and size", "about $0.0013 and 4.7k tokens per question"],
        ],
      },
      items: [
        "Cross-company comparisons were the weak spot: only 4 of 6 cited both companies, because all six retrieved excerpts came from one company and the agent said it could not compare. I fixed it by searching each company separately and interleaving the results (rate 0.67 to 1.0 on a re-run).",
        "Other failures I found and kept in the record: one answer with no citation (retrieval returned only XBRL tables for an XOM question) and one forecast question that ended in 'I could not produce a valid answer' after two retries because the provider returned no usable structured output.",
        "The abstention check is a regex heuristic, so the unanswerable answers were also read by hand.",
        "DeepEval's relevancy score is coarse: the same correct answer scored between 0.45 and 1.0 across runs. I set the CI threshold to 0.55 and wrote the reason next to it, and use RAGAS answer relevancy as the finer measure.",
      ],
    },
    {
      title: "Choosing the model by cost per correct answer",
      table: {
        caption: "Same agent code, same 69 questions, one run per model, cache off",
        columns: ["Model", "$ / question", "Faithfulness", "Answer relevancy", "Context recall", "Numeric facts", "Cited", "False refusals", "p50"],
        rows: [
          ["DeepSeek (default)", "0.0008", "0.908", "0.820", "0.883", "100%", "100%", "0", "4.2 s"],
          ["GPT-4o mini", "0.0005", "0.826", "0.876", "0.969", "90%", "87%", "4", "4.6 s"],
          ["Claude Haiku 4.5", "0.0045", "0.934", "0.890", "0.842", "100%", "97%", "1", "3.9 s"],
          ["Claude Sonnet 5.5", "0.0111", "0.916", "0.797", "0.900", "100%", "100%", "0", "6.9 s"],
        ],
      },
      items: [
        "The cheapest model was not the best outcome: GPT-4o mini wrongly refused four legitimate filing questions, which also cost it citations, and picked a stale quarter for one lookup. Cost per correct answer, not per call, is the number that matters.",
        "Paying more did not buy faithfulness here: Sonnet 5.5 cost about 14 times DeepSeek for the same faithfulness (0.916 versus 0.908), and Haiku 4.5 cost about 5.6 times for +0.026, within noise. DeepSeek stayed the default.",
        "The judge is a separate model (and configurable), so the model under test is not grading itself. The whole comparison cost about $1.40.",
        "Caveats stated in the repo: one run per model, RAGAS on only 20 filing questions, so gaps of a few hundredths are noise; the judge is DeepSeek, which may favour its own phrasing and was not tested for that; prices are list prices from 2 October 2026.",
      ],
    },
    {
      title: "Observability and cost control",
      items: [
        "Every question is one Langfuse trace: route, tool calls and every LLM call with tokens, cost and latency, tagged with provider, model and git commit, plus scores for quality passed, grade, retries, refusal and tool errors. With no keys configured it is a no-op, so tests, CI and forks need no Langfuse.",
        "Prompts can be synced to Langfuse's prompt registry and loaded from there, falling back to the local text if the registry is unreachable or an edit changes the template variables.",
        "Cost levers: one inexpensive model for both agent and judge by default, an on-disk cache of identical LLM calls so re-running evaluations is free, retries capped at two, and non-query-dependent tools run once. A typical question is about 5k tokens and a refusal about 1k.",
        "Tracing is thread-bound, so streamed requests run entirely on one worker thread.",
      ],
    },
    {
      title: "Serving and integrations",
      table: {
        columns: ["Endpoint", "Purpose"],
        rows: [
          ["POST /chat", "Ask a question; returns a validated answer object with citations, forecasts, data, the quality verdict and a trace link"],
          ["POST /chat/stream", "The same as server-sent events: one event per agent step (route, gather, generate, grade, rewrite), then a final event or an error"],
          ["POST /forecast", "Run the trained models for a ticker and horizon"],
          ["GET /tickers, /health", "Supported tickers and model version; database, model, LLM key and Langfuse status (ok or degraded)"],
        ],
      },
      items: [
        "Request bodies are validated (question length, ticker pattern, horizon). Blocking work runs in a thread pool so the event loop is never blocked. The agent runtime is built lazily, so /health and /forecast work with no LLM key, and a missing key is a clean 503 rather than a stack trace.",
        "A per-client sliding-window rate limit (30 requests a minute by default) protects the paid model; error responses never include internal details. The limiter is in-memory, which is enough for a single-process demo and is listed as a limitation.",
        "A Gradio interface sits on the same code path: a live progress checklist with a sources table, a Plotly forecast chart, and market-data charts.",
        "An MCP server exposes filing search, forecasts, market-data lookups and the full agent to any MCP client such as Claude Desktop.",
        "A Power BI recipe covers the connection, data model, DAX measures and three dashboard pages over the published forecasts, backtest and SQL views.",
      ],
    },
    {
      title: "Engineering and delivery",
      table: {
        columns: ["Workflow", "Trigger", "What it does"],
        rows: [
          ["CI: lint and test", "Every push and pull request", "Lints and runs the 130 tests with coverage; none of them need a paid API"],
          ["CI: DeepEval gate", "Every push and pull request", "Runs the quality gate on six golden items, caching the embedding and reranker models; skips itself without a key"],
          ["CI: Docker build", "Every push and pull request", "Builds the runtime image, checks it runs as a non-root user, then starts the container against a Postgres service and asserts /health, the UI and request validation"],
          ["Seed database", "Weekly and on demand", "Runs ingestion against the production database and refreshes published forecasts"],
          ["Retrain", "Monthly and on demand", "Walk-forward check; opens a pull request with the new bundle only if warranted"],
          ["Deploy", "Manual", "Hugging Face Space deploy with a live smoke test; an arm64 build to an Oracle Cloud VM through GitHub Container Registry"],
        ],
      },
      items: [
        "The Docker image is multi-stage: dependencies from a lockfile, CPU-only PyTorch, no compilers or training libraries in the runtime stage, both models baked in so it starts offline, a non-root user (UID 1000), a health check, and no secrets in any layer.",
        "Secrets live only in the CI and runtime environment, and values pasted from .env files into CI secrets are cleaned of stray quotes (a bug I hit and fixed with a test).",
        "Six short architecture decision records document the trade-offs below, written when each decision was made.",
      ],
    },
    {
      title: "Design decisions I would defend",
      table: {
        columns: ["Decision", "Why", "Trade-off accepted"],
        rows: [
          ["Bounded grade-and-retry loop, not a free-running agent", "Cost, latency and tests stay predictable; a weak answer is flagged instead of confidently wrong", "Every question pays for at least one extra grading call"],
          ["Hybrid retrieval with a cross-encoder", "Measured: rerank was the real win, plain hybrid was not", "A 90 MB model and some CPU latency"],
          ["Provider-agnostic model layer", "Not locked to one vendor; judge can differ from the agent", "Structured output differs per provider, handled with retries"],
          ["Layered evaluation", "Cheap exact checks catch what noisy judges miss; CI gate stays low-cost", "A small golden set catches regressions but cannot rank models finely"],
          ["Postgres for everything", "Vectors, keywords, tables and BI views in one service to run and secure", "A much larger corpus would need a dedicated vector store"],
          ["Deployment kept separate from the app", "Platform limits changed without touching the application", "No public demo yet"],
        ],
      },
      items: [],
    },
    {
      title: "Limits I state openly",
      items: [
        "Five tickers and one market regime: no crisis or regime-shift testing beyond what ten years of data contain. Unseen tickers are rejected, not extrapolated.",
        "The direction model is weak and the volatility model loses on XOM. Outputs are statistical estimates, not trading signals, with no transaction costs or portfolio construction.",
        "The golden set was drafted by an LLM and curated by one person (me). Ninety-nine items catches regressions but is not enough to claim fine-grained accuracy differences, and a second labeller is on the to-do list.",
        "Only DeepSeek has been fully evaluated with RAGAS on the whole set; the other providers were compared on a 69-question subset with one run each.",
        "Public hosting is not live yet. The production database, deployment workflows (Hugging Face Space and an Oracle Cloud Always Free VM) and container image exist; the Space could not start because the current account plan has no managed CPU hardware for Docker Spaces. It runs end to end locally with one command.",
      ],
    },
    {
      title: "What I learned, and what I would do next",
      items: [
        "A grader that can say 'this answer isn't supported' is worth more than a clever generator: surfacing the quality flag to the user changed how the product behaves, not just how it scores.",
        "Measure before believing. Hybrid retrieval trailed dense-only until the reranker, and the LSTM beats the baseline overall but not for every ticker.",
        "Noisy LLM-judge metrics need calibrated thresholds with the reason written down, and cheap deterministic checks catch what judges miss.",
        "Next: enlarge the golden set with a second labeller and multi-turn questions, run the provider comparison on the full set for OpenAI and Anthropic, add distribution-level drift monitoring and more tickers, and publish a hosted demo with authentication.",
      ],
    },
  ],
};
