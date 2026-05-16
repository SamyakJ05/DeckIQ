# Product Requirements Document
## DeckIQ — AI-Powered Pitch Deck Critique Tool
**Version:** 1.0  
**Hackathon:** IBM Bob Hackathon (lablab.ai) — Submission Deadline: May 17, 2026  
**Author:** Samyak  
**Stack:** IBM Bob (IDE) · IBM Watson NLU · IBM watsonx.ai Granite · Next.js 14 · Node.js  

---

## 1. Executive Summary

DeckIQ is a web application that accepts a pitch deck (PDF or PPTX), extracts its textual content slide-by-slide, runs dual AI analysis through IBM Watson NLU (sentiment, tone, entity, keyword extraction) and IBM watsonx.ai Granite (semantic reasoning, rubric scoring, rewrite suggestions), and returns a structured **Deck Health Score** (0–100) with per-slide breakdowns and actionable fix recommendations.

The product is designed for first-time founders who send decks "into silence" — no feedback, no signal. DeckIQ closes that loop in under 60 seconds.

**Demo hook:** The hackathon submission deck itself is run through DeckIQ live during the demo video. The tool critiques the very pitch judges are watching. Score: starts at 61/100, improves to 79/100 after applying the top-3 fixes in real time.

---

## 2. Problem Statement

Founders spend weeks crafting pitch decks, yet 90%+ of decks never get a second meeting. The common reasons — weak problem framing, missing traction, unclear ask — are fixable but invisible to founders without an outside perspective. Professional deck coaches charge $500–$2,000 per review session, creating a gatekeeping problem for early-stage founders. Existing AI tools either generate decks (Gamma, Beautiful.ai) or provide one-shot generic feedback with no scoring, no iteration loop, and no investor-perspective framing.

---

## 3. Goals & Non-Goals

### Goals
- Parse a PDF or PPTX pitch deck into individual slide-level text chunks
- Score each slide and the overall deck on 10 VC evaluation dimensions
- Surface the top 3 critical fixes that will most improve investor readiness
- Use IBM Watson NLU for tone, sentiment, and entity analysis per slide
- Use IBM watsonx.ai Granite for semantic scoring, rubric reasoning, and rewrite suggestion generation
- Use IBM Bob as the primary IDE and code generation partner throughout development
- Deliver a polished, demo-ready web UI in under 48 hours
- Produce a YouTube demo video with the self-referential live demo as the closing moment

### Non-Goals (for v1/hackathon scope)
- User authentication / account system
- Persistent deck storage or history
- Slide-level design/visual critique (layout, fonts, color)
- Integration with Notion, Google Slides, or Canva
- Mobile-native app
- Multi-language support (English only for v1)
- Pitch deck generation (this is a critique tool, not a generation tool)

---

## 4. Target Users

### Primary User: Early-Stage Founder
- Building a pre-seed or seed deck for the first time
- No access to a VC advisor or paid deck coach
- Wants fast, specific, actionable feedback before sending to investors
- Technical sophistication: varies; UI must be zero-friction

### Secondary User: Accelerator Program Mentor
- Evaluates 10–30 decks per cohort
- Wants a structured scorecard to benchmark applicants consistently
- Values the 10-dimension rubric as a common evaluation language

### Demo-Day User (Hackathon-Specific)
- IBM/lablab.ai judges who evaluate product submissions
- Judges evaluate pitches professionally — they will personally feel the tool's value
- The self-referential demo directly targets this user persona

---

## 5. IBM Technology Integration

### 5.1 IBM Bob (Primary IDE)
IBM Bob is used as the SDLC partner for the entire build. Specific usage that must be documented in bob_sessions/:

| Bob Feature | How It's Used |
|---|---|
| **Plan Mode** | Architect full file structure, API design, and component plan before writing a line of code |
| **Literate Coding** | Write PDF parsing and AI prompt logic in plain English first; Bob generates implementation |
| **Bob Tips** | Flag code quality issues in scoring engine; improve test coverage |
| **UI Scaffolding** | Generate all Tailwind components from natural language descriptions |
| **Test Generation** | Generate Jest tests for the /api/analyze route |
| **Session Export** | Target 6–8 exported task sessions across the 48-hour build |

### 5.2 IBM Watson Natural Language Understanding (NLU)
Watson NLU is used at the **slide-level text analysis layer**. For each slide's extracted text, the NLU API call returns:

| NLU Feature | Output Used In DeckIQ |
|---|---|
| **Sentiment** (document-level) | Slide sentiment score: positive / negative / neutral + magnitude |
| **Tone** (Classifications model) | Tone flags: excited, frustrated, polite, sad, satisfied, sympathetic |
| **Keywords** | Top 5 keywords per slide — displayed in the slide breakdown card |
| **Entities** | Named entities (companies, people, metrics) — used to detect if traction slide has real company names |
| **Categories** | IBM taxonomy categories — used to validate slide topic alignment (e.g., "Team" slide should not classify as "Finance") |
| **Emotion** (via entity/keyword sub-features) | Joy, Fear, Anger, Disgust, Sadness scores per slide — used to generate an "Investor Emotional Journey" chart |

**NLU Scoring Logic:** Each tone flag and sentiment reading feeds a weighted sub-score per rubric dimension. For example:
- Problem slide with `sad` or `frustrated` tone scores +5 on Dimension 1 (Problem Clarity) — founder feels the pain
- Ask slide with `excited` and `polite` tone scores +5 on Dimension 8 (Ask Clarity) — confident and direct
- Any slide with `impolite` tone flags a red warning badge regardless of rubric score

**API call structure (per slide):**
```javascript
const nluResponse = await nluInstance.analyze({
  text: slideText,
  features: {
    sentiment: {},
    keywords: { emotion: true, sentiment: true, limit: 5 },
    entities: { emotion: true, sentiment: true, limit: 5 },
    categories: { limit: 3 },
    classifications: { model: 'tone-classifications-en-v1' }
  }
});
```

### 5.3 IBM watsonx.ai (Granite Model)
Granite is used for the **semantic reasoning layer** — the part that requires understanding context across the whole deck, not just individual slides.

| Granite Task | Prompt Type | Output |
|---|---|---|
| **Rubric Scoring** | Per-slide prompt with 10-dimension rubric context | JSON: `{ dimension: score, rationale: string }` |
| **Deck Narrative Analysis** | Full deck text (all slides concatenated) | Narrative Flow score + storyline coherence comment |
| **Top 3 Critical Fixes** | Scored rubric JSON as input | Ranked list of 3 fixes with specific, actionable wording |
| **Slide Rewrite Suggestions** | Individual slide text + fix instruction | Rewritten slide content (bullet-point format) |
| **Investor Perspective Summary** | Full deck text | 3-sentence investor read summary |

**Model used:** `ibm/granite-3-3-8b-instruct` (fast inference, strong instruction following, available on watsonx.ai Lite tier)

**Fallback:** `ibm/granite-3-3-2b-instruct` if Lite tier rate limits are hit during demo

---

## 6. Feature Specifications

### 6.1 Upload Screen (Landing Page)

**Purpose:** Accept deck file input with zero friction.

**Elements:**
- Product name + tagline: "Get investor-ready feedback in 60 seconds"
- Drag-and-drop zone accepting `.pdf` and `.pptx` (max 20MB)
- "Or paste deck text" toggle — fallback for text-only submission
- Sample deck button: loads the Airbnb Series A deck for demo purposes
- Progress indicator: "Uploading → Extracting → Analyzing → Scoring" step bar

**Validation:**
- File type check: reject non-PDF/PPTX with clear error message
- File size check: reject > 20MB with suggestion to compress
- Minimum slide count: warn if < 5 slides extracted ("Decks typically have 10–15 slides")

### 6.2 Analysis Engine (Backend API)

**Route:** `POST /api/analyze`

**Pipeline:**

```
Input (PDF/PPTX)
  ↓
[Step 1] File parsing
  → PDF: pdf-parse (Node.js) → raw text per page
  → PPTX: pptx-parse or python-pptx subprocess → text per slide

  ↓
[Step 2] Slide segmentation
  → Split text into slide objects: { slideNumber, title, bodyText, estimatedSlideType }
  → estimatedSlideType: heuristic classifier (Title | Problem | Solution | Market | Traction | BusinessModel | Team | Competition | Ask | Other)

  ↓
[Step 3] IBM Watson NLU — per slide
  → Parallel API calls (Promise.all) for each slide
  → Returns: { sentiment, tone, keywords, entities, categories, emotion }

  ↓
[Step 4] IBM watsonx.ai Granite — per slide + full deck
  → Per-slide rubric scoring (10 dimensions, 0–10 each)
  → Full-deck narrative analysis
  → Top 3 critical fixes
  → Investor perspective summary

  ↓
[Step 5] Score aggregation
  → Per-slide health score = weighted average of rubric scores
  → Overall Deck Health Score = weighted aggregate (see Section 6.4)

  ↓
[Step 6] Response assembly
  → JSON payload: { overallScore, perSlideScores, rubricBreakdown, criticalFixes, emotionalJourney, investorSummary }
```

**Error handling:**
- NLU API timeout (>10s): use cached null scores, flag slide as "NLU unavailable"
- Granite rate limit: queue with exponential backoff (max 3 retries)
- Unreadable PDF: return error with specific message "This PDF may be image-based. Try exporting as text-selectable PDF."

**Performance target:** Full analysis response < 45 seconds for a 15-slide deck

### 6.3 Results Dashboard (Frontend)

**Layout:** Single-page results view with sticky sidebar navigation

**Sections:**

#### A. Hero Score Card
- Large animated odometer counting up to the Deck Health Score (0–100)
- Color gradient: 0–40 (red), 41–65 (amber), 66–85 (teal), 86–100 (green)
- One-line verdict below score: e.g., "Strong foundation, but your traction story needs work"
- Score context: "Better than X% of decks we've analyzed" (seeded benchmark for demo)

#### B. Top 3 Critical Fixes Panel
- Numbered, high-contrast cards
- Each fix: Fix title + specific description + estimated score impact (e.g., "+8 points if addressed")
- "Get Rewrite" CTA button on each card — triggers Granite rewrite for that slide

#### C. 10-Dimension Rubric Breakdown
- Horizontal progress bars for each of the 10 dimensions
- Color-coded: green (7–10), amber (4–6), red (0–3)
- Expand each dimension to see: NLU tone findings + Granite rationale comment
- Tooltip on each dimension name: definition of what it measures

#### D. Per-Slide Breakdown
- Accordion list — one row per extracted slide
- Each row: slide number + inferred type badge + slide-level health score + top NLU keyword chips
- Expand a slide to see: full extracted text, tone flags, sentiment badge, per-dimension scores, "Rewrite this slide" button

#### E. Investor Emotional Journey Chart
- Line chart: X-axis = slide number, Y-axis = NLU sentiment magnitude (-1 to +1)
- Secondary overlay: tone flags (excited, frustrated, impolite) as icon markers on the line
- Title: "How an investor emotionally experiences your deck"
- Insight callout: auto-generated sentence about the emotional arc (e.g., "Investor excitement peaks at slide 4 but drops sharply at slide 7")

#### F. Rewrite Modal
- Triggered by "Get Rewrite" or "Rewrite this slide" CTAs
- Left panel: original slide text (read-only)
- Right panel: Granite-generated rewrite (editable textarea)
- "Apply & Rescore" button — re-runs NLU and Granite on the new text, updates score live
- "Copy to clipboard" button

#### G. Investor Perspective Summary
- Collapsible panel at the bottom
- 3-sentence Granite-generated summary: "Here's what an investor reads from your deck in 90 seconds"
- Tone: direct, first-person investor voice (e.g., "The problem is compelling, but I can't tell if you have customers yet.")

### 6.4 Deck Health Score Formula

The overall Deck Health Score is a weighted aggregate of the 10 rubric dimensions:

| Dimension | Weight | Rationale |
|---|---|---|
| Problem Clarity | 10% | Table stakes — must be clear |
| Solution Fit | 10% | Directly tied to problem weight |
| Market Size | 10% | VCs need TAM validation |
| Traction Evidence | 20% | Highest weight — most predictive of fundability |
| Business Model | 10% | Must exist, doesn't need to be detailed |
| Competitive Moat | 8% | Important but less critical at pre-seed |
| Team Strength | 12% | Second highest — team is the bet at early stage |
| Ask Clarity | 10% | Must be specific to close the loop |
| Narrative Flow | 8% | Holistic deck quality signal |
| Investor Readiness | 2% | Hygiene check (no missing slides, no red flags) |

NLU tone signals modify the final score with a bonus/penalty layer:
- `impolite` flag on any slide: -3 points to overall score
- `excited` on Ask slide AND `polite` on Team slide: +2 bonus
- `frustrated` on Problem slide: +1 bonus (founders who feel pain communicate authentically)
- Sentiment consistently negative across > 50% of slides: -2 penalty

### 6.5 Slide Type Heuristics

The slide segmentation step classifies each extracted slide into a type using keyword matching:

| Slide Type | Trigger Keywords |
|---|---|
| Title | first slide OR contains company name + tagline pattern |
| Problem | "problem", "pain", "challenge", "struggle", "currently", "today" |
| Solution | "solution", "we built", "our product", "introducing", "platform" |
| Market | "market", "TAM", "SAM", "SOM", "billion", "opportunity", "addressable" |
| Traction | "MRR", "ARR", "users", "growth", "customers", "revenue", "retention" |
| Business Model | "pricing", "revenue model", "subscription", "per seat", "freemium" |
| Team | "founder", "CEO", "CTO", "previously", "experience", "background" |
| Competition | "competitor", "vs", "alternative", "landscape", "differentiated" |
| Ask | "raising", "seeking", "use of funds", "milestone", "runway" |
| Other | Slides not matching any above pattern |

---

## 7. Technical Architecture

### 7.1 Project Structure

```
deckiq/
├── app/
│   ├── page.tsx                   # Upload screen
│   ├── results/
│   │   └── page.tsx               # Results dashboard
│   └── api/
│       ├── analyze/
│       │   └── route.ts           # Main analysis pipeline
│       ├── rewrite/
│       │   └── route.ts           # Slide rewrite endpoint
│       └── rescore/
│           └── route.ts           # Re-score after rewrite
├── lib/
│   ├── parsers/
│   │   ├── pdf-parser.ts          # pdf-parse wrapper
│   │   └── pptx-parser.ts         # pptx parsing logic
│   ├── segmentation/
│   │   └── slide-segmenter.ts     # Slide type classification
│   ├── ibm/
│   │   ├── nlu-client.ts          # Watson NLU API wrapper
│   │   ├── granite-client.ts      # watsonx.ai Granite API wrapper
│   │   └── prompts/
│   │       ├── rubric-scoring.ts  # 10-dimension scoring prompt
│   │       ├── narrative.ts       # Full-deck narrative prompt
│   │       ├── critical-fixes.ts  # Top 3 fixes prompt
│   │       ├── rewrite.ts         # Slide rewrite prompt
│   │       └── investor-summary.ts # Investor perspective prompt
│   └── scoring/
│       └── aggregator.ts          # Score weighting + NLU modifier logic
├── components/
│   ├── UploadZone.tsx
│   ├── ScoreOdometer.tsx
│   ├── RubricBreakdown.tsx
│   ├── SlideAccordion.tsx
│   ├── EmotionalJourneyChart.tsx
│   ├── CriticalFixes.tsx
│   └── RewriteModal.tsx
├── types/
│   └── index.ts                   # Shared TypeScript interfaces
└── bob_sessions/                  # IBM Bob exported task sessions
    ├── session_01_architecture.json
    ├── session_02_parsers.json
    ├── session_03_nlu_integration.json
    ├── session_04_granite_prompts.json
    ├── session_05_scoring_engine.json
    ├── session_06_ui_dashboard.json
    ├── session_07_rewrite_modal.json
    └── session_08_testing.json
```

### 7.2 Key TypeScript Interfaces

```typescript
interface SlideAnalysis {
  slideNumber: number;
  slideType: SlideType;
  rawText: string;
  nluResult: NLUResult;
  graniteScores: RubricScores;
  slideHealthScore: number;
}

interface NLUResult {
  sentiment: { label: string; score: number };
  tone: ToneFlag[];
  keywords: Keyword[];
  entities: Entity[];
  emotion: { joy: number; fear: number; anger: number; disgust: number; sadness: number };
}

interface RubricScores {
  problemClarity: { score: number; rationale: string };
  solutionFit: { score: number; rationale: string };
  marketSize: { score: number; rationale: string };
  tractionEvidence: { score: number; rationale: string };
  businessModel: { score: number; rationale: string };
  competitiveMoat: { score: number; rationale: string };
  teamStrength: { score: number; rationale: string };
  askClarity: { score: number; rationale: string };
  narrativeFlow: { score: number; rationale: string };
  investorReadiness: { score: number; rationale: string };
}

interface DeckAnalysisResult {
  overallScore: number;
  verdict: string;
  rubricBreakdown: RubricScores;
  perSlideAnalysis: SlideAnalysis[];
  criticalFixes: CriticalFix[];
  investorSummary: string;
  emotionalJourney: EmotionalJourneyPoint[];
}
```

### 7.3 Environment Variables

```env
# IBM Watson NLU
NLU_API_KEY=your_nlu_api_key
NLU_URL=https://api.us-south.natural-language-understanding.watson.cloud.ibm.com

# IBM watsonx.ai
WATSONX_API_KEY=your_watsonx_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# App
MAX_FILE_SIZE_MB=20
ANALYSIS_TIMEOUT_MS=45000
```

### 7.4 Dependencies

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "@ibm-cloud/sdk-core": "^5.x",
    "ibm-watson": "^9.x",
    "pdf-parse": "^1.1.1",
    "officeparser": "^4.x",
    "recharts": "^2.x",
    "framer-motion": "^11.x",
    "react-dropzone": "^14.x",
    "axios": "^1.x"
  }
}
```

---

## 8. Prompt Engineering Specifications

### 8.1 Rubric Scoring Prompt (Granite)

```
You are a senior venture capital analyst evaluating a startup pitch deck slide.

SLIDE TYPE: {slideType}
SLIDE TEXT:
"""
{slideText}
"""

NLU ANALYSIS:
- Sentiment: {sentiment.label} (score: {sentiment.score})
- Top tone: {tone[0].label} (confidence: {tone[0].score})
- Key entities detected: {entities.map(e => e.text).join(', ')}

Score this slide on the following dimensions (0-10 each).
Only score dimensions relevant to this slide type. Return 0 for irrelevant dimensions.

Return ONLY valid JSON in this exact format:
{
  "problemClarity": { "score": 0, "rationale": "one sentence" },
  "solutionFit": { "score": 0, "rationale": "one sentence" },
  "marketSize": { "score": 0, "rationale": "one sentence" },
  "tractionEvidence": { "score": 0, "rationale": "one sentence" },
  "businessModel": { "score": 0, "rationale": "one sentence" },
  "competitiveMoat": { "score": 0, "rationale": "one sentence" },
  "teamStrength": { "score": 0, "rationale": "one sentence" },
  "askClarity": { "score": 0, "rationale": "one sentence" },
  "narrativeFlow": { "score": 0, "rationale": "one sentence" },
  "investorReadiness": { "score": 0, "rationale": "one sentence" }
}
```

### 8.2 Critical Fixes Prompt (Granite)

```
You are a pitch deck coach. Based on the rubric scores below, identify exactly 3 critical fixes 
that will most improve this deck's investor readiness. Rank them by impact.

RUBRIC SCORES (aggregated across all slides):
{JSON.stringify(aggregatedRubricScores, null, 2)}

DECK CONTEXT: {slideCount} slides, overall score {overallScore}/100

Return ONLY valid JSON:
[
  {
    "rank": 1,
    "dimension": "dimensionName",
    "fix": "Specific, actionable instruction in one sentence",
    "estimatedScoreImpact": 8,
    "slideToFix": 3
  }
]
```

### 8.3 Rewrite Prompt (Granite)

```
You are a pitch deck writer helping a founder improve a weak slide.

ORIGINAL SLIDE ({slideType}):
"""
{slideText}
"""

SPECIFIC FIX TO APPLY:
{fixInstruction}

NLU FEEDBACK:
- Current sentiment: {sentiment}
- Problematic tones detected: {problematicTones}

Rewrite this slide content. Rules:
- Keep bullet point format (max 5 bullets)
- Be specific — replace vague claims with data-backed statements
- Match the tone: confident, clear, investor-friendly
- Do NOT add information not implied by the original — ask the user to fill [PLACEHOLDER] for missing data

Return only the rewritten slide content, no preamble.
```

---

## 9. Design Specifications

### 9.1 Visual Style
- **Theme:** Dark — deep charcoal background (#18181B), electric teal accent (#14B8A6), coral CTA (#F97316)
- **Typography:** Archivo Black (display headings) + DM Sans (body)
- **Score color system:** Red (0–40) → Amber (41–65) → Teal (66–85) → Green (86–100)
- **Tone badges:** Color-coded chips — excited (teal), frustrated (amber), impolite (red), polite (green), sad (gray)

### 9.2 Animation Targets
- Score odometer: 0 → final score in 2 seconds with easing
- Rubric progress bars: fill left-to-right on results load, staggered 80ms per bar
- Slide accordion: smooth height transition on expand
- Rewrite modal: slide-in from right, 350ms

### 9.3 Loading State
During analysis (up to 45 seconds), show animated step progress:
1. ✅ File received
2. ⏳ Extracting slide content...
3. ⏳ Running NLU tone analysis...
4. ⏳ Scoring with Granite AI...
5. ⏳ Generating your fix plan...

Each step animates green on completion with a checkmark.

---

## 10. Acceptance Criteria

### Must-Have (Hackathon Submission)
- [ ] Upload a real PDF pitch deck → receive full analysis response
- [ ] IBM Watson NLU called for every slide, results visible in UI
- [ ] IBM watsonx.ai Granite called for scoring and rewrite, model ID visible in submission notes
- [ ] Deck Health Score displayed as animated number (0–100)
- [ ] Per-slide breakdown with slide type badge, tone chips, and score visible
- [ ] Top 3 Critical Fixes displayed with score impact estimates
- [ ] Rewrite modal functional — user can generate and view AI rewrite
- [ ] Emotional Journey chart renders with NLU sentiment data
- [ ] IBM Bob session exports present in bob_sessions/ in GitHub repo
- [ ] Demo video uploaded to YouTube, link in submission

### Should-Have
- [ ] "Apply & Rescore" re-runs analysis on rewritten slide text
- [ ] Sample Airbnb deck loads with one click for demo
- [ ] Investor Perspective Summary generated by Granite

### Nice-to-Have
- [ ] PDF export of full critique report
- [ ] Shareable results link (hash-based, in-memory)
- [ ] Benchmark: "Better than X% of decks" (seeded static benchmark)

---

## 11. 48-Hour Build Schedule

| Hours | Phase | Key Deliverable | Bob Sessions |
|---|---|---|---|
| 0–2 | Setup | Next.js project, env config, IBM SDK auth working | session_01 |
| 2–6 | Parsers | PDF + PPTX extraction, slide segmentation, type classification | session_02 |
| 6–10 | NLU Integration | Watson NLU per-slide analysis, response schema validated | session_03 |
| 10–16 | Granite Prompts | All 5 Granite prompt types working, JSON output validated | session_04 |
| 16–20 | Scoring Engine | Aggregator, weighted formula, NLU modifiers, final score output | session_05 |
| 20–28 | UI — Dashboard | All 7 dashboard sections built and connected to API | session_06 |
| 28–32 | Rewrite Modal | Rewrite + Apply & Rescore loop working end-to-end | session_07 |
| 32–36 | Testing + Polish | Load 3 test decks, fix edge cases, loading states, animations | session_08 |
| 32–35 | Contextual Memory | Deck Map extraction, updated Granite prompt, cross-ref UI badge | session_04 + session_06 |
| 35–36 | Contextual Memory Testing | Validate Granite JSON output with new context, check cross-ref badges render | session_04 |
| 36–42 | Demo Prep | Record YouTube demo, prepare submission copy |  |
| 42–48 | Submit | GitHub push, lablab.ai submission form complete |  |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IBM NLU API rate limit hit during demo | Medium | High | Cache all NLU results in-memory; pre-run demo decks before recording |
| Granite returns malformed JSON | Medium | High | Wrap all Granite calls in JSON parse try/catch; retry with stricter prompt |
| PDF is image-based (scanned deck) | Medium | Medium | Detect empty text extraction; show clear error with fallback option |
| watsonx.ai Lite tier quota exhausted | Low | High | Prepare OpenAI GPT-4o as fallback for Granite tasks |
| Slide segmentation misclassifies slides | Low | Low | Heuristics need only be directionally correct; Granite scoring compensates |
| Demo deck produces low score (embarrassing) | Low | Low | Pre-run and fix your deck before the demo; low score + improvement arc is actually the ideal demo narrative |

---

## 13. Judging Criteria Alignment

| Criterion | How DeckIQ Addresses It |
|---|---|
| **Clear Application of IBM Bob** | 8 exported Bob task sessions in the GitHub repo; Bob is used for architecture planning, all code generation, UI scaffolding, and test writing |
| **Strong Presentation** | Self-referential live demo (tool critiques its own submission deck); animated dashboard; emotional journey chart are all high visual-impact moments |
| **Genuine Business Value** | Pitch deck quality is a $500–$2,000 per-session coaching problem; DeckIQ delivers it in 60 seconds at zero cost to the founder |
| **Originality** | No existing tool combines NLU tone analysis + Granite semantic scoring + live rewrite loop in a single workflow; the 10-dimension VC rubric is a novel scoring frame |

---

## 14. Post-Hackathon Roadmap (v2+)

These features are out of scope for v1 but viable for productization:

- **Deck Versioning:** Track score improvements across multiple uploads of the same deck
- **Investor Match:** Match deck strengths to investor thesis preferences using watsonx.ai embeddings
- **Visual Critique:** Use Granite Vision to analyze slide layout, font choices, and chart quality
- **Cohort Benchmarking:** Accelerator programs upload all applicant decks for comparative scoring
- **Salesforce / HubSpot Integration:** Export critique report as a CRM note for deal pipeline tracking
- **DPIIT Startup India Alignment:** Special scoring dimension checking compliance with Indian government grant application requirements (relevant for Samyak's startup ecosystem)


---

## 15. Contextual Memory Enhancement

### Overview

Contextual Memory upgrades the Granite scoring layer from isolated per-slide analysis to **narrative-aware reasoning**. Without it, Granite evaluates each slide in a vacuum — a Problem slide with no data gets penalized even if the Traction slide two pages later contains exactly that data. With it, Granite understands the full deck structure before scoring any individual slide, producing rationale like *"Market size not stated here but found on Slide 5 — not penalized."*

This is a **~3-hour, low-code-risk upgrade** that moves DeckIQ from "basic LLM wrapper" to "intelligent deck reasoner" — precisely the distinction judges look for in the watsonx.ai/Granite category.

---

### Why It's Worth It (Verdict: High Priority ✅)

| Factor | Without Contextual Memory | With Contextual Memory |
|--------|--------------------------|------------------------|
| Problem slide missing data | Scores 2/10 — looks broken | Scores 5/10 — rationale says "data found on Slide 4" |
| Narrative Flow dimension | Scores based on one slide only | Scores based on full deck arc |
| Judge perception | "Basic LLM wrapper" | "Intelligent reasoning system" |
| Demo talking point | None | Explicit callout: "DeckIQ understands narrative, not just text" |
| Code risk | N/A | Low — only prompt strings change, no infra changes |

---

### 15.1 Implementation: Step A — Build the Deck Map

Before the `Promise.all` for Granite scoring fires, extract a structural map of the entire deck from the already-segmented slides array.

**File:** `app/api/analyze/route.ts`

```typescript
// Step A: Build Deck Map — runs BEFORE Promise.all granite scoring
const deckMap = segmentedSlides
  .map((s, i) => `Slide ${i + 1} (${s.slideType})`)
  .join(" -> ");

// Example output:
// "Slide 1 (Title) -> Slide 2 (Problem) -> Slide 3 (Solution) -> Slide 4 (Market) -> ..."

// Also build a content summary map for richer cross-referencing
const deckContentMap = segmentedSlides.map((s, i) => ({
  slideNumber: i + 1,
  slideType: s.slideType,
  keyEntities: s.nluResult?.entities?.slice(0, 3).map(e => e.text) ?? [],
  topKeyword: s.nluResult?.keywords?.[0]?.text ?? null,
  sentiment: s.nluResult?.sentiment?.label ?? null
}));

const deckContentSummary = JSON.stringify(deckContentMap, null, 0);
```

---

### 15.2 Implementation: Step B — Update the System Prompt

**File:** `lib/ibm/prompts/rubric-scoring.ts`

Replace the existing rubric scoring prompt with the updated version that includes a `GLOBAL CONTEXT` block:

```typescript
export const buildRubricScoringPrompt = (
  slideText: string,
  slideType: string,
  slideNumber: number,
  totalSlides: number,
  nluResult: NLUResult,
  deckMap: string,           // NEW
  deckContentSummary: string // NEW
): string => `
You are a senior venture capital analyst evaluating a startup pitch deck.

GLOBAL CONTEXT — Full Deck Structure:
${deckMap}

Deck Intelligence Summary (NLU-extracted, all slides):
${deckContentSummary}

CURRENT SLIDE: Slide ${slideNumber} of ${totalSlides}
SLIDE TYPE: ${slideType}
SLIDE TEXT:
"""
${slideText}
"""

NLU ANALYSIS FOR THIS SLIDE:
- Sentiment: ${nluResult.sentiment.label} (score: ${nluResult.sentiment.score})
- Top tone: ${nluResult.tone[0]?.label ?? 'none'} (confidence: ${nluResult.tone[0]?.score ?? 0})
- Key entities: ${nluResult.entities.slice(0, 5).map(e => e.text).join(', ')}

SCORING RULES (Critical — apply these before scoring):
1. If data expected for a dimension is MISSING from this slide but is PRESENT on another slide 
   (visible in the Deck Intelligence Summary above), do NOT penalize to zero. Score 4–6 and 
   note "Found on Slide X" in the rationale.
2. If this slide type is not responsible for a dimension (e.g., Team slide for marketSize), 
   return score: 0 and rationale: "Not applicable to this slide type."
3. narrativeFlow should always reflect how THIS slide connects to adjacent slides — 
   use the deck structure map to assess coherence.
4. investorReadiness should flag if a critical slide type is MISSING from the entire deck 
   (check the deck map for gaps).

Return ONLY valid JSON:
{
  "problemClarity": { "score": 0, "rationale": "one sentence, reference other slides if relevant" },
  "solutionFit": { "score": 0, "rationale": "..." },
  "marketSize": { "score": 0, "rationale": "..." },
  "tractionEvidence": { "score": 0, "rationale": "..." },
  "businessModel": { "score": 0, "rationale": "..." },
  "competitiveMoat": { "score": 0, "rationale": "..." },
  "teamStrength": { "score": 0, "rationale": "..." },
  "askClarity": { "score": 0, "rationale": "..." },
  "narrativeFlow": { "score": 0, "rationale": "..." },
  "investorReadiness": { "score": 0, "rationale": "..." }
}
`;
```

---

### 15.3 Implementation: Step C — Sequential Guarantee

Ensure `deckMap` and `deckContentSummary` are fully constructed **before** the Granite `Promise.all` begins. The NLU calls (Step 3 in the pipeline) must complete first since `deckContentSummary` uses NLU-extracted entities and keywords.

**Updated pipeline order in `route.ts`:**

```typescript
// Step 3: NLU — all slides in parallel (unchanged)
const nluResults = await Promise.all(
  segmentedSlides.map(slide => callNLU(slide.rawText))
);

// Attach NLU results to slides
const slidesWithNLU = segmentedSlides.map((slide, i) => ({
  ...slide,
  nluResult: nluResults[i]
}));

// Step 3.5: Build Deck Map (NEW — after NLU, before Granite)
const deckMap = slidesWithNLU
  .map((s, i) => `Slide ${i + 1} (${s.slideType})`)
  .join(" -> ");

const deckContentMap = slidesWithNLU.map((s, i) => ({
  slideNumber: i + 1,
  slideType: s.slideType,
  keyEntities: s.nluResult?.entities?.slice(0, 3).map(e => e.text) ?? [],
  topKeyword: s.nluResult?.keywords?.[0]?.text ?? null,
  sentiment: s.nluResult?.sentiment?.label ?? null
}));
const deckContentSummary = JSON.stringify(deckContentMap, null, 0);

// Step 4: Granite — all slides in parallel, now with deck context (UPDATED)
const graniteResults = await Promise.all(
  slidesWithNLU.map((slide, i) =>
    callGranite(buildRubricScoringPrompt(
      slide.rawText,
      slide.slideType,
      i + 1,
      slidesWithNLU.length,
      slide.nluResult,
      deckMap,           // NEW
      deckContentSummary // NEW
    ))
  )
);
```

---

### 15.4 UI Update: Cross-Reference Rationale Display

**File:** `components/SlideAccordion.tsx`

Parse Granite rationale strings for cross-slide references and render them as highlighted callouts instead of plain text.

```typescript
// Utility: detect cross-slide reference in rationale string
const extractSlideReference = (rationale: string): number | null => {
  const match = rationale.match(/[Ss]lide\s+(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// In the slide accordion render:
{Object.entries(slide.graniteScores).map(([dimension, { score, rationale }]) => (
  <div key={dimension} className="rubric-row">
    <span className="dimension-label">{formatDimension(dimension)}</span>
    <ScoreBar value={score} />
    <p className={`rationale ${extractSlideReference(rationale) ? 'cross-ref' : ''}`}>
      {rationale}
      {extractSlideReference(rationale) && (
        <span className="cross-ref-badge">
          🔗 Cross-referenced Slide {extractSlideReference(rationale)}
        </span>
      )}
    </p>
  </div>
))}
```

Add CSS for `.cross-ref-badge`:
```css
.cross-ref-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid #14B8A6;
  border-radius: 4px;
  font-size: 11px;
  color: #14B8A6;
}
```

---

### 15.5 Effort Breakdown

| Task | File to Modify | Time Estimate | Bob Session |
|------|----------------|---------------|-------------|
| Build `deckMap` + `deckContentSummary` extraction logic | `api/analyze/route.ts` | 30 min | session_04 |
| Update `buildRubricScoringPrompt` with GLOBAL CONTEXT block | `lib/ibm/prompts/rubric-scoring.ts` | 45 min | session_04 |
| Prompt testing — validate Granite JSON output with new context | Local test scripts | 45 min | session_04 |
| Cross-reference badge UI in `SlideAccordion.tsx` | `components/SlideAccordion.tsx` | 1 hr | session_06 |
| **Total** | | **~3 hours** | |

---

### 15.6 Demo Talking Point (Use This Verbatim)

> *"Most AI tools analyze your deck slide by slide, in isolation. DeckIQ is different — before scoring a single slide, it builds a full structural map of your deck. So when your Problem slide doesn't mention market size, it doesn't blindly penalize you. It checks the rest of the deck, finds it on Slide 4, and says: 'Data found on Slide 4 — not penalized.' That's not a chatbot. That's contextual reasoning."*

This line directly addresses the **"Clear Application of IBM Bob"** and **"Originality"** judging criteria, and will land with the IBM and Oracle judges who evaluate decks professionally.
