// Figures come from the project's run reports and decision record.
export const legalResults = [
  { label: "Reconstructed packets, post-cutoff, debate", n: 27, accuracy: 88.9, baseline: 77.8, cost: 4.22 },
  { label: "Reconstructed packets, post-cutoff, single judge", n: 27, accuracy: 88.9, baseline: 77.8, cost: 0.74 },
  { label: "Lower decision only (Tier B), pack 1", n: 118, accuracy: 83.9, baseline: 83.1 },
  { label: "Lower decision only (Tier B), pack 2", n: 280, accuracy: 85.4, baseline: 85.4 },
  { label: "Lower decision only (Tier B), pooled", n: 398, accuracy: 84.9, baseline: 84.7 },
];

export const legalFacts = [
  { k: "398", v: "cases the judge ranks from the lower decision alone" },
  { k: "0.72", v: "AUC, 95% CI 0.66 to 0.77" },
  { k: "38%", v: "of inherited dev packets described a different case" },
  { k: "198", v: "automated tests, run in CI" },
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
