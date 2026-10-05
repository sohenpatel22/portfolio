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

Because the site is public, the assistant is built so that abuse cannot run up a bill:

| Layer | What it does |
|---|---|
| Server-only key | `LLM_API_KEY` is read on the server only and is never sent to the browser. The assistant is off until it is set. |
| Per-visitor limits | 10 questions per hour and 25 per day per visitor (hashed IP), stored in Redis so they hold across serverless instances. |
| Global daily budget | 300 questions per day across everyone. After that the text box politely refuses until the next UTC day. |
| Fail closed | If Redis is missing or down in production, the endpoint refuses instead of calling the model. |
| Small requests | Questions are capped at 280 characters, history at 5 turns, retrieved context at about 1.5k tokens, output at 300 tokens. |
| Same-origin only | Browsers on other sites cannot drive the endpoint. |
| No tools, no secrets | The model can only read public site text. A prompt-injection attempt can waste a few tokens but cannot reach anything else. |
| Kill switch | Set `CHAT_ENABLED=false` in Vercel and redeploy to switch the text box off. Presets keep working. |

**Worst-case cost.** Every request is bounded, so the daily ceiling is requests x cost per request: roughly 2k input and 300 output tokens, about $0.0005 to $0.001 per question on DeepSeek or `gpt-4o-mini`. At the 300 per day cap that is under $0.30 per day. As a last line of defence, use prepaid credit with auto-recharge off (DeepSeek balance, or an OpenAI project budget) so the provider itself stops at a fixed amount.

### Setup on Vercel

1. In the Vercel project, open **Storage**, add **Upstash Redis** (free tier) from the Marketplace and connect it. This adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the `KV_REST_API_*` names, which are also read).
2. Under **Settings, Environment Variables**, add `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` for Production. See `.env.example` for DeepSeek and OpenAI values and for the optional limit overrides.
3. Redeploy. The text box appears in the chat only when the key and Redis are both configured.

For local work, copy `.env.example` to `.env.local`. In `next dev` the limiter falls back to process memory, which is never used in production.
