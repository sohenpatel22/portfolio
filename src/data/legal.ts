// Numbers taken from the project's own run reports (artifacts/runs/*/summary.json, report.md).
export const legalResults = [
  { label: "Post-cutoff · debate", n: 27, accuracy: 88.9, baseline: 77.8, cost: 4.22 },
  { label: "Post-cutoff · single judge", n: 27, accuracy: 88.9, baseline: 77.8, cost: 0.74 },
  { label: "Dev 68 · predictive prompt", n: 68, accuracy: 73.5, baseline: 50.0, cost: 17.28 },
  { label: "Dev 28 · baseline prompt", n: 28, accuracy: 50.0, baseline: 50.0, cost: 7.35 },
];

export const legalFacts = [
  { k: "44", v: "judgments in the precedent library (7,170 chunks)" },
  { k: "3", v: "versioned benchmark packs: 209, 198 and 27 cases" },
  { k: "169", v: "Python tests plus UI tests, run in CI" },
  { k: "$0.74", v: "for a 27-case single-judge run vs $4.22 with debate" },
];

export type ReplayTurn = { role: "prosecution" | "defense" | "judge"; title: string; text: string };

// Condensed, party-anonymised excerpts from one real post-cutoff run (case PC_001).
export const replay: ReplayTurn[] = [
  {
    role: "prosecution",
    title: "Opening argument · moving party",
    text:
      "Once the Federal Court held that the Election Officer's decision was unreasonable because it lacked a proportionate Charter balancing, it erred by going on to decide the constitutional questions itself instead of remitting the matter to the decision-maker. That finding identifies a missing analysis, not a completed record.",
  },
  {
    role: "defense",
    title: "Opening statement · responding party",
    text:
      "The member challenged the validity of the law, not only the officer's reasoning. She sought declarations that the voting bar breaches section 15 of the Charter. This Court distinguishes review of a discretionary decision from the framework that applies when the very validity of a legislative text is challenged, so deciding the second question was a response to the relief sought, not an overreach.",
  },
  {
    role: "judge",
    title: "Verdict · confidence 0.85",
    text:
      "Moving party fails. The strongest ground is remittal, but the responding party's answer is more persuasive: constitutional validity is a distinct question, the officer could not declare his own governing regulations invalid, and the member was denied the vote again in 2025, which makes remittal largely futile. Ground truth: moving party fails. Citation precision 0.71.",
  },
];
