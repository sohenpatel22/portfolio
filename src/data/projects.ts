export type Section = { title: string; items: string[] };

export type Project = {
  slug: string;
  tier: "major" | "minor";
  title: string;
  kicker: string;
  /** One or two sentences for cards. */
  summary: string;
  /** Longer framing shown at the top of the project page. */
  overview: string;
  metric: { value: string; label: string };
  tags: string[];
  stack: string[];
  sections: Section[];
  repo?: string;
  demo?: string;
  images?: { src: string; alt: string; caption: string; width: number; height: number }[];
};

export const projects: Project[] = [
  {
    slug: "legal-agents",
    tier: "major",
    title: "Multi-Agent Legal Reasoning System",
    kicker: "MEng research project · University of Toronto",
    summary:
      "Prosecution and Defense agents argue Federal Court of Appeal cases against retrieved precedent, and a Judge predicts the outcome. The interesting part is the evaluation harness that keeps every claim honest.",
    overview:
      "I inherited a working prototype of an adversarial legal-trial pipeline from an earlier cohort and turned it into something measurable. The question I care about is not whether the agents produce fluent arguments, it is whether the verdicts beat a naive baseline on cases the model could not have memorised, and what that costs.",
    metric: { value: "88.9%", label: "accuracy on 27 post-cutoff cases (always-predict-majority: 77.8%)" },
    tags: ["LLM / Agents", "RAG", "Evaluation", "MLOps"],
    stack: ["Python", "Claude Opus", "LangChain", "Qdrant", "BM25 + RRF", "FastAPI", "Next.js", "Langfuse", "DSPy", "pytest"],
    sections: [
      {
        title: "How the system works",
        items: [
          "A Prosecution agent and a Defense agent each argue a Federal Court of Appeal proceeding from a structured case packet. A Judge agent reads both, returns a binary verdict (moving party succeeds or fails), a confidence score, key evidence for and against, and unresolved issues. Orchestration is a sequential LangChain pipeline that also streams turns over a WebSocket to a Next.js UI.",
          "Retrieval is hybrid: BM25 and dense Qdrant search fused with reciprocal rank fusion, over 44 judgments (7,170 chunks). Active-case evidence lives in a separate in-memory index, so it can never leak into the canonical precedent store.",
          "The precedent library is published as an immutable, content-hashed release. Publishing rolls back on any failure and is gated by semantic quality queries. Restores verify the snapshot hash, point count and payload hashes, so an experiment can always be tied to the exact corpus it ran on.",
        ],
      },
      {
        title: "What I added",
        items: [
          "Benchmark packs and a runner: three versioned packs (209, 198 and 27 cases) with leakage checks, and a reproducible manifest per run (pack hash, config hash, git SHA, prompt hashes).",
          "A post-cutoff pack of 27 decisions dated after the model's knowledge cutoff, built specifically to rule out memorisation.",
          "Retrieval fixes: restrict precedents to those decided before the case being tested, and demote counsel-list boilerplate chunks that were polluting results.",
          "Metrics beyond accuracy: chance baselines, Brier score for calibration, citation precision, and cost per run.",
          "Cost and iteration speed: Anthropic Message Batches for concurrent runs, DSPy-optimised judge prompt, and Langfuse tracing with a backfill script for older runs.",
          "A packet-builder agent and a blind packet-auditor agent to rebuild case packets from the actual judgments.",
        ],
      },
      {
        title: "What I learned",
        items: [
          "A first prompt predicted 'fails' for all 28 cases in a dev slice: 50% accuracy, which equals chance. The baseline check caught it before I could call it a result.",
          "A predictive judge prompt raised accuracy to 73.5% on 68 dev cases (95% CI 62 to 82.5%) against 50% chance.",
          "Some early runs reached near-perfect accuracy on rebuilt packets. I distrust them (small n, and the judge reads the case record), which is why the post-cutoff pack exists and why they are not the headline here.",
          "On the post-cutoff set, the full debate and a single judge with no advocates both scored 24/27, but the debate cost about six times as much ($4.22 vs $0.74). The adversarial structure adds transparency, not measurable accuracy, on this sample.",
        ],
      },
    ],
  },
  {
    slug: "market-research-agent",
    tier: "major",
    title: "Market Research Agent: Agentic RAG over SEC Filings",
    kicker: "LangGraph · RAG · forecasting · LLMOps",
    summary:
      "A LangGraph agent that answers questions about five large-cap companies from SEC filings, trained volatility forecasts and SQL lookups. Answers are cited, a judge model verifies them, and every claim about quality is measured on a golden set.",
    overview:
      "Most RAG demos stop at 'it answers'. I built this one to be measured and operated like a production service: a bounded agent loop, retrieval that was ablated rather than assumed, forecasting models compared against honest baselines, per-question cost and tracing, and an evaluation gate in CI. It is also the project where I was most deliberate about reporting what does not work.",
    metric: { value: "0.95", label: "RAGAS faithfulness on a 99-question golden set, at about $0.001 per question" },
    tags: ["LLM / Agents", "RAG", "Evaluation", "MLOps", "Time series"],
    stack: ["Python", "LangGraph", "pgvector", "PostgreSQL", "PyTorch", "FastAPI", "Langfuse", "RAGAS", "DeepEval", "MLflow", "DVC", "Docker", "MCP"],
    repo: "https://github.com/sohenpatel22/market_research_AI_agent",
    images: [
      {
        src: "/projects/market-research-agent/ui-chat.jpg",
        alt: "Chat tab showing a cited answer about NVIDIA export controls with a volatility forecast and a quality check",
        caption: "Ask tab: a cited answer, the model forecast next to its baseline, and the grader's quality verdict.",
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
        title: "How the agent works",
        items: [
          "A fixed LangGraph state machine: route, gather, generate, grade, and only on failure rewrite the search query and retry. Retries are capped at two with a recursion limit as a second guard, so cost and latency are bounded and the graph is easy to unit-test with fake models.",
          "Route refuses trades, personal advice and prompt-override attempts before any tool runs. Gather runs hybrid filing search, the trained forecasters and whitelisted read-only SQL; forecasts and lookups execute once, not once per retry.",
          "Retrieval fuses Postgres full-text and pgvector search with reciprocal rank fusion over section-aware chunks of 10-K and 10-Q filings (about 5,400 chunks, embedded locally), then reranks with a cross-encoder.",
          "Final answers are a validated structured object. Citations are checked against what was actually retrieved, and a weak answer is shown as unverified instead of confidently wrong. Filing text is treated as untrusted data: injection-looking lines are stripped and excerpts are wrapped in tags.",
        ],
      },
      {
        title: "Forecasting models, with the losses included",
        items: [
          "A pooled PyTorch LSTM predicts next-week volatility and was compared with HAR-RV, GARCH(1,1), ARIMA and persistence on a chronological 70/15/15 split with purged boundaries. The LSTM wins (RMSE 0.0840 vs 0.0890 for HAR-RV; Diebold-Mariano p = 0.001).",
          "It does not win everywhere: for XOM the simple HAR baseline is better by 5%. The model card says so.",
          "The direction classifier is weak (test ROC-AUC 0.62, accuracy 0.55 against a 0.65 always-up base rate). I kept it, labelled it honestly in the UI, and did not present it as a signal.",
          "A monthly workflow retrains a challenger on all but the latest 60 trading days, scores both on those days, and opens a pull request only if the challenger improves by more than 2%. The current model's holdout error is also compared with its original test error as a drift signal.",
        ],
      },
      {
        title: "Evaluation that can fail",
        items: [
          "A 99-question golden set across eight categories: single-company filings (50), comparisons (6), mixed filing-plus-forecast (4), forecasts (10), database lookups (10), unanswerable (7), out-of-scope (7) and adversarial (5). The original 38 questions were frozen when the set grew.",
          "Baseline: faithfulness 0.95, answer relevancy 0.86, context precision 0.83, context recall 0.92. Refusals, tool use and numeric facts were 100%, and all 7 unanswerable questions were handled by saying what was missing. Latency was 4.3 s at the median and 12.4 s at p95.",
          "The expanded set found a real bug: comparisons across companies cited both companies only 4 times in 6, because all retrieved excerpts came from one company. Searching each company separately and interleaving the results fixed it to 6 of 6.",
          "Retrieval ablation on 50 filing questions (NDCG@6): dense 0.461, keyword 0.284, plain hybrid 0.439, hybrid plus cross-encoder rerank 0.559. Plain RRF slightly trailed dense-only here, and the rerank was the clear win, so it is on by default.",
          "A small DeepEval gate runs in CI against a committed corpus, so a prompt or retrieval change that breaks quality fails the build.",
        ],
      },
      {
        title: "Choosing the model by cost per correct answer",
        items: [
          "The same agent code and 69 questions ran on four models. DeepSeek cost $0.0008 per question at 0.908 faithfulness, GPT-4o mini $0.0005 at 0.826, Claude Haiku 4.5 $0.0045 at 0.934, and Claude Sonnet 5.5 $0.0111 at 0.916. The whole comparison cost about $1.40.",
          "The cheapest model wrongly refused four legitimate questions, which cost it citations too, so unit cost was the wrong number. Paying 14 times more for the largest model bought no meaningful faithfulness here. I stated the caveats alongside: one run per model, 20 filing questions for RAGAS, and a judge from one of the compared providers.",
        ],
      },
      {
        title: "Production engineering",
        items: [
          "FastAPI service with a validated chat endpoint, a server-sent-events streaming endpoint that reports each agent step, a forecast endpoint, a health check that works without an LLM key, request validation and per-client rate limiting. A Gradio UI sits on the same code path.",
          "One Langfuse trace per question with route, tool calls, every LLM call, tokens, cost and latency, plus quality scores and a prompt registry. LLM calls can be cached on disk so re-running evaluations is free.",
          "Multi-stage Docker image: non-root user, no compilers or training libraries, models baked in so it starts offline, and a health check. CI lints, runs 130 tests, runs the evaluation gate, builds the image and smoke-tests the running container against Postgres.",
          "Data is versioned with DVC, the production database is seeded weekly by a workflow, and the same tools are exposed through an MCP server so any MCP client can call them. Six short architecture decision records document the trade-offs.",
        ],
      },
      {
        title: "Status",
        items: [
          "The system runs end to end locally with one command (make docker-up). The deployment automation, a Neon Postgres database and a Hugging Face Space deploy workflow, is built, but public hosting is on hold because the current account plan has no managed CPU hardware for Docker Spaces. The decision record explains this and lists hosting options.",
          "Research and education only. The forecasts are statistical estimates, not investment advice.",
        ],
      },
    ],
  },
  {
    slug: "asl-fingerspelling",
    tier: "major",
    title: "ASL Fingerspelling Recognition",
    kicker: "Deep learning · MLOps · live demo",
    summary:
      "Video of ASL fingerspelling in, text out. A Conformer-Transformer reads hand landmarks, wrapped in the full MLOps loop: versioned data, tracked experiments, a gated model registry, monitored serving and CI.",
    overview:
      "This started as a course project and became a study in what it takes to move a notebook model into a package you can test, serve and monitor. The model is the smaller half of the repo.",
    metric: { value: "27.8M", label: "parameters · test CER 0.44, split by signer" },
    tags: ["Deep Learning", "MLOps"],
    stack: ["PyTorch", "MediaPipe", "OpenCV", "FastAPI", "DVC", "MLflow", "Prometheus", "Docker", "ONNX", "Gradio"],
    repo: "https://github.com/sohenpatel22/ASL-Fingerspelling-Recognition",
    demo: "https://huggingface.co/spaces/SohenP/asl-fingerspelling",
    sections: [
      {
        title: "Model",
        items: [
          "MediaPipe extracts 21 landmarks per hand per frame, giving an 84-value vector (x, y for two hands, zeros when a hand is missing). Each sequence is centred on the wrist and scaled so the model sees hand shape rather than position, then resampled or padded to 64 frames.",
          "Encoder: a Conformer stack (macaron feed-forward blocks, multi-head self-attention, depthwise-convolution module). Decoder: a Transformer decoder over a 62-token character vocabulary. Inference uses beam search (width 5, length penalty 0.6), grid-searched.",
          "The split is 70/15/15 by signer, so validation and test signers never appear in training.",
        ],
      },
      {
        title: "Engineering around it",
        items: [
          "The notebooks became an installable package with YAML configs, command-line overrides, a smoke config that trains on generated data, and nine test files.",
          "DVC chains preprocess, train and evaluate so only stale stages rerun. MLflow logs params, metrics and the git commit, and a promotion step only moves the 'production' alias if test CER clears a threshold.",
          "A FastAPI service exposes /predict for video, /predict/landmarks for raw features and Prometheus metrics (latency, beam-search time, prediction confidence, frames with no hand). A drift monitor compares live inputs to a reference built from training data, with Grafana dashboards and alert rules in docker-compose.",
          "CI trains a toy model, gates on CER, exports to ONNX, builds the Docker image and calls the running container. A workflow deploys the demo to a Hugging Face Space.",
          "A post-processing layer (Llama 3.1 8B via Groq, temperature 0) maps noisy character output onto a constrained vocabulary or a fixed set of phrases for the demo.",
        ],
      },
      {
        title: "What I learned",
        items: [
          "The per-epoch CER in my original notebook was computed with teacher forcing, so it flattered the model. The trainer now early-stops on greedy-decoded CER, which is what inference actually does.",
          "Adding 50K supplemental sequences moved test CER by only about 0.01, so more data was not the bottleneck.",
          "The test set is about 15% of signers, so it is noisy. The evaluation script reports per-signer CER and a bootstrap interval instead of one number.",
        ],
      },
    ],
  },
  {
    slug: "consulting-workplan-agent",
    tier: "major",
    title: "Consulting Workplan Agent",
    kicker: "Deloitte sponsored practicum · multi-agent",
    summary:
      "A client brief goes in; a WBS, RACI matrix, RAID log and weekly status report come out, with a human-in-the-loop revision cycle, cross-artifact validation and Word/Excel exports in the firm's template.",
    overview:
      "Consulting deliverables are heavily cross-referenced: every risk points at work packages, every work package has an owner, every owner appears in the RACI. The design question was how to let LLM agents generate these artifacts while keeping the references consistent enough for a human reviewer to trust.",
    metric: { value: "129", label: "automated tests across agents, API and exports" },
    tags: ["LLM / Agents", "MLOps"],
    stack: ["Python", "Pydantic", "FastAPI", "Claude", "GPT", "Gemini", "DeepSeek", "python-docx", "pytest"],
    repo: "https://github.com/sohenpatel22/Consulting-Workplan-Agent",
    sections: [
      {
        title: "Design",
        items: [
          "An orchestrator owns session state, artifact versions and persistence. Six stateless specialist agents (brief parser, WBS, RACI, RAID, status report, revision) each return a validated Pydantic model, not free text.",
          "Open questions from the brief are surfaced to the human before generation; feedback during review goes to a revision agent that produces a new artifact version with a diff.",
          "Everything runs offline with a mock LLM provider, which is what the demo and most of the tests use.",
        ],
      },
      {
        title: "Keeping artifacts consistent",
        items: [
          "Reconciliation and validators check that every leaf WBS package appears in the RACI, that WBS owners hold a Responsible or Accountable role, and that RAID owners and WBS links resolve to real entries.",
          "A generated quality-gates checklist tells the reviewer what a human still has to verify, and a failure-mode table maps each known failure (orphaned risk links, mis-aligned RACI, wrong RAG status) to its mitigation.",
        ],
      },
      {
        title: "LLM plumbing",
        items: [
          "A routing provider dispatches each call to Anthropic, OpenAI, Gemini or DeepSeek by the configured model, and falls back to another available provider when a key is missing.",
          "For Claude, prompt-cache warm-up primes the cached prefix (parsed brief, WBS, RACI) before the expensive WBS and RAID calls so repeated tokens are not billed at full price.",
          "Exports cover JSON, Markdown, DOCX and XLSX; a template-sync script pulls the firm's layout so deliverables match house style.",
        ],
      },
    ],
  },
  {
    slug: "two-stage-recsys",
    tier: "major",
    title: "Two-Stage Recommender: Retrieval + LambdaRank",
    kicker: "Recommender systems",
    summary:
      "A Two-Tower retrieval model with hard negatives feeds a candidate-aware ranker trained with LambdaRank, built the way production recommenders are staged.",
    overview:
      "I started by comparing matrix factorisation baselines and ended up rebuilding the pipeline as retrieval followed by ranking. My first two-tower model scored worse than plain MF, and finding out why is where most of the value came from.",
    metric: { value: "+46%", label: "NDCG@10 vs MF (0.161 → 0.235); Hit Rate@10 0.53 → 0.63" },
    tags: ["Deep Learning", "Recommenders"],
    stack: ["PyTorch", "InfoNCE", "LambdaRank", "MovieLens 100K", "Pandas"],
    repo: "https://github.com/sohenpatel22/Two-Stage_Recommendation_System-Retrieval_and_LambdaRank_Ranking",
    sections: [
      {
        title: "Approach",
        items: [
          "Temporal split (train to Feb 1998, validate March, test April) because a random split leaks future interactions.",
          "Retrieval: user and movie towers, each an embedding plus an MLP with a residual connection and LayerNorm, L2-normalised for cosine similarity. Trained with InfoNCE using in-batch negatives plus one hard negative per pair sampled from the top 30 items a pretrained MF model likes but the user did not pick, and a learnable temperature clamped to [0.01, 1].",
          "Ranking: retrieval returns 200 candidates per user, and an MF model is fine-tuned with LambdaRank on exactly those candidates at a lower learning rate (5e-5 vs 1e-3), early-stopping on validation NDCG@10.",
        ],
      },
      {
        title: "What moved the numbers",
        items: [
          "Training the ranker on retrieved candidates instead of on all user-item pairs was the biggest single jump: it has to learn the distribution it will actually see.",
          "Hard negatives and the temperature parameter fixed a retrieval model whose validation Recall@100 stopped improving after one epoch.",
          "A subtle bug: excluding already-seen items when generating training candidates removed every positive and produced an empty dataset. Seen-item exclusion belongs only at test time.",
          "The original two-tower reached NDCG 0.102, below both MF baselines. Content features also lowered NDCG for MF, even as recall improved.",
          "Remaining bottleneck: validation Recall@100 plateaus near 0.22, so about 78% of relevant items never reach the ranker.",
        ],
      },
    ],
  },
  {
    slug: "gmm-fraud",
    tier: "major",
    title: "Fraud Detection with Gaussian Mixtures",
    kicker: "Probabilistic modelling",
    summary:
      "A generative fraud detector: one Gaussian mixture for normal transactions, one for fraud, scored by log-likelihood ratio, with the decision threshold tuned on validation data.",
    overview:
      "With fraud at roughly 0.17% of transactions, accuracy is meaningless. I wanted to see how far a small, explainable probabilistic model could go before reaching for gradient boosting, and to build the evaluation properly.",
    metric: { value: "0.697", label: "PR-AUC (primary) · ROC-AUC 0.969 · F1 0.727 on held-out test" },
    tags: ["Classical ML", "Anomaly detection"],
    stack: ["scikit-learn", "NumPy", "Pandas", "Matplotlib"],
    repo: "https://github.com/sohenpatel22/Probabilistic-Fraud-Detection-with-Gaussian-Mixtures",
    sections: [
      {
        title: "Build-up",
        items: [
          "Single-feature Gaussians first: the best feature (V12) reaches F1 0.62, so no single signal is enough.",
          "A joint GMM on V14 and V17 reaches PR-AUC 0.59, and the final model uses five features (V11, V12, V14, V16, V17).",
          "Final scorer: fit a 2-component GMM on normal transactions and a 3-component GMM on fraud, then score each transaction by fraud log-likelihood minus normal log-likelihood.",
          "The threshold is chosen by an O(n log n) sweep over sorted scores that maximises F1 on the validation set, then applied unchanged to the test set (precision 0.754, recall 0.703).",
        ],
      },
      {
        title: "Honest notes",
        items: [
          "The fraud-side mixture is fitted on labelled fraud, so this is a class-conditional generative classifier rather than pure unsupervised anomaly detection. The README also notes that supervised methods may beat it when labels are plentiful.",
          "PR-AUC is the headline metric because ROC-AUC is inflated by the huge number of true negatives.",
        ],
      },
    ],
  },
  {
    slug: "msft-forecasting",
    tier: "major",
    title: "Forecasting MSFT Returns",
    kicker: "Time series · model comparison",
    summary:
      "Twelve-plus models predict Microsoft's 5-day log return from a multi-asset feature set. The question: does model complexity buy anything on a target this noisy?",
    overview:
      "Returns are close to noise, so this project is really about disciplined comparison: chronological splits, one shared feature set, both error and directional accuracy, and a simple trading backtest to see whether predictions carry any usable signal.",
    metric: { value: "0.000875", label: "test MSE (ARIMA) · 62.2% directional accuracy" },
    tags: ["Classical ML", "Time series"],
    stack: ["Statsmodels", "scikit-learn", "PyTorch", "yfinance", "ta"],
    repo: "https://github.com/sohenpatel22/Financial-Time-Series-Forecasting",
    sections: [
      {
        title: "Pipeline",
        items: [
          "Features come from MSFT, IBM and GOOGL, the S&P 500, DJIA and VIX, USD/JPY and USD/GBP, plus gold and oil returns, treasury change and Bitcoin return, technical indicators (RSI, MACD, Bollinger width, ATR, rate of change) and a 52-week rolling beta against SPY.",
          "Target is the forward 5-day log return. Splits are chronological (80/20) and cross-validation uses TimeSeriesSplit so folds never look into the future.",
          "Models: ARIMA(1,0,0) with exogenous regressors, LASSO, Elastic Net, KNN, tree ensembles, boosting, SVR, and a small LSTM (5-step sequences, 32 hidden units).",
        ],
      },
      {
        title: "Findings",
        items: [
          "ARIMA had the lowest MSE and LASSO/Elastic Net were nearly as good, with the best directional accuracy (64.9%). The LSTM, XGBoost and Random Forest did worse.",
          "A long/short strategy driven by ARIMA predictions was backtested with cumulative return, Sharpe ratio and maximum drawdown against buy-and-hold.",
          "The takeaway I would defend: on small, noisy financial data, regularised linear and classical models are hard to beat, and MSE alone hides directional usefulness.",
        ],
      },
    ],
  },
  {
    slug: "image-colorization",
    tier: "minor",
    title: "Image Colorization: CNN vs U-Net vs CVAE",
    kicker: "Generative / vision",
    summary: "Three architectures reconstruct colour from grayscale CIFAR-10 horse images, compared on MSE, PSNR and SSIM, with a Gradio demo.",
    overview:
      "Colorization is ambiguous: a grey horse can be many colours. The comparison shows how skip connections sharpen output and how a latent variable lets the model express that ambiguity.",
    metric: { value: "23.3 dB", label: "PSNR for the CVAE (U-Net 21.5, CNN 20.0)" },
    tags: ["Deep Learning"],
    stack: ["PyTorch", "Gradio", "CIFAR-10"],
    repo: "https://github.com/sohenpatel22/Deep-Learning-for-Image-Colorization-CNN-vs-U-Net-vs-CVAE",
    sections: [
      {
        title: "What I did",
        items: [
          "Built a plain encoder-decoder CNN baseline, a U-Net with skip connections, and a conditional VAE trained on reconstruction plus a beta-weighted KL term.",
          "Results (test): CNN MSE 0.0099, SSIM 0.914; U-Net 0.0070, 0.938; CVAE 0.0046, 0.961. The CVAE also produces multiple plausible colourings.",
          "Wrote next steps I would take with more time: a VGG perceptual loss and a standard SSIM implementation.",
        ],
      },
    ],
  },
  {
    slug: "imdb-lstm-vs-bert",
    tier: "minor",
    title: "IMDB Sentiment: LSTM vs BERT",
    kicker: "NLP",
    summary: "A from-scratch bidirectional LSTM against a fine-tuned BERT, with hyperparameter sweeps and a Streamlit app that shows both models' confidence.",
    overview: "A controlled look at what transfer learning buys on a classic benchmark, with tuning done per model instead of reusing one setup.",
    metric: { value: "0.919", label: "validation F1 for BERT vs 0.895 for the LSTM" },
    tags: ["NLP", "Deep Learning"],
    stack: ["PyTorch", "Hugging Face Transformers", "Streamlit"],
    repo: "https://github.com/sohenpatel22/IMDB-Sentiment-Analysis-LSTM-vs-BERT",
    sections: [
      {
        title: "What I did",
        items: [
          "Modular training code (data, models, training, utils) with checkpointing and seeding; tuning results for each model saved as CSV.",
          "The LSTM uses embeddings, a bidirectional recurrent layer (256 hidden units) and a small MLP head; BERT adds a linear classifier on the pooled output.",
          "A smaller batch size (8) generalised better for BERT, and weight decay 0.01 was used.",
        ],
      },
    ],
  },
  {
    slug: "life-expectancy-pipeline",
    tier: "minor",
    title: "Life Expectancy Classification Pipeline",
    kicker: "Classical ML · explainability",
    summary: "A leak-safe pipeline comparing models on a country-level classification task, ending in threshold tuning and SHAP explanations.",
    overview: "The point was to build the boring parts properly: preprocessing inside the pipeline, cross-validated model selection and evaluation beyond accuracy.",
    metric: { value: "0.94", label: "macro F1 on 882 held-out samples" },
    tags: ["Classical ML"],
    stack: ["scikit-learn", "XGBoost", "SHAP"],
    repo: "https://github.com/sohenpatel22/ML-Classification-Pipeline-Life-Expectancy",
    sections: [
      {
        title: "What I did",
        items: [
          "Compared logistic regression, KNN, random forest, extra trees and XGBoost with RandomizedSearchCV, and saved every experiment's outputs.",
          "Tree ensembles clearly beat linear and distance-based models; scaling mattered for KNN and logistic regression only.",
          "Chose the decision threshold by F1 instead of defaulting to 0.5, and used SHAP for global and per-prediction explanations.",
        ],
      },
    ],
  },
  {
    slug: "pca-svd-time-series",
    tier: "minor",
    title: "Time Series with PCA and SVD",
    kicker: "Dimensionality reduction",
    summary: "Compress and reconstruct long climate and air-quality series, comparing PCA and SVD by reconstruction error.",
    overview: "Two very different datasets show how much shared structure a panel of time series really has.",
    metric: { value: "3", label: "components retain about 99.9% of variance in global temperature data" },
    tags: ["Classical ML", "Time series"],
    stack: ["NumPy", "scikit-learn", "Matplotlib"],
    repo: "https://github.com/sohenpatel22/Time-Series-Analysis-using-PCA-and-SVD",
    sections: [
      {
        title: "What I did",
        items: [
          "Built country-by-year and station-by-year matrices from Berkeley Earth temperatures (about 234 countries, 1901 to 2012) and Canadian ozone readings (18 stations, 1995 to 2022).",
          "Implemented PCA from the covariance matrix and SVD variants, then plotted scree curves and RMSE against number of components.",
          "Global temperature is dominated by a few components; ozone needs many more, meaning weaker shared structure.",
        ],
      },
    ],
  },
  {
    slug: "ieee-cis-fraud",
    tier: "minor",
    title: "IEEE-CIS Fraud Detection",
    kicker: "Tabular ML",
    summary: "A modular pipeline for the Kaggle IEEE-CIS fraud data: merge, engineer, and compare several gradient-boosting models.",
    overview: "Real transaction data with heavy missingness and severe class imbalance, organised as a reproducible pipeline instead of one notebook.",
    metric: { value: "5", label: "model families behind one factory: LR, RF, LightGBM, XGBoost, CatBoost" },
    tags: ["Classical ML"],
    stack: ["LightGBM", "XGBoost", "CatBoost", "scikit-learn"],
    repo: "https://github.com/sohenpatel22/IEEE-CIS-Fraud-Detection-",
    sections: [
      {
        title: "What I did",
        items: [
          "Left-joined identity data onto transactions by TransactionID, added frequency encoding for high-cardinality card fields and time features from TransactionDT.",
          "Evaluated by ROC-AUC because of the 3 to 4% fraud rate, with LightGBM as the main model.",
        ],
      },
    ],
  },
  {
    slug: "churn-pipeline",
    tier: "minor",
    title: "Churn Prediction ML Pipeline",
    kicker: "Data engineering for ML",
    summary: "A staged pipeline (download, ingest, transform, validate, train) where training only runs if data validation passes.",
    overview: "A small project about the principle that a model should never train on data you have not checked.",
    metric: { value: "1", label: "hard gate: failed validation stops the run before training" },
    tags: ["MLOps"],
    stack: ["Python", "scikit-learn", "Pandas"],
    repo: "https://github.com/sohenpatel22/Churn_Prediction_ML_Pipeline",
    sections: [
      {
        title: "What I did",
        items: [
          "Separated each stage into its own module. The validator checks required columns, nulls and numeric TotalCharges, and returns errors that halt the pipeline.",
          "Trains a random forest on one-hot encoded features and saves processed data and the model artifact.",
        ],
      },
    ],
  },
];

export const visibleProjects = projects;
export const majorProjects = projects.filter((p) => p.tier === "major");
export const minorProjects = projects.filter((p) => p.tier === "minor");
