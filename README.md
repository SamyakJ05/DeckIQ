# DeckIQ — AI-Powered Pitch Deck Critique

> Built for the **IBM Bob Hackathon** (lablab.ai) · May 2026  
> Developed end-to-end using **IBM Bob** as the primary AI development partner

DeckIQ accepts a PDF or PPTX pitch deck, analyses it slide-by-slide with IBM Watson NLU and IBM watsonx.ai Granite, and returns a **Deck Health Score (0–100)** with a 10-dimension VC rubric, top-3 critical fixes, and an investor-perspective summary — in under 60 seconds.

**Demo hook:** The hackathon submission deck is run through DeckIQ live during the demo. The tool critiques the very pitch judges are watching. Score starts at 61/100, climbs to 79/100 after applying the top-3 fixes in real time.

---

## The Problem

Founders spend weeks on pitch decks, yet 90%+ never get a second meeting. The common culprits — weak problem framing, missing traction, unclear ask — are fixable, but invisible without an outside perspective. Professional deck coaches charge $500–$2,000 per session. DeckIQ closes that loop for free, in seconds.

---

## IBM Technology Stack

| Component | IBM Technology |
|---|---|
| Primary IDE & code generation | **IBM Bob** (Plan Mode, Literate Coding, UI Scaffolding, Test Generation) |
| Slide-level NLU | **IBM Watson NLU** — sentiment, tone, entities, keywords per slide |
| Semantic scoring & rewrite | **IBM watsonx.ai Granite** (`ibm/granite-3-3-8b-instruct`) |

### Full Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes, TypeScript strict |
| Parsing | `pdf-parse`, `officeparser` |
| Testing | Jest + ts-jest |
| Runtime | Node.js 20+ |

---

## Features

- **Upload** — drag-and-drop PDF or PPTX (up to 50 MB)
- **Deck Health Score** — single 0–100 score with weighted 10-dimension breakdown
- **VC Rubric** — Problem Clarity, Solution Fit, Market Size, Traction, Business Model, Competitive Moat, Team Strength, Ask Clarity, Narrative Flow, Visual Cohesion
- **Top-3 Critical Fixes** — prioritised, slide-specific action items
- **Investor Perspective Summary** — Granite-generated first-person VC take
- **Per-slide Analysis** — NLU sentiment + rubric scores for every slide
- **Rewrite Suggestions** — on-demand Granite rewrites per slide
- **Emotional Journey** — sentiment arc across the deck
- **Re-score** — adjust rubric weights and re-run scoring without re-calling NLU

---

## IBM Bob Usage

IBM Bob was used as the SDLC partner throughout the entire build:

| Bob Feature | How It Was Used |
|---|---|
| **Plan Mode** | Architected full file structure, API design, and component plan before writing code |
| **Literate Coding** | PDF parsing, NLU wiring, and prompt logic written in plain English first; Bob generated implementation |
| **Bob Tips** | Flagged code quality issues in the scoring engine; improved test coverage |
| **UI Scaffolding** | All Tailwind components generated from natural language descriptions |
| **Test Generation** | Jest tests for `/api/analyze` route generated via Bob |

Bob session transcripts are preserved in [`bob_sessions/`](bob_sessions/) as hackathon evidence.

---

## Analysis Pipeline

```
Upload (PDF/PPTX)
  → Parse slides to raw text
  → Segment into SlideContent[]
  → Watson NLU per slide (parallel, 10s timeout)
  → Build deck structural map
  → Granite: 10-dimension rubric scoring
  → Aggregate scores → Deck Health Score
  → Granite: Top-3 Critical Fixes
  → Granite: Investor Perspective Summary
  → Return DeckAnalysisResult JSON
```

Target: **< 45 seconds** for a 15-slide deck.

---

## Getting Started

### Prerequisites

- Node.js 20+
- IBM Watson NLU instance (Lite tier works)
- IBM watsonx.ai project with Granite access

### Environment Variables

Create `.env.local` (never commit):

```bash
# Watson NLU
NLU_API_KEY=your_nlu_api_key
NLU_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com

# watsonx.ai
WATSONX_API_KEY=your_watsonx_api_key
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your_project_id
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Tests

```bash
npm test
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # Main upload + analysis endpoint
│   │   ├── rewrite/route.ts      # Per-slide rewrite suggestions
│   │   └── rescore/route.ts      # Re-score with updated weights
│   ├── upload/page.tsx
│   ├── report/page.tsx
│   └── slide-review/page.tsx
├── lib/
│   ├── parsers/                  # PDF + PPTX → text per slide
│   ├── segmentation/             # Text → SlideContent[]
│   ├── ibm/
│   │   ├── nlu-client.ts         # Watson NLU wrapper
│   │   ├── granite-client.ts     # watsonx.ai Granite wrapper
│   │   └── prompts/              # Rubric, fixes, investor, rewrite prompts
│   └── scoring/aggregator.ts     # Weight table + health score
├── types/index.ts                # All shared types (source of truth)
└── components/                   # DeckHealthGauge, RubricRadar, etc.
bob_sessions/                     # IBM Bob session transcripts
__tests__/                        # Jest tests mirror src/ structure
```

---

## Hackathon Submission

- **Event:** IBM Bob Hackathon on lablab.ai
- **Deadline:** May 17, 2026
- **Built by:** Samyak
- **Primary AI tool:** IBM Bob

---

## License

MIT
