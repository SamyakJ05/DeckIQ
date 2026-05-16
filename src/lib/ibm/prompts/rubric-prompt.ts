/**
 * Rubric Scoring Prompt Builder
 * Generates the 10-dimension VC rubric scoring prompt for Granite
 * Includes global deck context to enable cross-slide reasoning
 */

import type { NLUResult, VisualSlideContext } from '@/types';

/**
 * Build the rubric scoring prompt for a single slide with full deck context
 *
 * @param slideText - Raw text content of the slide
 * @param slideType - Estimated slide type (Title, Problem, Solution, etc.)
 * @param slideNumber - Current slide number (1-based)
 * @param totalSlides - Total number of slides in the deck
 * @param nluResult - Watson NLU analysis result for this slide
 * @param deckMap - Linear deck structure map (e.g., "Slide 1 (Title) -> Slide 2 (Problem) -> ...")
 * @param deckContentSummary - JSON string of DeckMapEntry array with key entities, keywords, sentiment per slide
 * @param visualContext - Visual analysis from Granite Vision (charts, images, tables)
 * @returns Formatted prompt string for Granite
 */
export function buildRubricScoringPrompt(
  slideText: string,
  slideType: string,
  slideNumber: number,
  totalSlides: number,
  nluResult: NLUResult,
  deckMap: string,
  _deckContentSummary: string,  // reserved — excluded from prompt to keep token count low
  visualContext: VisualSlideContext | null = null
): string {
  const topTone = nluResult.tone[0]?.label ?? 'neutral';
  const sentiment = nluResult.sentiment.label;

  // Build visual context section if available
  const visualSection = visualContext ? `

VISUAL CONTENT ON THIS SLIDE:
${visualContext.hasCharts ? `📊 Charts/Graphs detected:
${visualContext.chartData}` : '❌ No charts detected.'}

${visualContext.hasImages ? `🖼️ Images/Logos detected:
${visualContext.imageDescriptions}` : '❌ No images detected.'}

${visualContext.hasTables ? `📋 Tables detected:
${visualContext.tableData}` : '❌ No tables detected.'}

Visual layout: ${visualContext.layoutDescription}

⚠️ CRITICAL: The chart and table data above is REAL DATA extracted from the slide visuals.
Use it when scoring tractionEvidence, marketSize, businessModel, and askClarity.
A slide with a growth chart showing revenue data MUST score higher on tractionEvidence than one without.
A slide with a TAM breakdown table MUST score higher on marketSize than one without.
` : '\n⚠️ Visual extraction unavailable for this slide. Score based on text only.\n';

  return `VC analyst. Score this pitch deck slide on 10 dimensions (0-10). Return ONLY JSON.

Deck structure: ${deckMap}
Slide ${slideNumber}/${totalSlides} — Type: ${slideType} — Sentiment: ${sentiment}, Tone: ${topTone}

SLIDE TEXT:
"""
${slideText}
"""
${visualSection}
Rules:
- PRIORITIZE visual data (charts, tables) over text when both are available.
- If a chart shows MRR growth, score tractionEvidence 7-9 even if text doesn't describe it.
- If a TAM diagram shows market breakdown, score marketSize 7-9.
- Score 0 if dimension is not applicable to this slide type (e.g. marketSize on a Team slide).
- Score 4-6 if data is missing from this slide but likely on another slide (reference deck structure).
- narrativeFlow: rate coherence with adjacent slides per deck structure above.
- investorReadiness: flag missing critical slide types from deck structure.

Return ONLY valid JSON (rationale max 8 words each):
{"problemClarity":{"score":0,"rationale":"8 words max"},"solutionFit":{"score":0,"rationale":"8 words max"},"marketSize":{"score":0,"rationale":"8 words max"},"tractionEvidence":{"score":0,"rationale":"8 words max"},"businessModel":{"score":0,"rationale":"8 words max"},"competitiveMoat":{"score":0,"rationale":"8 words max"},"teamStrength":{"score":0,"rationale":"8 words max"},"askClarity":{"score":0,"rationale":"8 words max"},"narrativeFlow":{"score":0,"rationale":"8 words max"},"investorReadiness":{"score":0,"rationale":"8 words max"}}`;
}

// Made with Bob
