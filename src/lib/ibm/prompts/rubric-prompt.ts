/**
 * Rubric Scoring Prompt Builder
 * Generates the 10-dimension VC rubric scoring prompt for Granite
 * Includes global deck context to enable cross-slide reasoning
 */

import type { NLUResult } from '@/types';

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
 * @returns Formatted prompt string for Granite
 */
export function buildRubricScoringPrompt(
  slideText: string,
  slideType: string,
  slideNumber: number,
  totalSlides: number,
  nluResult: NLUResult,
  deckMap: string,
  _deckContentSummary: string  // reserved — excluded from prompt to keep token count low
): string {
  const topTone = nluResult.tone[0]?.label ?? 'neutral';
  const sentiment = nluResult.sentiment.label;

  return `VC analyst. Score this pitch deck slide on 10 dimensions (0-10). Return ONLY JSON.

Deck structure: ${deckMap}
Slide ${slideNumber}/${totalSlides} — Type: ${slideType} — Sentiment: ${sentiment}, Tone: ${topTone}

SLIDE TEXT:
"""
${slideText}
"""

Rules:
- Score 0 if dimension is not applicable to this slide type (e.g. marketSize on a Team slide).
- Score 4-6 if data is missing from this slide but likely on another slide (reference deck structure).
- narrativeFlow: rate coherence with adjacent slides per deck structure above.
- investorReadiness: flag missing critical slide types from deck structure.

Return ONLY valid JSON (rationale max 8 words each):
{"problemClarity":{"score":0,"rationale":"8 words max"},"solutionFit":{"score":0,"rationale":"8 words max"},"marketSize":{"score":0,"rationale":"8 words max"},"tractionEvidence":{"score":0,"rationale":"8 words max"},"businessModel":{"score":0,"rationale":"8 words max"},"competitiveMoat":{"score":0,"rationale":"8 words max"},"teamStrength":{"score":0,"rationale":"8 words max"},"askClarity":{"score":0,"rationale":"8 words max"},"narrativeFlow":{"score":0,"rationale":"8 words max"},"investorReadiness":{"score":0,"rationale":"8 words max"}}`;
}

// Made with Bob
