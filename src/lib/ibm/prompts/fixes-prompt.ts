/**
 * Critical Fixes Prompt Builder
 * Generates prompt for Granite to identify top 3 critical fixes
 * Based on aggregated rubric scores across all slides
 */

import type { RubricScores } from '@/types';

/**
 * Build the critical fixes prompt for Granite
 * 
 * @param aggregatedRubricScores - Aggregated rubric scores across all slides
 * @param slideCount - Total number of slides in the deck
 * @param overallScore - Overall deck health score (0-100)
 * @returns Formatted prompt string for Granite
 */
export function buildCriticalFixesPrompt(
  aggregatedRubricScores: RubricScores,
  slideCount: number,
  overallScore: number
): string {
  // Format rubric scores for the prompt
  const rubricSummary = Object.entries(aggregatedRubricScores)
    .map(([dimension, data]) => `  - ${dimension}: ${data.score}/10 - ${data.rationale}`)
    .join('\n');

  return `You are a senior venture capital analyst providing actionable feedback on a startup pitch deck.

DECK OVERVIEW:
- Total slides: ${slideCount}
- Overall Deck Health Score: ${overallScore}/100
- Evaluation completed across 10 VC rubric dimensions

AGGREGATED RUBRIC SCORES (across all slides):
${rubricSummary}

YOUR TASK:
Identify exactly 3 critical fixes that will have the highest impact on improving this deck's fundability. Prioritize fixes that:
1. Address the lowest-scoring dimensions
2. Have the most direct impact on investor decision-making
3. Are specific and actionable (not generic advice)

For each fix, you must specify:
- rank: 1, 2, or 3 (1 = highest impact)
- dimension: the rubric dimension this fix addresses (use exact names from above)
- fix: one clear, actionable sentence telling the founder exactly what to add/change
- estimatedScoreImpact: integer points (1-15) this fix could add to overall score
- slideToFix: the slide number where this fix should be applied (1-${slideCount})

CRITICAL RULES:
- Return EXACTLY 3 fixes, no more, no less
- Rank by estimated score impact (highest first)
- Be specific: "Add Q3 2024 revenue numbers" not "Add more traction"
- Focus on missing data, not writing style
- If a dimension scored 0 because it's "not applicable", skip it

Return ONLY valid JSON matching this exact schema:
[
  {
    "rank": 1,
    "dimension": "dimension name here",
    "fix": "specific actionable instruction here",
    "estimatedScoreImpact": 12,
    "slideToFix": 5
  },
  {
    "rank": 2,
    "dimension": "dimension name here",
    "fix": "specific actionable instruction here",
    "estimatedScoreImpact": 8,
    "slideToFix": 4
  },
  {
    "rank": 3,
    "dimension": "dimension name here",
    "fix": "specific actionable instruction here",
    "estimatedScoreImpact": 6,
    "slideToFix": 7
  }
]`;
}

// Made with Bob
