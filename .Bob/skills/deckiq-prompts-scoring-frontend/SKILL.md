---
name: deckiq-prompts-scoring-frontend
description: Use this skill when working on Granite prompt builders (src/lib/ibm/prompts/), the scoring aggregator (src/lib/scoring/aggregator.ts), shared TypeScript types (src/types/index.ts), or frontend components and pages (src/components/, src/app/report/, src/app/slide-review/). Covers Person B's ownership areas.
---

# DeckIQ Prompts, Scoring & UI Skill

## Before You Start

1. Read `DeckIQ_PRD_v2.md` -- it contains the exact 10-dimension weight table, tone modifier formula, prompt templates, and expected JSON shapes.
2. Read `AGENTS.md` -- project conventions and collaboration rules.
3. Review `src/types/index.ts` in full before making any change to types.

## Files You Own (Person B)

| File | Purpose |
|---|---|
| `src/types/index.ts` | All shared TypeScript types (jointly owned with Person A) |
| `src/lib/ibm/prompts/rubric-prompt.ts` | Build Granite prompt for 10-dimension VC rubric scoring |
| `src/lib/ibm/prompts/fixes-prompt.ts` | Build Granite prompt for Top 3 Critical Fixes |
| `src/lib/ibm/prompts/investor-prompt.ts` | Build Granite prompt for Investor Perspective Summary |
| `src/lib/ibm/prompts/rewrite-prompt.ts` | Build Granite prompt for per-slide rewrite |
| `src/lib/scoring/aggregator.ts` | Weight table, tone modifiers, health score formula |
| `src/components/*.tsx` | Result display components |
| `src/app/report/page.tsx` | Full analysis report page |
| `src/app/slide-review/page.tsx` | Per-slide detail view |

## Plan-First Workflow

Output a numbered checklist of edits before writing any code, and wait for confirmation.

## Shared Types

`src/types/index.ts` is the single source of truth for all data contracts. Guidelines:

- Never duplicate a type in any other file. Import from `types/index.ts`.
- Any type change must be coordinated with Person A because it affects the API route response shape.
- Use `readonly` arrays where mutation is not needed.
- Export every type (no barrel re-exports from sub-modules).

Minimum required types (add others from PRD as needed):

```typescript
export interface SlideRawText {
  index: number;
  text: string;
}

export interface NLUResult {
  slideIndex: number;
  sentiment: { label: string; score: number };
  emotion: Record<string, number>;
  keywords: Array<{ text: string; relevance: number }>;
  entities: Array<{ text: string; type: string; relevance: number }>;
  categories: Array<{ label: string; score: number }>;
  concepts: Array<{ text: string; relevance: number }>;
}

export interface RubricScores {
  problemClarity: number;
  solutionStrength: number;
  marketOpportunity: number;
  businessModel: number;
  competitiveLandscape: number;
  teamCredibility: number;
  tractionProof: number;
  financialViability: number;
  narrativeFlow: number;
  visualDesign: number;
}

export interface SlideAnalysis {
  slideIndex: number;
  title: string;
  rawText: string;
  nlu: NLUResult;
  rubric: RubricScores;
  rewriteSuggestion?: string;
}

export interface CriticalFix {
  dimension: keyof RubricScores;
  issue: string;
  suggestion: string;
  priority: 1 | 2 | 3;
}

export interface EmotionalJourneyPoint {
  slideIndex: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  intensity: number; // 0-1
}

export interface DeckAnalysisResult {
  deckId: string;
  filename: string;
  slideCount: number;
  slides: SlideAnalysis[];
  deckHealthScore: number; // 0-100
  rubricAverages: RubricScores;
  criticalFixes: [CriticalFix, CriticalFix, CriticalFix]; // exactly 3
  investorPerspective: string;
  emotionalJourney: EmotionalJourneyPoint[];
  processingTimeMs: number;
}
```

## Prompt Engineering Rules

All prompts in `src/lib/ibm/prompts/` must:

1. **Return valid JSON only.** Begin system instruction with: `"You are a JSON API. Respond ONLY with valid JSON matching the schema below. No explanation, no markdown, no preamble."`
2. **Include the target schema** in the prompt as a TypeScript interface or JSON Schema comment.
3. **Include a one-shot example** of expected output.
4. **Be deterministic** -- use `decoding_method: 'greedy'` for all structured JSON calls.

### Rubric Prompt (`rubric-prompt.ts`)

```typescript
export function buildRubricPrompt(slides: SlideContent[], deckMapSummary: string): string
```

Input: all slide texts + NLU deck map summary.
Output: Granite prompt that scores all 10 dimensions for each slide.

Expected Granite JSON output shape:
```json
{
  "slides": [
    {
      "slideIndex": 0,
      "scores": {
        "problemClarity": 7,
        "solutionStrength": 8,
        "marketOpportunity": 6,
        "businessModel": 5,
        "competitiveLandscape": 4,
        "teamCredibility": 9,
        "tractionProof": 3,
        "financialViability": 6,
        "narrativeFlow": 7,
        "visualDesign": 8
      }
    }
  ]
}
```

Scores are integers 0-10. Validate range in the aggregator, not in the prompt.

### Fixes Prompt (`fixes-prompt.ts`)

```typescript
export function buildFixesPrompt(rubricAverages: RubricScores, deckMapSummary: string): string
```

Output: exactly 3 `CriticalFix` objects ordered by priority (1 = most critical).

```json
{
  "criticalFixes": [
    { "dimension": "tractionProof", "issue": "...", "suggestion": "...", "priority": 1 },
    { "dimension": "financialViability", "issue": "...", "suggestion": "...", "priority": 2 },
    { "dimension": "competitiveLandscape", "issue": "...", "suggestion": "...", "priority": 3 }
  ]
}
```

### Investor Prompt (`investor-prompt.ts`)

```typescript
export function buildInvestorPrompt(result: Omit<DeckAnalysisResult, 'investorPerspective'>): string
```

Output: `{ "investorPerspective": "..." }` -- 2-3 paragraph plain text inside JSON string.

### Rewrite Prompt (`rewrite-prompt.ts`)

```typescript
export function buildRewritePrompt(slide: SlideAnalysis): string
```

Output: `{ "rewriteSuggestion": "..." }` -- improved slide copy.

## Scoring Aggregator (`aggregator.ts`)

### Weight Table (from PRD)

```typescript
const DIMENSION_WEIGHTS: Record<keyof RubricScores, number> = {
  problemClarity:       0.15,
  solutionStrength:     0.15,
  marketOpportunity:    0.12,
  businessModel:        0.12,
  competitiveLandscape: 0.08,
  teamCredibility:      0.13,
  tractionProof:        0.10,
  financialViability:   0.08,
  narrativeFlow:        0.04,
  visualDesign:         0.03,
};
// Weights MUST sum to 1.0 -- add a startup assertion
```

### Health Score Formula

```
baseScore = sum(dimensionAverage[d] * DIMENSION_WEIGHTS[d]) * 10   // 0-100
toneBonus = toneModifier(overallSentiment)                          // -5 to +5
healthScore = clamp(baseScore + toneBonus, 0, 100)
```

Tone modifier: positive sentiment -> +5, neutral -> 0, negative -> -5. Interpolate for mixed.

### Exported API

```typescript
export function computeRubricAverages(slides: SlideAnalysis[]): RubricScores
export function computeHealthScore(averages: RubricScores, overallSentiment: number): number
export function buildEmotionalJourney(nluResults: NLUResult[]): EmotionalJourneyPoint[]
```

All functions must be pure (no side effects, no IBM calls).

## Frontend Wiring

- Use React Server Components for static parts of report/page.tsx.
- Use `use client` only for interactive components (e.g., radar chart, slide carousel).
- Fetch `DeckAnalysisResult` from `/api/analyze` via `fetch()` in the upload flow, then pass via URL params or session storage to the report page.
- Show loading state during analysis (progress indicator, estimated time).
- Show error state with user-friendly message for each `AppError` code.

### Component Contracts

```typescript
// DeckHealthGauge: displays healthScore 0-100 as arc gauge
<DeckHealthGauge score={result.deckHealthScore} />

// RubricRadar: spider chart of rubricAverages (10 dimensions)
<RubricRadar scores={result.rubricAverages} />

// CriticalFixList: ordered list of 3 fixes
<CriticalFixList fixes={result.criticalFixes} />

// SlideCard: summary card for one slide
<SlideCard slide={result.slides[i]} />

// InvestorSummary: renders investorPerspective string
<InvestorSummary text={result.investorPerspective} />
```

## Tests

For every prompt builder: add a unit test that verifies the output string contains the JSON schema and example. For the aggregator: test weight sum assertion, health score clamping, and emotional journey mapping.
