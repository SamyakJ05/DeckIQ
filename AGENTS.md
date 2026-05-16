<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# DeckIQ — AI Agent Project Guide

DeckIQ is an AI-powered pitch deck critique tool built for the IBM Bob hackathon. It accepts PDF/PPTX uploads, runs IBM Watson NLU per slide, and uses IBM watsonx.ai Granite to score decks on a VC rubric, generate a Deck Health Score, and produce actionable investor feedback.

**Primary reference:** `DeckIQ_PRD_v2.md` in the repo root. Read it before making any non-trivial change.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (TypeScript strict) |
| Parsing | `pdf-parse`, `officeparser` |
| NLU | IBM Watson NLU (`ibm-watson` SDK) |
| Generation | IBM watsonx.ai Granite (`@ibm-cloud/watsonx-ai` or REST) |
| Testing | Jest + ts-jest |
| Runtime | Node.js 20+ |

---

## Directory Structure

```
DeckIQ/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts       # Main upload + analysis endpoint
│   │   │   ├── rewrite/route.ts       # Per-slide rewrite suggestions
│   │   │   └── rescore/route.ts       # Re-score with updated weights
│   │   ├── upload/page.tsx            # Upload UI
│   │   ├── report/page.tsx            # Full analysis report
│   │   ├── slide-review/page.tsx      # Per-slide detail view
│   │   ├── dashboard/page.tsx         # User deck history
│   │   ├── onboarding/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── settings/page.tsx
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── pdf-parser.ts          # PDF -> raw text per slide
│   │   │   └── pptx-parser.ts         # PPTX -> raw text per slide
│   │   ├── segmentation/
│   │   │   └── slide-segmenter.ts     # Split parsed text into SlideContent[]
│   │   ├── ibm/
│   │   │   ├── nlu-client.ts          # Watson NLU wrapper (10s timeout)
│   │   │   ├── granite-client.ts      # watsonx.ai Granite wrapper (JSON retry)
│   │   │   └── prompts/
│   │   │       ├── rubric-prompt.ts   # 10-dimension VC rubric prompt builder
│   │   │       ├── fixes-prompt.ts    # Top-3 critical fixes prompt
│   │   │       ├── investor-prompt.ts # Investor perspective summary prompt
│   │   │       └── rewrite-prompt.ts  # Per-slide rewrite prompt
│   │   ├── scoring/
│   │   │   └── aggregator.ts          # Weight table, tone modifiers, health score
│   │   └── utils/
│   │       └── retry.ts               # Exponential back-off helper
│   ├── types/
│   │   └── index.ts                   # All shared TypeScript types (source of truth)
│   └── components/
│       ├── DeckHealthGauge.tsx
│       ├── SlideCard.tsx
│       ├── RubricRadar.tsx
│       ├── CriticalFixList.tsx
│       └── InvestorSummary.tsx
├── bob_sessions/                      # Bob session transcripts for hackathon evidence
│   └── .gitkeep
├── __tests__/                         # Jest test files mirror src/ structure
├── .Bob/
│   ├── mcp.json                       # MCP server config
│   └── skills/                        # Project-local Bob skills
├── DeckIQ_PRD_v2.md                   # Full PRD -- primary source of truth
├── AGENTS.md                          # This file
└── CLAUDE.md                          # Claude Code behaviour overlay
```

---

## Shared Types (source of truth)

All types live in `src/types/index.ts`. Never duplicate types elsewhere. Key types:

```typescript
NLUResult             // Watson NLU output per slide
RubricScores          // 10-dimension VC rubric scores (0-10 each)
SlideAnalysis         // Combined NLU + rubric for one slide
CriticalFix           // { dimension, issue, suggestion, priority }
EmotionalJourneyPoint // { slideIndex, sentiment, intensity }
DeckAnalysisResult    // Full API response shape -- DO NOT change without updating route.ts
```

---

## IBM Environment Variables

Store in `.env.local` (never commit). Read only via `process.env.*`.

```
# Watson NLU
NLU_API_KEY=
NLU_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com

# watsonx.ai
WATSONX_API_KEY=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=

# Feature flags
USE_CONTEXTUAL_MEMORY=false
GRANITE_FALLBACK_MODEL=ibm/granite-3-3-2b-instruct
```

---

## Analysis Pipeline (ordered steps)

1. **Parse** -- PDF/PPTX -> raw text per slide (`lib/parsers/`)
2. **Segment** -- raw text -> `SlideContent[]` (`lib/segmentation/slide-segmenter.ts`)
3. **NLU** -- per-slide Watson NLU call -> `NLUResult[]` (parallel, 10s timeout each)
4. **Deck Map** -- build structural summary from NLU results
5. **Granite Rubric** -- single batched Granite call with rubric prompt -> `RubricScores[]`
6. **Aggregate** -- weight table + tone modifiers -> `DeckHealthScore` 0-100
7. **Granite Fixes** -- Top 3 Critical Fixes prompt -> `CriticalFix[]`
8. **Granite Investor** -- Investor Perspective Summary prompt -> string
9. **Assemble** -- compose `DeckAnalysisResult` and return as JSON

Performance target: **< 45 seconds** for a 15-slide deck.

---

## Coding Conventions

- TypeScript strict mode. No `any`. Explicit return types on all exported functions.
- Functional style. Pure functions, no classes except where SDK requires.
- Error-first: throw typed errors (`AppError` with `code` + `message`), catch at route level.
- Module size: prefer files under 150 lines. Split when logic is separable.
- No inline magic numbers -- use named constants.
- Comments only when WHY is non-obvious (hidden constraint, IBM quirk, workaround).
- No `console.log` in production paths -- use a structured logger wrapper.

---

## IBM SDK Rules

- Watson NLU: use `ibm-watson/natural-language-understanding/v1`. Set `timeout: 10000` on every call.
- Granite: prefer `@ibm-cloud/watsonx-ai` SDK. If unavailable, use authenticated REST to `WATSONX_URL/ml/v1/text/generation`. Primary model: `ibm/granite-3-3-8b-instruct`. Fallback: `ibm/granite-3-3-2b-instruct`.
- Granite responses MUST be valid JSON. Implement parse-retry (up to 3 attempts) with temperature nudge.
- Never invent SDK options. When unsure, read IBM docs or the installed SDK's TypeScript types.

---

## Collaboration -- Person A vs Person B

| Owner | Files |
|---|---|
| Person A | `app/api/analyze/route.ts`, `app/api/rewrite/route.ts`, `app/api/rescore/route.ts`, `lib/parsers/`, `lib/segmentation/`, `lib/ibm/nlu-client.ts`, `lib/ibm/granite-client.ts` |
| Person B | `types/index.ts`, `lib/ibm/prompts/`, `lib/scoring/aggregator.ts`, `components/`, `app/report/page.tsx`, `app/slide-review/page.tsx` |

Rules:
- Before touching the other person's files, open a discussion (Bob chat or GitHub comment).
- `types/index.ts` is jointly owned -- any change requires both to review.
- Bob session files go in `bob_sessions/` named `YYYY-MM-DD_<topic>_<initials>.md`.

---

## Testing & Acceptance Criteria

Before any PR is merged, verify:

- [ ] `/api/analyze` returns `DeckAnalysisResult` shape for a valid PDF
- [ ] `/api/analyze` returns `DeckAnalysisResult` shape for a valid PPTX
- [ ] Deck Health Score is between 0 and 100
- [ ] Exactly 3 Critical Fixes returned
- [ ] Per-slide `SlideAnalysis` count matches slide count in uploaded file
- [ ] NLU timeout (10s) triggers graceful fallback, not 500
- [ ] Granite JSON parse failure retries up to 3 times before returning error
- [ ] Analysis of 15-slide deck completes in < 45 seconds
- [ ] Image-only PDF slides produce empty-text fallback (no crash)
- [ ] Frontend report page renders without error for valid `DeckAnalysisResult`
- [ ] All Jest tests pass (`npm test`)

---

## Bob Session Naming (Hackathon Evidence)

Name Bob sessions in `bob_sessions/` as:
```
YYYY-MM-DD_<feature>_<initials>.md
# e.g. 2026-05-16_nlu-wiring_PA.md
#      2026-05-16_scoring-aggregator_PB.md
```

Bob sessions demonstrate AI-assisted development for hackathon judges. Keep them.
