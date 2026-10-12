import type { Project } from "./projects";

const GH = "https://github.com/sohenpatel22/hospital-news-agent-evaluation";
const blob = (p: string) => `${GH}/blob/main/${p}`;

export const hospitalNewsEvaluation: Project = {
  slug: "hospital-news-agent-evaluation",
  tier: "major",
  title: "Hospital News Agent Evaluation",
  kicker: "Ontario Health internship · LLM evaluation · Langfuse",
  summary:
    "A measured comparison of the Microsoft 365 Copilot news agent I built at Ontario Health against Perplexity, Claude, ChatGPT and Gemini on three hospital monitoring tasks, scored against a hand-verified gold dataset, with a prompt-engineering study, an error taxonomy, and the limits of the evidence stated plainly.",
  overview:
    "The agent tracks leadership changes, privacy-commissioner decisions and ministry-appointed supervisors across Ontario hospitals. Building it was the easy half. The hard half was answering a manager's real question: is it any good, compared with the general-purpose tools people already use? That needed a gold dataset someone could trust, scoring that separates a missed fact from a made-up one, and honesty about how little three hospitals can prove.",
  metric: { value: "0.25 → 0.42", label: "agent F1 on the 5-year leadership task with chain-of-thought prompting (ChatGPT 0.25 → 0.57)" },
  tags: ["LLM / Agents", "Evaluation"],
  stack: ["Python", "pandas", "Microsoft Copilot Studio", "LLM-as-a-Judge", "Langfuse", "bootstrap confidence intervals", "matplotlib"],
  repo: GH,
  facts: [
    { k: "5", v: "systems compared on 3 monitoring tasks" },
    { k: "248", v: "gold rows for the leadership task, hand verified" },
    { k: "133", v: "verified items in the 5-year leadership set" },
    { k: "5", v: "repeat runs of the Copilot agent, for consistency" },
    { k: "161", v: "matches corrected after I found a bug in my own scoring" },
    { k: "70", v: "judge decisions re-checked by hand" },
  ],
  docs: [
    { label: "Results summary", href: blob("docs/reports/RESULTS_SUMMARY.md") },
    { label: "Evaluation plan", href: blob("docs/methodology/EVALUATION_PLAN.md") },
    { label: "Experiments", href: blob("experiments/README.md") },
    { label: "Prompts", href: blob("docs/prompts/enhanced_prompts.md") },
  ],
  sections: [
    {
      title: "What was evaluated",
      table: {
        columns: ["Task", "What the system must find", "Window"],
        rows: [
          ["Leadership changes", "Incoming and outgoing executives and board leadership", "5 years (July 2021 to July 2026)"],
          ["PHIPA decisions", "Privacy-commissioner decisions involving hospitals", "6 months (January to July 2026)"],
          ["Interim supervisors", "Ministry-appointed hospital supervisors", "5 years"],
        ],
      },
      items: [
        "The systems under test were the Copilot agent, Perplexity, Claude, ChatGPT and Gemini, each asked the same questions about the same hospitals.",
        "Because the PHIPA window is only six months, its numbers are never pooled with the five-year tasks: perfect recall there means finding three to six real events, a different task entirely.",
      ],
    },
    {
      title: "How it was scored",
      items: [
        "Every answer was matched to a manually verified gold dataset, then adjudicated into buckets: a gold-set gap (the system was right and my gold was missing it), a hallucination, wrong attribution, out of window, or out of scope. That split matters: a system that finds a real fact the gold missed should not be penalised.",
        "Metrics: recall, precision, hallucination rate, field accuracy (role, date, direction), specificity of dates, omission, and run-to-run consistency (the Copilot agent was run five times per hospital and task). Intervals are bootstrap 95% confidence intervals.",
        "Cross-system numbers use only the first run of the Copilot agent so it does not get more chances than the others; runs two to five feed only the consistency analysis.",
        "Everything is logged to Langfuse: one trace per experiment, prompt version, system and task, with every metric attached as a score.",
      ],
    },
    {
      title: "Five experiments",
      table: {
        columns: ["Experiment", "Question"],
        rows: [
          ["1. Baseline", "Deterministic matching against LLM-as-a-judge on the first gold set"],
          ["2. Main study", "All five systems on all three tasks with the updated gold set, adjudication, intervals and the five Copilot runs"],
          ["3. Prompt iterations", "Does prompt engineering help on the short-window leadership task? Three prompts compared"],
          ["4. Five-year baseline", "Baseline prompt on the verified five-year dataset (133 items)"],
          ["5. Chain of thought", "The same dataset with a chain-of-thought prompt"],
        ],
      },
      items: [],
    },
    {
      title: "Prompt engineering: it helped at scale and hurt on a small set",
      table: {
        caption: "F1 on the 5-year leadership task",
        columns: ["System", "Baseline prompt", "Chain of thought", "Hallucination rate, baseline to chain of thought"],
        rows: [
          ["ChatGPT", "0.253", "0.568", "78% to 27%"],
          ["MS Copilot agent", "0.247", "0.418", "81% to 31%"],
          ["Perplexity", "0.156", "0.416", ""],
          ["Claude", "0.196", "0.372", "47% to 36%"],
          ["Gemini", "0.092", "0.070", ""],
        ],
      },
      items: [
        "On the harder five-year dataset, asking the model to reason step by step before answering raised F1 for four of five systems and cut hallucination sharply. Gemini got slightly worse.",
        "On the earlier short-window set the opposite happened: the plain prompt scored best (Claude 0.64), and the more elaborate prompts degraded most systems. A clever prompt is not automatically a better one, and the answer depended on the dataset.",
        "The prompts were designed from a failure analysis of the raw responses, for example that board appointments made at an annual meeting have no press release, so models that only searched newsrooms missed them, and that models reported only the incoming executive and never asked who left.",
      ],
    },
    {
      title: "The main study: low recall, and an honest ranking",
      items: [
        "On the leadership task, recall was low for every system (13% to 26%), because the five-year window contains many board-level changes that are hard to find.",
        "Of ten pairs of systems, seven had overlapping confidence intervals, so the data cannot separate them. Only three comparisons are defensible: ChatGPT, the Copilot agent and Perplexity each beat Gemini on recall.",
        "Precision on matched items was high across the board. The failures were mostly omissions and wrong details. Outright invention was rare: one fully fabricated person in the leadership task, with no trace in any source.",
      ],
    },
    {
      title: "What the errors look like",
      table: {
        caption: "Most common errors across all systems, counted not sampled",
        columns: ["Error", "Count"],
        rows: [
          ["No citation link on a matched item (so citation validity could not be scored)", "214 of 297"],
          ["Wrong role or title on an otherwise correct item (for example 'Chair' for 'Board Chair')", "189"],
          ["Wrong date on an otherwise correct item", "119"],
          ["Month and year given where a day-level date was available", "42"],
          ["Non-voting community member reported as a voting board seat", "7"],
          ["Foundation executive confused with a hospital executive", "6"],
          ["A policy or administrative document presented as a privacy-commissioner decision", "2"],
          ["Complete fabrication with no corroborating source anywhere", "1"],
        ],
      },
      items: [],
    },
    {
      title: "Finding a bug in my own scoring",
      items: [
        "During a hand check of the judge's decisions I found that my matching step, when one person had several career events at a hospital (an incoming and an outgoing row, say), accepted the first name match without checking which event the item described.",
        "I wrote a repair that re-scored every match against its own date and direction and repointed 161 matches across 26 files. Recall rose for every system and many apparent date errors turned out to be a matching artefact, not a model error. All reported numbers are after the fix.",
        "I documented the cost of the fix too: direction accuracy is now partly circular for the items the repair touched, because direction was one of the signals it used, so it is no longer an independent check there.",
      ],
    },
    {
      title: "Limits I state in the repo",
      items: [
        "Only three hospitals per task, so every interval is wide. Point differences are directional, and the error taxonomy carries the argument more than any ranking.",
        "The gold set grew during the study, and a system sometimes surfaced a real fact that I then verified and added (146 of 248 leadership rows were added after the first collection). To control for this I also report recall on the independent subset, which is lower than overall recall for every system, as circularity would predict.",
        "The judge was checked by hand on a stratified sample of 70 decisions with 4 disagreements, all from the matching bug. I did not report Cohen's kappa, because I filled in both columns myself and that would measure self-consistency, not independent agreement. It needs a second reviewer.",
        "Citation validity was not scored, because most systems named a source without linking it.",
      ],
    },
  ],
};
