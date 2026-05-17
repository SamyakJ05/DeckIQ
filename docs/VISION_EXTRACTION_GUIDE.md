# Vision-Based Slide Extraction Guide

## Overview

DeckIQ now includes **vision-based extraction** using IBM watsonx.ai Granite Vision API to analyze visual content in pitch deck slides. This feature extracts data from charts, graphs, tables, images, and logos that text-only parsing misses.

---

## Why Vision Extraction?

Traditional PDF parsing (`pdf-parse`) only extracts text. Pitch decks are heavily visual:

| Slide Type | Visual Content | Impact Without Vision |
|------------|----------------|----------------------|
| **Traction** | MRR growth charts, user metrics graphs | ❌ Artificially low scores — no evidence of growth |
| **Market** | TAM/SAM/SOM diagrams, market size breakdowns | ❌ Can't see market opportunity data |
| **Business Model** | Pricing tables, revenue model diagrams | ❌ Missing monetization details |
| **Team** | Founder photos, advisor logos | ❌ Can't identify team composition |
| **Competition** | Competitive matrix, feature comparison tables | ❌ No competitive positioning data |

**With vision extraction**, Granite can "see" and reason about visual data, leading to more accurate scoring.

---

## Architecture

```
┌─────────────┐
│  PDF Upload │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────┐                  ┌──────────────┐
│  pdf-parse   │                  │ pdf-to-image │
│  (text only) │                  │ (PNG per pg) │
└──────┬───────┘                  └──────┬───────┘
       │                                  │
       │                                  ▼
       │                          ┌──────────────┐
       │                          │ Granite      │
       │                          │ Vision API   │
       │                          └──────┬───────┘
       │                                  │
       ▼                                  ▼
┌──────────────────────────────────────────────┐
│  Merge: rawText + visualContext              │
│  → Watson NLU → Granite Scoring              │
└──────────────────────────────────────────────┘
```

---

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# IBM watsonx.ai credentials (required)
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here

# Vision model (optional, defaults to llama-3-2-11b-vision-instruct)
VISION_MODEL=meta-llama/llama-3-2-11b-vision-instruct
```

### 2. Verify Dependencies

Vision extraction requires:
- ✅ `sharp` (image compression) — already installed
- ✅ `pdfjs-dist` (PDF rendering) — already installed
- ✅ `@napi-rs/canvas` (canvas rendering) — already installed

No additional `npm install` needed.

### 3. Verify Vision Model Access

Ensure your watsonx.ai project has access to a multimodal vision model:
- `meta-llama/llama-3-2-11b-vision-instruct` (recommended, faster)
- `meta-llama/llama-3-2-90b-vision-instruct` (more accurate, slower)

Check in IBM Cloud Console → watsonx.ai → Your Project → Models

---

## How It Works

### Step 1: Image Extraction

Each PDF page is converted to a compressed PNG image:

```typescript
// src/lib/vision/pdf-to-images.ts
const slideImages = await extractSlideImages(pdfBuffer, totalPages);
// Returns: SlideImage[] with base64-encoded PNGs
```

**Compression:**
- Resized to 1024×576px (optimal for vision API)
- PNG quality: 80%
- Typical size: 50-150KB per slide

### Step 2: Vision Analysis

Each slide image is analyzed by Granite Vision:

```typescript
// src/lib/vision/vision-client.ts
const visualContext = await analyzeSlideVisually(
  base64Image,
  slideType,
  slideNumber
);
```

**Extracted Data:**
```typescript
interface VisualSlideContext {
  hasCharts: boolean;           // Are charts/graphs present?
  hasImages: boolean;           // Are images/logos present?
  hasTables: boolean;           // Are tables present?
  chartData: string;            // "Bar chart: Q1=$48K, Q2=$72K, Q3=$91K (89% growth)"
  imageDescriptions: string;    // "Company logo, 2 founder photos, AWS partner logo"
  tableData: string;            // "Pricing: Starter $99/mo, Growth $299/mo"
  layoutDescription: string;    // "Title top, chart center, metrics bottom"
  rawVisualText: string;        // Full vision model output
}
```

### Step 3: Scoring with Visual Context

Visual data is injected into the Granite rubric scoring prompt:

```typescript
// src/lib/ibm/prompts/rubric-prompt.ts
const prompt = buildRubricScoringPrompt(
  slideText,
  slideType,
  slideNumber,
  totalSlides,
  nluResult,
  deckMap,
  deckContentSummary,
  visualContext  // ← Visual data included
);
```

**Scoring Rules:**
- ✅ Chart with MRR growth → `tractionEvidence` score 7-9
- ✅ TAM diagram → `marketSize` score 7-9
- ✅ Pricing table → `businessModel` score 7-9
- ✅ Visual data **prioritized** over text when both available

---

## API Response Changes

### Before (Text-Only)

```json
{
  "perSlideAnalysis": [
    {
      "slideNumber": 5,
      "slideType": "Traction",
      "rawText": "Our Growth\nWe've seen significant traction.",
      "nluResult": { ... },
      "graniteScores": {
        "tractionEvidence": {
          "score": 3,
          "rationale": "Vague claims, no data"
        }
      }
    }
  ]
}
```

### After (Text + Vision)

```json
{
  "perSlideAnalysis": [
    {
      "slideNumber": 5,
      "slideType": "Traction",
      "rawText": "Our Growth\nWe've seen significant traction.",
      "visualContext": {
        "hasCharts": true,
        "chartData": "Bar chart: Q1=$48K MRR, Q2=$72K MRR, Q3=$91K MRR showing 89% growth. Y-axis: Revenue in USD.",
        "hasImages": false,
        "hasTables": false,
        "layoutDescription": "Title top, growth chart center, metrics bottom"
      },
      "nluResult": { ... },
      "graniteScores": {
        "tractionEvidence": {
          "score": 8,
          "rationale": "Strong growth chart shows 89% MRR increase"
        }
      }
    }
  ]
}
```

**Key Difference:** Score jumped from 3 → 8 because vision detected the growth chart.

---

## Performance

| Metric | Text-Only | Text + Vision |
|--------|-----------|---------------|
| **15-slide deck** | ~35-40s | ~50-60s |
| **Per-slide overhead** | 0s | ~1-2s |
| **Parallel execution** | NLU only | NLU + Vision (parallel) |

**Optimization:**
- Vision analysis runs in parallel with NLU where possible
- IAM token caching reduces auth overhead
- Image compression keeps payload sizes small

---

## Limitations

### 1. PDF-Only

Vision extraction currently only works for PDF files. PPTX files skip vision analysis.

**Workaround:** Convert PPTX to PDF before upload.

### 2. Static Images Only

Slide animations, transitions, and embedded videos are not captured.

### 3. Vision Model Availability

Requires a multimodal vision model on your watsonx.ai project. If unavailable, vision analysis fails gracefully (returns empty context, no crash).

### 4. Cost

Vision API calls are more expensive than text-only analysis. Monitor usage in IBM Cloud billing.

---

## Troubleshooting

### Vision Analysis Fails Silently

**Symptoms:**
- `visualContext` is empty for all slides
- Logs show "Vision analysis failed"

**Causes:**
1. Missing `VISION_MODEL` env var or invalid model ID
2. Vision model not available in your watsonx.ai project
3. IAM token expired or invalid `WATSONX_API_KEY`

**Fix:**
```bash
# Check env vars
echo $VISION_MODEL
echo $WATSONX_API_KEY

# Verify model access in IBM Cloud Console
# watsonx.ai → Your Project → Models → Search for "llama-3-2-11b-vision"
```

### Image Extraction Fails

**Symptoms:**
- Logs show "Failed to extract image for slide X"
- `slideImages` array has empty base64 strings

**Causes:**
1. PDF is corrupted or password-protected
2. pdfjs-dist worker not found
3. Out of memory (very large PDFs)

**Fix:**
```bash
# Verify pdfjs worker exists
ls node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs

# Check PDF file integrity
file your-deck.pdf
```

### Slow Performance

**Symptoms:**
- Analysis takes > 90s for 15-slide deck

**Causes:**
1. Vision model is slow (try switching to 11B instead of 90B)
2. Network latency to watsonx.ai
3. Large image payloads (compression failed)

**Fix:**
```bash
# Use faster model
VISION_MODEL=meta-llama/llama-3-2-11b-vision-instruct

# Check image sizes in logs
# Should be ~50-150KB per slide
```

---

## Testing

### Manual Test

```bash
# 1. Upload a PDF with a traction chart
curl -X POST http://localhost:3000/api/analyze \
  -F "file=@pitch-deck-with-charts.pdf"

# 2. Check response for visualContext
jq '.perSlideAnalysis[4].visualContext' response.json

# Expected output:
{
  "hasCharts": true,
  "chartData": "Bar chart: Q1=$48K MRR, Q2=$72K MRR...",
  "hasImages": false,
  "hasTables": false,
  "layoutDescription": "Title top, chart center"
}
```

### Automated Test

```typescript
// __tests__/vision-extraction.test.ts
import { extractSlideImages } from '@/lib/vision/pdf-to-images';
import { analyzeSlideVisually } from '@/lib/vision/vision-client';

test('extracts images from PDF', async () => {
  const pdfBuffer = fs.readFileSync('test-deck.pdf');
  const images = await extractSlideImages(pdfBuffer, 10);
  
  expect(images).toHaveLength(10);
  expect(images[0].base64).toBeTruthy();
  expect(images[0].width).toBe(1024);
});

test('detects charts in slide image', async () => {
  const base64Image = '...'; // Sample slide with chart
  const context = await analyzeSlideVisually(base64Image, 'Traction', 5);
  
  expect(context.hasCharts).toBe(true);
  expect(context.chartData).toContain('growth');
});
```

---

## Future Enhancements

1. **PPTX Support:** Extract embedded images from PPTX XML
2. **Vision Caching:** Cache results to avoid re-analyzing same slides
3. **Confidence Scores:** Detect low-quality extractions
4. **Multi-Model Fallback:** Try 11B model first, fallback to 90B if needed
5. **Batch Vision API:** Analyze multiple slides in one API call

---

## References

- [IBM watsonx.ai Vision Models](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [Llama 3.2 Vision Documentation](https://ai.meta.com/llama/)
- [DeckIQ PRD Section 6.5: Visual Content Extraction](../DeckIQ_PRD_v2.md#65-visual-content-extraction)

---

**Last Updated:** 2026-05-16  
**Maintained By:** Person A