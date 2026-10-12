import type { Project } from "./projects";

const GH = "https://github.com/sohenpatel22/portfolio";
const blob = (p: string) => `${GH}/blob/main/${p}`;

export const portfolioChatbot: Project = {
  slug: "portfolio-chatbot",
  tier: "major",
  title: "Ask About Sohen: a public, abuse-resistant chatbot",
  kicker: "LLM app · guardrails · cost control · live on this site",
  summary:
    "The assistant in the corner of this site. Strangers can type questions and it answers from my own projects and experience, but only about me: it refuses everything else before spending a token, caps what any visitor can spend, and was tested against 335 questions that include attacks.",
  overview:
    "A chatbot that anyone on the internet can use will be used to run up the bill, to jailbreak it, and as a free general-purpose model. So the interesting problem was not the answer. It was making a public, paid endpoint safe and cheap enough to leave on. You can try it now: click Ask about Sohen at the bottom right of any page.",
  metric: { value: "0 of 197", label: "attack and off-topic questions that got through, out of 335 test questions" },
  tags: ["LLM / Agents", "Evaluation", "MLOps"],
  stack: ["TypeScript", "Next.js", "OpenAI API (Flex)", "Upstash Redis", "Server-sent streaming", "Vercel", "TF-IDF retrieval", "Node eval runner"],
  repo: GH,
  facts: [
    { k: "335", v: "test questions, including attacks, in three sets" },
    { k: "0 / 197", v: "attacks and off-topic questions that got through" },
    { k: "333", v: "of 335 passed against the real model" },
    { k: "$0.012", v: "to run all 335 against the real model" },
    { k: "10 / day", v: "questions per visitor, 100 a day overall" },
    { k: "2", v: "real bugs only the real-model run exposed" },
  ],
  docs: [
    { label: "README", href: blob("README.md") },
    { label: "Evaluation results", href: blob("eval/chat/README.md") },
    { label: "The gate", href: blob("src/lib/chat/guard.ts") },
    { label: "Limits", href: blob("src/lib/chat/limits.ts") },
  ],
  images: [
    {
      src: "/projects/portfolio-chatbot/chat.jpg",
      alt: "The chat panel answering a typed question about the ASL project, with preset questions below it",
      caption: "A typed question answered from the site's content, with a link to the relevant page. The preset questions below it cost nothing.",
      width: 799,
      height: 609,
    },
  ],
  sections: [
    {
      title: "How a question is handled",
      intro:
        "Preset questions show a stored answer with no API call. A typed question goes through these steps, in order, and most attacks never get past the third.",
      table: {
        columns: ["Step", "What it does"],
        rows: [
          ["Same-origin check", "Another website cannot drive the endpoint through a visitor's browser"],
          ["Pattern gate", "Rules decide whether the question is about me at all. Off-topic, jailbreaks, probes for keys, requests for personal details and cost abuse get a fixed reply and cost nothing"],
          ["Budgets", "Per-visitor and daily counters in Redis. In production the endpoint refuses to answer if Redis is down, instead of running unlimited"],
          ["Retrieval", "My profile and project pages are split into chunks of about 1,200 characters and scored against the question. Named topics, like education or one employer, always pull their own section"],
          ["Model call", "The model answers only from those chunks, in at most 300 tokens, and is told to refuse anything else"],
          ["Output guard", "A hidden marker sits in the system prompt. If an answer contains it or quotes the instructions, it is replaced by a standard refusal before the visitor sees it"],
        ],
      },
      items: [],
    },
    {
      title: "Making it safe to leave on",
      items: [
        "Only the visitor's own questions are sent to the model, because assistant messages from the browser can be forged to prime it. Questions are capped at 280 characters.",
        "The API key never leaves the server, the model has no tools and no secrets, and the text box only appears when the key and Redis are both configured. A kill switch (one environment variable) turns the text box off while the preset questions keep working.",
        "The gate is deliberately conservative about what counts as 'about Sohen': technology words alone are not enough, so 'what is the best way to learn Python?' is refused, while 'what did he use Python for?' is answered.",
        "Typed answers can link to pages on the site, and I fixed a real bug there: section links did not scroll because the panel closing during the click lost the scroll.",
      ],
    },
    {
      title: "Keeping the cost near zero",
      items: [
        "I compared providers on cost per answered question and chose OpenAI's Flex processing, which is about half the price of standard but slower and sometimes unavailable.",
        "So the app tries Flex first and, if it is slow or returns an error, retries once on standard processing. Those fallback answers cost twice as much, so they have their own small budgets (5 per visitor and 30 overall a day). When they run out the visitor sees 'busy, try again later' and nothing is billed.",
        "Limits scale with the price: 10 questions per visitor per day and 100 overall on Flex, 5 and 30 on standard. Reasoning is switched off, because hidden thinking tokens would otherwise be billed as output. The whole 335-question run cost about 1.2 cents.",
      ],
    },
    {
      title: "Testing it like an adversary",
      intro:
        "335 questions, in a main set and two hold-out sets written later: legitimate questions (which must be answered, to catch false refusals), questions the site cannot answer (which must not be invented), off-topic requests, prompt injection, probing for keys, personal-information requests, cost abuse, advice requests and multi-turn attacks with forged history. A runner calls the real route and grades each reply.",
      table: {
        caption: "Run against gpt-6-luna on Flex",
        columns: ["Set", "Passed", "Attacks that got through", "Legitimate questions wrongly refused"],
        rows: [
          ["Main set (178)", "176", "0 of 108", "0 of 58"],
          ["Hold-out 1 (79)", "79", "0 of 45", "0 of 28"],
          ["Hold-out 2 (78)", "78", "0 of 44", "0 of 30"],
        ],
      },
      items: [
        "The numbers need caveats, and the repo states them. I tuned the gate on the main set. On the hold-out sets, which I had not tuned against, the gate alone first let through 22 of 45 and 10 of 44 attack and off-topic questions. I fixed the underlying patterns, not individual questions, so the final numbers are tuned, not blind.",
        "The questions are written by me. They are not a substitute for real visitor questions.",
        "The two remaining failures are a correct summary that uses none of the expected keywords and a correct correction of a false premise that the grader expects to be phrased as 'not available'. I left them as they are.",
      ],
    },
    {
      title: "What the real model run found",
      items: [
        "A stalled stream. When a model chunk added no visible text beyond a 60-character hold-back window, my code returned without sending anything, and a streaming response that sends nothing is never asked again. The page hung until a timeout. A mock model never produced this, so every earlier test passed.",
        "Weak retrieval. After the Market Research case study was added, its long text out-scored short sections on raw keyword counts, so education, graduation and employer questions got project text and the model said it had no information. Named topics now pull their own section.",
        "Two flaws in my grader: an email address counted as a refusal, and a phrase counted as asserted even when the answer denied it. I fixed them after seeing the failures, so the final pass counts are not a clean first run.",
      ],
    },
    {
      title: "Limits, and what I would change",
      items: [
        "The gate is pattern-based and tuned for English, so a new phrasing can get past it to the model. The prompt, the token cap, the output guard and the budgets are there for that case.",
        "Retrieval is keyword-based. It is cheap and predictable but can miss a question that shares no words with the answer. Embeddings would handle that better at the cost of another service.",
        "Limits are per hashed IP, so people behind one network share a budget. Per-user limits would need accounts.",
        "Flex through streaming Chat Completions is documented by OpenAI as beta. It worked in every run I did.",
      ],
    },
  ],
};
