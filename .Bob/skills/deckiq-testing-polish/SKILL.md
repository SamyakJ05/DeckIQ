---
name: "DeckIQ Testing & Polish"
description: >
  Use this skill for QA passes, edge case validation, performance tuning, logging,
  feature flags, and hackathon submission preparation. Use after core features are
  implemented but before the demo or submission deadline.
---

# DeckIQ Testing & Polish Skill

## Before You Start

1. Review `AGENTS.md` -- especially the Acceptance Criteria checklist.
2. Read `DeckIQ_PRD_v2.md` -- acceptance criteria and performance targets are the acceptance bar.
3. Run the existing test suite first: `npm test -- --verbose`.

## Acceptance Criteria Checklist

Work through these in order. Do not mark complete until verified with a real file or test.

### API Correctness
- [ ] `POST /api/analyze` with valid PDF -> HTTP 200, body matches `DeckAnalysisResult` schema
- [ ] `POST /api/analyze` with valid PPTX -> HTTP 200, body matches `DeckAnalysisResult` schema
- [ ] `POST /api/analyze` with invalid MIME type -> HTTP 415 with `AppError` JSON
- [ ] `POST /api/analyze` with file > 50 MB -> HTTP 413 with `AppError` JSON
- [ ] `POST /api/rewrite` with valid `SlideAnalysis` -> HTTP 200, `rewriteSuggestion` string present
- [ ] `POST /api/rescore` with custom weights -> HTTP 200, recalculated `deckHealthScore`

### Scoring Validity
- [ ] `deckHealthScore` is always 0-100 (never NaN, never outside range)
- [ ] `criticalFixes` array always has exactly 3 elements
- [ ] `rubricAverages` values all in 0-10 range
- [ ] `emotionalJourney` length equals `slideCount`

### Edge Cases
- [ ] 1-slide deck: processes without crash, returns single-element arrays
- [ ] 30-slide deck: returns result (may exceed 45s -- log warning, don't fail)
- [ ] PDF with image-only slides: `rawText: ''` in affected slides, no crash
- [ ] PPTX with embedded media only: same as above
- [ ] NLU API timeout (simulate with mock): returns partial results with fallback NLU stubs, HTTP 200
- [ ] Granite timeout (simulate): retries up to 3 times, then returns HTTP 502
- [ ] Granite returns invalid JSON (simulate): retries with temperature nudge, eventually succeeds or returns 502

### Performance
- [ ] 15-slide PDF: wall time < 45 seconds (measure end-to-end including network)
- [ ] NLU calls run in parallel (verify with timing logs)
- [ ] Granite rubric is a single call, not per-slide calls

### Frontend
- [ ] Report page renders without console errors for valid `DeckAnalysisResult`
- [ ] Loading state visible during analysis (spinner or progress)
- [ ] Error state renders user-friendly message for each AppError code
- [ ] Gauge, radar chart, fix list, and investor summary all display correctly
- [ ] Slide review page shows per-slide rewrite suggestion

## Sample Deck Fixtures

Create or place sample files in `__tests__/fixtures/`:

```
__tests__/fixtures/
├── sample-10-slides.pdf     # Normal deck, all text slides
├── sample-3-slides.pptx     # Minimal deck
├── sample-image-only.pdf    # PDF with no extractable text
└── sample-30-slides.pdf     # Large deck for performance test
```

Use these in integration tests and for manual demo verification.

## Logging & Observability

Add structured logging at key pipeline stages:

```typescript
// Use a thin wrapper, not console.log
import { log } from '@/lib/utils/logger';

log.info('pipeline.start', { filename, slideCount, fileSize });
log.info('nlu.complete', { slideIndex, durationMs });
log.info('granite.attempt', { attempt, model });
log.warn('granite.retry', { attempt, error: err.message });
log.info('pipeline.complete', { deckId, totalMs, healthScore });
log.error('pipeline.error', { code: err.code, message: err.message });
```

Logger should write JSON lines in production (`NODE_ENV === 'production'`) and pretty-print in dev.

## Feature Flags

Read from environment variables. Do not use a feature-flag service -- keep it simple.

```typescript
const FLAGS = {
  contextualMemory: process.env.USE_CONTEXTUAL_MEMORY === 'true',
  granite8bModel:   process.env.FORCE_GRANITE_2B !== 'true',
  debugTiming:      process.env.DEBUG_TIMING === 'true',
} as const;
```

Check flags at the call site, not deep in lib functions.

## Performance Tuning

If 15-slide analysis exceeds 45s, investigate in this order:

1. **NLU parallelism**: verify `Promise.all` is used, not sequential `for await`.
2. **Granite prompt size**: trim NLU data included in rubric prompt (keywords top-5 only, entities top-5 only).
3. **File parsing**: ensure PDF/PPTX parsing is not blocking the event loop (use worker threads if needed).
4. **IAM token caching**: cache the watsonx.ai IAM access token for its TTL (~3600s) rather than fetching per request.

## Hackathon Submission Checklist

- [ ] All Acceptance Criteria above are checked
- [ ] `bob_sessions/` directory contains at least 5 Bob session transcripts (one per major feature)
- [ ] `README.md` updated with: project description, setup instructions, `.env.local` variables list, `npm run dev` command
- [ ] Demo video or live URL prepared
- [ ] No API keys or `.env.local` committed to git (verify with `git log --all -- .env.local`)
- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` passes with no failures

## README Sections to Generate

When generating README updates, include:

1. **What is DeckIQ** -- 2-3 sentences
2. **Demo** -- screenshot or GIF placeholder
3. **Tech Stack** -- table (same as AGENTS.md)
4. **Setup** -- prerequisites, clone, install, `.env.local` config, `npm run dev`
5. **How It Works** -- 6-step pipeline diagram (text ASCII is fine)
6. **IBM Technologies Used** -- Watson NLU + watsonx.ai Granite with model names
7. **Hackathon** -- IBM Bob hackathon entry note
