import type { Project } from "./projects";

export const legalAgents: Project = {
  slug: "legal-agents",
  tier: "major",
  title: "Multi-Agent Legal Reasoning System",
  kicker: "MEng research project · University of Toronto",
  summary:
    "Agents that read a Federal Court of Appeal case and predict whether the moving party succeeds. The interesting part is the evaluation: I found that the inherited benchmark could not be trusted, rebuilt it from open court data, and showed that part of the earlier accuracy came from the test cases restating their own answer.",
  overview:
    "I took over an adversarial legal-trial pipeline (appellant and respondent agents plus a judge) and a 209-case benchmark built by an earlier team. The question I care about is not whether the agents write fluent arguments, but whether the verdicts predict outcomes on cases the model could not have memorised and could not simply read the answer from. Most of the work went into making that measurable, and the honest result is modest: a ranking signal that clearly beats chance and cheap shortcuts, with no architecture change that reliably beats a single judge.",
  metric: { value: "0.72", label: "judge AUC on 398 appeals from the lower decision alone (95% CI 0.66 to 0.77)" },
  tags: ["LLM / Agents", "RAG", "Evaluation", "MLOps"],
  stack: [
    "Python", "Claude API", "LangChain", "Qdrant", "BM25 + RRF", "Kanon 2", "FastAPI", "Next.js", "Langfuse", "DSPy", "scikit-learn", "pytest",
  ],
  facts: [
    { k: "398", v: "Tier B cases, 61 successes, FCA decisions 2023 to 2026" },
    { k: "0.72", v: "judge AUC, 95% CI 0.66 to 0.77" },
    { k: "+0.08", v: "AUC the LLM adds on top of case metadata (0.68 to 0.76)" },
    { k: "156/158", v: "outcomes agreeing in two blind audits of the labels" },
    { k: "198", v: "automated tests, run in CI" },
    { k: "0", v: "retrieved chunks dated after the decision, across 572 case runs" },
  ],
  sections: [
    {
      title: "What it does",
      items: [
        "An appellant (or moving-party) agent and a respondent agent argue a Federal Court of Appeal proceeding, and a judge agent returns whether the moving party succeeds, with a confidence score. It is a research prototype, not a legal decision tool.",
        "The final design ('Tier B') gives the model only the lower-court or tribunal decision. Outcomes, grounds and the authorities the FCA cites come from the FCA judgment and are used for scoring only. The proceeding type and moving party come from the case caption, which is known before the decision.",
        "Variants are switchable: a judge alone (v0), a judge with retrieved precedents (v1), and a grounds agent plus advocate briefs before the judge (v2). Retrieval is hybrid (BM25 and dense search fused with reciprocal rank fusion) with a Kanon 2 reranker, over a library that grew from 4,887 FCA decisions (50,749 chunks) to about 5.7K decisions with 815 Supreme Court decisions added.",
      ],
    },
    {
      title: "What was wrong with the inherited benchmark",
      intro:
        "The earlier team's agents scored 41 to 53%, and my first predictive prompt raised dev accuracy to 73.5%. I audited that run before believing it. The run was correct; the benchmark was not.",
      table: {
        columns: ["Problem", "Evidence", "What I did"],
        rows: [
          ["The judge prompt forced 'fails'", "28 of 28 answers were 'fails' (50%, equal to chance); the fixed prompt corrected 7 and broke 1 on the same cases", "Rewrote the prompt so a missing lower decision counts against neither side"],
          ["Packets described a different case", "26 of 68 dev packets (38%) described another case than the one labelled; the model scored 81% on faithful packets and 69% on the rest", "Rebuilt all 192 AI-written packets from the real judgments"],
          ["Look-ahead in retrieval", "In 52 of 68 dev cases the advocates were shown precedents decided after the case", "Restricted retrieval to earlier decisions, checked in tests"],
          ["Label noise", "About 6%: split decisions where the dissent's outcome was recorded, consent and partial outcomes", "Corrected 8 labels, dropped 11 mixed cases"],
          ["Memorisation", "A blind probe recognised 17% of the rebuilt cases by name (24% train, 19% dev, 8% test), some with the right outcome", "Built a post-cutoff set, then a design where recall cannot help"],
          ["Shortcuts", "Two word-statistics rules reached 63% on 68 cases; the Crown wins 59% of its FCA cases against 17% for private parties", "Report no-LLM baselines with every run"],
        ],
      },
      items: [],
    },
    {
      title: "Building an evaluation that can fail",
      items: [
        "A first fix was a post-cutoff set: 27 FCA decisions dated after the model's knowledge cutoff. A single judge and the full debate both scored 89% (24 of 27) against a 78% majority baseline, with identical verdicts on all 27. The debate cost about six times as much ($4.22 against $0.74), so it added transparency, not accuracy.",
        "But the packets still restated the judgment's own reasoning. So I moved to Tier B, where the model sees only the lower decision, and rebuilt the dataset from open court data (A2AJ): 398 cases from two pools, 61 of them successes.",
        "Labels were made by subagents at no API cost and checked by two blind relabelling audits (117 of 118 and 39 of 40 outcomes agree). The one mismatch was the relabeller missing a disposition, confirmed against the judgment.",
        "A name-only memorisation probe on all 280 cases of the second pool gave AUC 0.526 and no recall, and its scores matched the first pool, so I saw no sign of a training-data advantage.",
        "Retrieval integrity was checked directly: across 572 case runs and 3,432 retrieved chunks, none was dated on or after the decision and none was the case itself. Twenty-eight chunks came from earlier decisions in the same appeal file, which I flagged for exclusion.",
        "I recomputed the metrics independently against scikit-learn (matching to four decimals) and noted the limits I found: Haiku produces only 7 to 9 distinct scores, so ranking metrics are coarse and Brier is meaningless for ordinal scores.",
      ],
    },
    {
      title: "Results",
      table: {
        caption: "Single Haiku 4.5 judge, lower decision only, no precedents",
        columns: ["Set", "Cases (successes)", "Accuracy", "Always 'fails'", "AUC"],
        rows: [
          ["Pack 1 (Sep 2025 to Sep 2026)", "118 (20)", "0.839", "0.831", "0.745"],
          ["Pack 2 (Jan 2023 to Aug 2025)", "280 (41)", "0.854", "0.854", "0.709"],
          ["Pooled", "398 (61)", "0.849", "0.847", "0.721 (CI 0.66 to 0.77)"],
        ],
      },
      items: [
        "Accuracy at a 0.5 cut-off equals always answering 'fails', because only about 15% of moving parties succeed. AUC is the number to quote: it measures how well the judge ranks cases, which is what a score is for.",
        "No-LLM baselines on the pooled set reach AUC 0.63 (case metadata, mostly whether the moving party is the Crown), 0.67 with the lower court's disposition, 0.55 for TF-IDF and 0.68 combined. Adding the LLM score to the metadata model raises cross-validated AUC from 0.675 to 0.756 (+0.081, positive in 95% of folds). So the model carries real signal beyond who the parties are, though cheap metadata already gets most of the way to the model alone.",
        "By lower court the AUC runs from 0.62 (CIRB, 13 cases) to 0.83 (SST, 23 cases), with the largest group (FC, 267 cases) at 0.73. Single-judge cost is about $0.013 to $0.019 per case.",
      ],
    },
    {
      title: "Architecture changes that did not help",
      intro:
        "I tested each component on its own, with component-level metrics, rather than trusting a headline number. With only 20 to 61 positives, none of these differences is large enough to rank architectures.",
      table: {
        columns: ["Change", "What happened"],
        rows: [
          ["Retrieved precedents (hybrid + rerank)", "AUC 0.748 against 0.745 without (p = 0.63). The library covered only 37% of the authorities the FCA cites; adding the Supreme Court raised that to 67.5% and hybrid + rerank became the best retrieval mode (hit@20 0.59), but the judge did not improve."],
          ["Advocate briefs and a grounds agent", "The grounds agent found the main issue in about 9 of 12 cases, but briefs did not change the verdict: the judge restated the lower court's reasoning and deferred. 37% of neutral citations in briefs were not in the retrieved set or the decision; with the wider library that fell to 3%."],
          ["A stronger judge (Sonnet), real grounds", "Not better than Haiku on the 12-case diagnostic, so neither judge strength nor grounds quality was the limit there."],
          ["Ordinal grading instead of probabilities", "Worse on the full set (AUC 0.583 against 0.745, p < 0.001)."],
          ["Removing the base-rate sentence from the prompt", "Did not stop Haiku giving about 0.25 on almost every case, so I quote AUC, which depends only on how cases are ranked."],
        ],
      },
      items: [],
    },
    {
      title: "What I learned",
      items: [
        "A strong-looking accuracy can be a property of the packets, not the model. On reconstructed packets a single judge reached 87% balanced accuracy; on Tier B the same kind of judge ranks cases with AUC 0.72 and has the accuracy of always answering 'fails'. Part of the earlier number came from packets that restated the court's reasoning.",
        "A multi-agent debate cost about six times a single judge and did not change a verdict on the sample I could measure. I report that rather than the architecture I started with.",
        "Small samples cannot rank designs: on 12 cases an AUC difference under about 0.25 is noise, and on 20 positives I could not separate variants. The larger pooled set exists for that reason.",
        "I made mistakes I caught by checking: one helper script was overwritten by another agent and about 35 labels were written for citations outside a batch. I removed them and verified the final label set (526 of 526 present, no duplicates).",
      ],
    },
    {
      title: "Engineering",
      items: [
        "More than 15 cost-capped experiments, run through benchmark packs with leakage checks and a reproducible manifest per run (pack hash, config hash, git SHA, prompt hashes). The runner has a hard per-run budget and stops on the first credit error, and uses Anthropic Message Batches for concurrent runs.",
        "An immutable, content-hashed precedent library. Publishing rolls back on failure and is gated by quality queries, so every experiment ties to the exact corpus it ran on.",
        "Langfuse tracing, including a backfill that replayed 163 older case traces without re-running any model calls, and a DSPy-optimised judge prompt.",
        "198 automated tests run in CI. Every paid run had a cost estimate first, and subagent labelling and audits cost nothing in API fees.",
      ],
    },
    {
      title: "What is not done",
      items: [
        "A three-judge majority and pairwise comparison, evaluation on real notices of appeal and factums (a 'Tier A' set), an open-weight model hosted in Canada, and deployment. Several runs were cut short when API credits ran out; those are reported as partial.",
      ],
    },
  ],
};
