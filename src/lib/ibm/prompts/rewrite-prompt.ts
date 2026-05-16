/**
 * Rewrite Prompt Builder
 * Generates prompts for Granite to rewrite individual slides based on critical fixes
 */

import type { SlideType, NLUResult } from '@/types';

/**
 * Build a prompt for Granite to rewrite a slide based on a critical fix
 * 
 * @param slideNumber - The slide number being rewritten
 * @param slideType - The type of slide (Problem, Solution, etc.)
 * @param originalText - The original slide text
 * @param fixInstruction - The specific fix to apply (from CriticalFix)
 * @param nluSnapshot - Optional NLU data showing problematic tones/sentiment
 * @returns Formatted prompt string for Granite
 */
export function buildRewritePrompt(
  slideNumber: number,
  slideType: SlideType,
  originalText: string,
  fixInstruction: string,
  nluSnapshot?: {
    sentiment: string;
    problematicTones: string[];
  }
): string {
  const nluContext = nluSnapshot
    ? `\nCURRENT TONE ISSUES:
- Sentiment: ${nluSnapshot.sentiment}
- Problematic tones detected: ${nluSnapshot.problematicTones.join(', ')}`
    : '';

  return `You are a pitch deck consultant helping a founder improve their investor presentation.

TASK: Rewrite the following slide to address a specific critical issue.

SLIDE CONTEXT:
- Slide Number: ${slideNumber}
- Slide Type: ${slideType}
- Purpose: This slide should ${getSlideTypePurpose(slideType)}
${nluContext}

ORIGINAL SLIDE TEXT:
"""
${originalText}
"""

CRITICAL FIX TO APPLY:
${fixInstruction}

REWRITING GUIDELINES:
1. Maintain the core message but improve clarity and impact
2. Address the specific fix instruction directly
3. Use confident, investor-appropriate language
4. Keep the rewrite concise (similar length to original)
5. Include specific numbers, metrics, or data points where relevant
6. Avoid jargon unless it's industry-standard terminology
7. Ensure the tone is professional and compelling

Return ONLY the rewritten slide text, without any preamble, explanation, or meta-commentary.
Do not include phrases like "Here's the rewritten version" or "Rewritten slide:".
Just provide the improved slide content directly.`;
}

/**
 * Get the purpose description for each slide type
 */
function getSlideTypePurpose(slideType: SlideType): string {
  const purposes: Record<SlideType, string> = {
    Title: 'introduce the company name, tagline, and create immediate interest',
    Problem: 'clearly articulate the pain point with specific examples and quantify the impact',
    Solution: 'explain how your product/service solves the problem with clear differentiation',
    Market: 'demonstrate market size (TAM/SAM/SOM) with credible data sources',
    Traction: 'show concrete evidence of progress with specific metrics and growth rates',
    BusinessModel: 'explain how you make money with clear unit economics',
    Team: 'highlight relevant experience and domain expertise of key team members',
    Competition: 'show competitive landscape and your defensible advantages',
    Ask: 'specify funding amount needed and detailed use of funds',
    Other: 'support the overall narrative with relevant information',
  };
  
  return purposes[slideType];
}

// Made with Bob