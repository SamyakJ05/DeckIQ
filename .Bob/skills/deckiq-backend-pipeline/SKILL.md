---
name: deckiq-backend-pipeline
description: Use this skill when working on backend API routes, file parsers, IBM Watson NLU integration, IBM watsonx.ai Granite integration, or any code under src/app/api/, src/lib/parsers/, src/lib/segmentation/, or src/lib/ibm/. Covers the full parse -> NLU -> Granite -> aggregate pipeline.
---

# DeckIQ Backend Pipeline Skill

## Before You Start

1. Read `DeckIQ_PRD_v2.md` (repo root) -- it is the authoritative spec for the pipeline, types, prompts, and scoring formula.
2. Read `AGENTS.md` -- project conventions, IBM SDK rules, environment variables, and ownership rules.
3. Check `src/types/index.ts` -- understand `DeckAnalysisResult` and related types before touching any route.

## Files You Own (Person A)

| File | Purpose |
|---|---|
| `src/app/api/analyze/route.ts` | POST handler: parse, segment, NLU, Granite, aggregate, return `DeckAnalysisResult` |
| `src/app/api/rewrite/route.ts` | POST handler: per-slide rewrite via Granite |
| `src/app/api/rescore/route.ts` | POST handler: re-run aggregator with custom weights |
| `src/lib/parsers/pdf-parser.ts` | PDF -> `SlideRawText[]` using `pdf-parse` |
| `src/lib/parsers/pptx-parser.ts` | PPTX -> `SlideRawText[]` using `officeparser` |
| `src/lib/segmentation/slide-segmenter.ts` | `SlideRawText[]` -> `SlideContent[]` |
| `src/lib/ibm/nlu-client.ts` | Watson NLU wrapper |
| `src/lib/ibm/granite-client.ts` | watsonx.ai Granite wrapper |

Do not edit `src/types/index.ts`, `src/lib/ibm/prompts/`, or `src/lib/scoring/aggregator.ts` without coordinating with Person B.

## Plan-First Workflow

**Before editing any file**, output a numbered checklist of the exact edits you plan to make and wait for confirmation. Example:

```
Plan:
1. Add `parseTimeout` constant (10000) to nlu-client.ts
2. Wrap NluClient.analyze() in retry.ts exponential back-off (max 2 retries)
3. Add Jest test: nlu-client.test.ts -- timeout triggers fallback
```

Do not write code until the plan is approved.

## Analysis Pipeline Implementation Guide

### Step 1 -- Parse

```typescript
// pdf-parser.ts
export async function parsePdf(buffer: Buffer): Promise<SlideRawText[]>

// pptx-parser.ts
export async function parsePptx(buffer: Buffer): Promise<SlideRawText[]>
```

- Image-only slides: return `{ index, text: '' }` -- never throw.
- Max file size: 50 MB. Reject early with `AppError('FILE_TOO_LARGE')`.

### Step 2 -- Segment

```typescript
// slide-segmenter.ts
export function segmentSlides(raw: SlideRawText[]): SlideContent[]
```

- Strip boilerplate (slide numbers, template text).
- Preserve original slide index.

### Step 3 -- NLU (parallel, 10s timeout)

```typescript
// nlu-client.ts
export async function analyzeSlide(text: string): Promise<NLUResult>
```

- Features to enable: `sentiment`, `emotion`, `keywords`, `entities`, `categories`, `concepts`.
- Timeout: `10000` ms on every call.
- Empty text: return a zeroed `NLUResult` stub -- do not call NLU API.
- Run slides in parallel: `Promise.all(slides.map(analyzeSlide))`.

### Step 4 -- Granite Rubric

```typescript
// granite-client.ts
export async function generateJson<T>(prompt: string, schema: string): Promise<T>
```

- Primary model: `ibm/granite-3-3-8b-instruct`
- Fallback model: env `GRANITE_FALLBACK_MODEL` (default `ibm/granite-3-3-2b-instruct`)
- Parse-retry loop: attempt JSON.parse up to 3 times; on failure nudge temperature +0.05.
- If all retries fail: throw `AppError('GRANITE_PARSE_FAILED', { attempt: 3 })`.

### Step 5 -- Assemble Response

The `/api/analyze` response shape MUST exactly match `DeckAnalysisResult` in `src/types/index.ts`. Do not add, remove, or rename fields without a joint type change.

## Error Handling

```typescript
// All IBM errors bubble up as AppError
throw new AppError('NLU_TIMEOUT', { slideIndex, elapsed });
throw new AppError('GRANITE_PARSE_FAILED', { attempt, rawResponse });
throw new AppError('UNSUPPORTED_FILE_TYPE', { mimeType });
```

Route handlers catch `AppError` and map to HTTP status codes:
- `FILE_TOO_LARGE` -> 413
- `UNSUPPORTED_FILE_TYPE` -> 415
- `NLU_TIMEOUT` -> 504 (with partial results if available)
- `GRANITE_PARSE_FAILED` -> 502
- Unknown -> 500

## Environment Variables

Read from `process.env` only. Never hardcode keys. Required vars:

```
NLU_API_KEY, NLU_URL
WATSONX_API_KEY, WATSONX_URL, WATSONX_PROJECT_ID
```

Throw `AppError('MISSING_ENV', { key })` at startup if any are missing.

## Tests

For every new function, add a corresponding test in `__tests__/` mirroring the `src/` path.

Mandatory test cases:
- Happy path with fixture PDF/PPTX
- Empty text slide (NLU skipped, returns stub)
- NLU timeout (mock `setTimeout` or intercept HTTP)
- Granite parse failure + retry + eventual success
- Granite parse failure all 3 retries (AppError thrown)
- File too large (413 before parsing)

Run: `npm test`

## IBM SDK Usage

```typescript
// Watson NLU -- ibm-watson SDK
import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1';
import { IamAuthenticator } from 'ibm-watson/auth';

const nlu = new NaturalLanguageUnderstandingV1({
  version: '2022-04-07',
  authenticator: new IamAuthenticator({ apikey: process.env.NLU_API_KEY! }),
  serviceUrl: process.env.NLU_URL,
});
// Always pass timeout per request
const result = await nlu.analyze({ ...params }, { timeout: 10000 });
```

```typescript
// watsonx.ai -- REST if SDK unavailable
const response = await fetch(`${process.env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${iamToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model_id: 'ibm/granite-3-3-8b-instruct',
    project_id: process.env.WATSONX_PROJECT_ID,
    input: prompt,
    parameters: { decoding_method: 'greedy', max_new_tokens: 2048 },
  }),
});
```

Never guess option names. When in doubt, read the SDK TypeScript types or IBM API docs.

## Performance Checklist

- [ ] NLU calls are parallel (`Promise.all`), not sequential
- [ ] Granite rubric call is a single batched prompt covering all slides
- [ ] File parsing is streamed where possible (avoid loading full PPTX into memory for large files)
- [ ] Total `/api/analyze` wall time < 45s for 15-slide deck (measure with `console.time` in dev)
