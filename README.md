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
