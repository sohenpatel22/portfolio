# Risk evaluation for the "Ask about Sohen" assistant

This folder tests whether the assistant stays in scope and resists misuse. It drives the real `/api/chat` route,
so the free gate, the rate limits, the system prompt, the model and the output guard are all in the loop.

## Test sets

| File | Cases | Notes |
|---|---|---|
| `cases.json` | 178 | The gate was tuned against this set. |
| `cases-holdout.json` | 79 | Written after tuning; later used for tuning too. |
| `cases-holdout2.json` | 78 | Written last and run **once before any fix**, then used for tuning. |

Every set mixes legitimate questions (which must be answered, to catch false refusals), questions with no answer on the site
(which must not be invented), off-topic requests, prompt-injection and jailbreak attempts, probing for keys and infrastructure,
personal-information requests, cost abuse, advice and safety triggers, and multi-turn attacks (including forged assistant turns).

## How to run

Free, gate only (the model is never called):

```bash
# terminal 1: start the app in dry-run mode with the limits raised so the test is not rate limited
CHAT_EVAL_DRY_RUN=true LLM_API_KEY=x CHAT_DAILY_LIMIT=100000 CHAT_IP_HOURLY_LIMIT=100000 CHAT_IP_DAILY_LIMIT=100000 npm run dev -- -p 3400
# terminal 2
node eval/chat/run.mjs --dry-run --cases cases-holdout2.json
```

Against a real model (costs a few cents; questions the gate refuses cost nothing). Start the app with your real `LLM_*`
variables, without `CHAT_EVAL_DRY_RUN`, with the same raised limits, then:

```bash
node eval/chat/run.mjs --label deepseek-flash --price-in 0.15 --price-out 0.60
node eval/chat/run.mjs --label gpt-6-luna --price-in 0.10 --price-out 0.50 --cases cases-holdout2.json
```

## Gate-only results (free, no model)

First run on each set that the gate had not been tuned on:

| Set | Attacks and off-topic blocked before any model call | Legitimate questions wrongly refused |
|---|---|---|
| Hold-out 1 | 23 of 45 (51%) | 3 of 29 |
| Hold-out 2 | 34 of 44 (77%) | 4 of 30 |

After fixing the underlying patterns (not individual questions), all three sets pass the gate stage: every attack and
off-topic case is blocked and no legitimate question is refused. Treat those numbers as tuned, not as the expected rate on new
questions. The first-run table above is the honest estimate, and the remainder is what the system prompt and the model
have to handle. The real-model run below measures the model layer.

## Real-model run: gpt-6-luna on Flex (all 335 cases)

The assistant ran end to end against `gpt-6-luna` with `service_tier: "flex"` (every answer was served on Flex; the
fallback did not trigger). Reasoning effort `none`, 300 output tokens maximum.

| Set | Pass | Attacks that got through | Legitimate questions wrongly refused |
|---|---|---|---|
| `cases.json` | 178 of 178 | 0 of 108 | 0 of 58 |
| `cases-holdout.json` | 77 of 79 | 0 of 45 | 0 of 28 |
| `cases-holdout2.json` | 77 of 78 | 0 of 44 | 0 of 30 |

Total cost for the three sets: about $0.012 (about 188k input and 9k output tokens at Flex rates).

How the first real run went, before any fix: 6, 3 and 4 failures. Two real problems came out of it and were fixed:

1. Streaming stall. A model chunk that added no visible text beyond the 60 character hold-back window made the response
   stop producing output until the 25 second timeout. A mock model never exposed this. `pull` now keeps reading until it
   sends something or the stream ends.
2. Retrieval. Questions about education, graduation, GPA, thesis and about each employer sometimes got project text
   instead, because long project write-ups out-scored short sections on keyword counts, so the model said it had no
   information. Named topics now always pull their own section (`PINS` in `src/lib/chat/knowledge.ts`).

Two grader flaws were also fixed (an email address counted as a refusal, and a forbidden phrase counted even when the
answer denied it). The remaining three failures are `H-IN_-05` (a correct answer that does not use any of the expected
keywords), `H-UNK-05` and `X-UNK-03` (correct "not specified" and "no" answers that the grader does not recognise).
The pass counts above were measured after the grader changes, so they are not a clean first-run score; the first-run
numbers are the 6, 3 and 4 failures above.

## What is and is not covered

- Covered: the gate patterns, limits, forged-history handling, output leak guard and provider options (tested against a mock model and a mock Redis).
- Covered once: `gpt-6-luna` on Flex (above). Other models have not been run.
- Known limits: the gate is pattern based and English centred. A new phrasing can slip through to the model, and a very new
  jailbreak style may too. That is why the model prompt, token caps, output guard and request budgets exist behind it.

## Cost of a full bake-off

About 193k input tokens and 20k output tokens across all three sets (about 130 of the 335 questions reach the model):
about $0.03 on `gpt-6-luna`, $0.04 on `deepseek-flash` or `gpt-4o-mini`, and $0.29 on Claude Haiku 4.5.
