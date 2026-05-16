/**
 * Investor Perspective Summary Prompt Builder
 * Generates prompt for Granite to create investor perspective summary
 * First-person investor voice, 3 sentences max
 */

import type { DeckMap } from '@/types';

/**
 * Build the investor perspective summary prompt for Granite
 * 
 * @param fullDeckText - Concatenated text from all slides in order
 * @param deckMap - Linear deck structure map
 * @returns Formatted prompt string for Granite
 */
export function buildInvestorSummaryPrompt(
  fullDeckText: string,
  deckMap: DeckMap
): string {
  // Truncate deck text if too long (keep first 4000 chars for context)
  const truncatedText = fullDeckText.length > 4000 
    ? fullDeckText.substring(0, 4000) + '...' 
    : fullDeckText;

  return `You are a venture capital investor who just finished reviewing a startup pitch deck. Write a 3-sentence summary of your perspective on this deck.

DECK STRUCTURE:
${deckMap}

FULL DECK CONTENT:
"""
${truncatedText}
"""

YOUR TASK:
Write exactly 3 sentences in first-person investor voice that capture:
1. Your assessment of the problem and solution
2. Your view on traction and market validation
3. Your overall readiness to invest or key concerns

TONE REQUIREMENTS:
- Direct and honest (like a real investor email)
- First-person ("I think...", "I need to see...", "I'm concerned...")
- Specific (reference actual content from the deck)
- Balanced (acknowledge strengths AND gaps)

EXAMPLES OF GOOD INVESTOR VOICE:
- "The problem is compelling and I see the pain point clearly, but the solution feels incremental rather than transformative."
- "I need to see concrete traction metrics before I can assess product-market fit — beta users mentioned but no revenue numbers."
- "The team background is missing, which raises questions about execution capability at this stage."

Return ONLY the 3-sentence summary as plain text. Do not include any JSON, markdown formatting, or explanatory text.`;
}

// Made with Bob
