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
  deckContentSummary: string
): string {
  // Extract top entities and keywords for context
  const topEntities = nluResult.entities
    .slice(0, 5)
    .map(e => e.text)
    .join(', ') || 'none';

  const topTone = nluResult.tone[0]?.label ?? 'none';
  const topToneScore = nluResult.tone[0]?.score ?? 0;

  return `You are a senior venture capital analyst evaluating a startup pitch deck.

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
- Top tone: ${topTone} (confidence: ${topToneScore.toFixed(2)})
- Key entities: ${topEntities}

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

DIMENSION DEFINITIONS:
- problemClarity: Is the problem clearly articulated with specific pain points?
- solutionFit: Does the solution directly address the stated problem?
- marketSize: Is the market opportunity quantified (TAM/SAM/SOM)?
- tractionEvidence: Are there concrete metrics (revenue, users, growth)?
- businessModel: Is the revenue model clear and viable?
- competitiveMoat: Is there defensibility or competitive advantage?
- teamStrength: Does the team have relevant experience and credibility?
- askClarity: Is the funding ask specific with use of funds?
- narrativeFlow: Does this slide connect logically to adjacent slides?
- investorReadiness: Are critical slides present? Any red flags?

Return ONLY valid JSON matching this exact schema:
{
  "problemClarity": { "score": 0, "rationale": "one sentence, reference other slides if relevant" },
  "solutionFit": { "score": 0, "rationale": "one sentence" },
  "marketSize": { "score": 0, "rationale": "one sentence" },
  "tractionEvidence": { "score": 0, "rationale": "one sentence" },
  "businessModel": { "score": 0, "rationale": "one sentence" },
  "competitiveMoat": { "score": 0, "rationale": "one sentence" },
  "teamStrength": { "score": 0, "rationale": "one sentence" },
  "askClarity": { "score": 0, "rationale": "one sentence" },
  "narrativeFlow": { "score": 0, "rationale": "one sentence" },
  "investorReadiness": { "score": 0, "rationale": "one sentence" }
}`;
}

// Made with Bob
