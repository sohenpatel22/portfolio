# Sohen Patel: AI / ML Engineer portfolio

Live site: https://sohenpatel.vercel.app

Built with Next.js (App Router), TypeScript and Tailwind CSS, deployed on Vercel. Every push to `main` redeploys automatically.

## Editing content

All content lives in typed data files, so no page code needs to change:

| File | What it controls |
|---|---|
| `src/data/profile.ts` | Name, summary, stats, experience, skills, education, awards |
| `src/data/projects.ts` | Project cards and case-study pages |
| `src/data/legal.ts` | Legal-agents results chart and trial replay |
| `src/components/AskChat.tsx` | Questions and answers in the "Ask about Sohen" chat |
| `src/components/Diagram.tsx` | Architecture diagrams on project pages |
| `public/` | Resume PDF and headshot |

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Use `npm run lint` and `npm run build` before pushing.

## AI assistant ("Ask about Sohen")

The chat widget has two modes:

- **Preset questions** are canned answers in `src/components/AskChat.tsx`. They never call an API and cost nothing.
- **Typed questions** go to `POST /api/chat`, which answers from this site's own content using an OpenAI-compatible model (DeepSeek or OpenAI).

Because the site is public, the assistant is built so that abuse cannot run up a bill. Layers, in the order a question meets them:

| Layer | What it does |
|---|---|
| Free gate | Before any model call, questions that are off topic, jailbreak attempts, probes for keys or infrastructure, requests for personal details, advice requests, links, or cost-abuse patterns get a canned reply. They cost nothing and use no quota. |
| Server-only key | `LLM_API_KEY` is read on the server only and is never sent to the browser. The assistant is off until it is set. |
| Per-visitor limit | 5 typed questions per visitor (hashed IP) per day, stored in Redis so it holds across serverless instances. |
| Global daily budget | 30 typed questions per day across everyone. After that the text box refuses until the next UTC day. |
| Fail closed | If Redis is missing or down in production, the endpoint refuses instead of calling the model. |
| Small requests | Questions are capped at 280 characters. Only the visitor's own questions are sent (client-supplied assistant messages are ignored). Retrieved context is about 1.5k tokens and output is capped at 300 tokens. |
| Model prompt | Answers only from retrieved site content, and replies with a fixed refusal to anything else. |
| Output guard | If a reply contains the hidden marker or quotes the instructions, it is replaced by the standard refusal before the visitor sees it. |
| Same-origin only | Browsers on other sites cannot drive the endpoint. |
| No tools, no secrets | The model can only read public site text. |
| Kill switch | Set `CHAT_ENABLED=false` in Vercel and redeploy to switch the text box off. Presets keep working. |

**Worst-case cost.** Every request is bounded, so the monthly ceiling is questions x cost per question: about 2k input and 150 to 300 output tokens, roughly $0.0003 to $0.001 per question on DeepSeek `deepseek-flash` or OpenAI `gpt-6-luna`. At 30 per day that is well under $1 per month. As a last line of defence, use prepaid credit with auto-recharge off so the provider itself stops at a fixed amount.

**Reasoning models.** Both recommended models can bill hidden "thinking" tokens as output. Turn thinking off (see `.env.example`), or the cost estimate above does not hold.

**Testing.** `eval/chat` holds 335 attack, off-topic and legitimate-question cases and a runner. See its README for results and how to run a cheap real-model bake-off.

### Setup on Vercel

1. In the Vercel project, open **Storage**, add **Upstash Redis** (free tier) from the Marketplace and connect it. This adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the `KV_REST_API_*` names, which are also read).
2. Under **Settings, Environment Variables**, add `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` for Production. See `.env.example` for DeepSeek and OpenAI values and for the optional limit overrides.
3. Redeploy. The text box appears in the chat only when the key and Redis are both configured.

For local work, copy `.env.example` to `.env.local`. In `next dev` the limiter falls back to process memory, which is never used in production.
