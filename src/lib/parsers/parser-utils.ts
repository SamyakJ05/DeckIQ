/**
 * Shared utilities for PDF and PPTX parsers
 */

import type { SlideContent, SlideType } from '@/types';

/**
 * Determines if a slide/page text is likely image-only (no meaningful text extracted)
 * @param text - The extracted text from a slide/page
 * @returns true if the text is empty or too short to be meaningful
 */
export function isLikelyImageOnly(text: string | undefined): boolean {
  if (!text) return true;
  const compact = text.replace(/\s/g, '');
  return compact.length < 15; // threshold: less than 15 non-whitespace chars
}

/**
 * Clean and normalize extracted text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if a slide has meaningful content
 */
export function hasContent(text: string): boolean {
  const cleaned = cleanText(text);
  return cleaned.length > 10; // Minimum 10 characters to be considered content
}

/**
 * Heuristic slide type classifier based on keyword matching
 * Implements the classification logic from DeckIQ_PRD_v2.md Section 6.5
 * Requires minimum 2 keyword matches to classify a slide type
 */
export function classifySlideType(text: string, slideNumber: number): SlideType {
  const lowerText = text.toLowerCase();
  const MIN_KEYWORD_HITS = 2;

  // First slide is typically Title
  if (slideNumber === 1) {
    return 'Title';
  }

  // Define keyword sets for each type
  const keywords: Record<SlideType, string[]> = {
    Title: [],
    Problem: ['problem', 'pain', 'challenge', 'struggle', 'currently', 'today'],
    Solution: ['solution', 'we built', 'our product', 'introducing', 'platform'],
    Market: ['market', 'tam', 'sam', 'som', 'billion', 'opportunity', 'addressable'],
    Traction: ['mrr', 'arr', 'users', 'growth', 'customers', 'revenue', 'retention'],
    BusinessModel: ['pricing', 'revenue model', 'subscription', 'per seat', 'freemium'],
    Team: ['founder', 'ceo', 'cto', 'previously', 'experience', 'background'],
    Competition: ['competitor', ' vs ', 'alternative', 'landscape', 'differentiated'],
    Ask: ['raising', 'seeking', 'use of funds', 'milestone', 'runway'],
    Other: [],
  };

  // Count keyword matches for each type
  const scores: Record<SlideType, number> = {
    Title: 0,
    Problem: 0,
    Solution: 0,
    Market: 0,
    Traction: 0,
    BusinessModel: 0,
    Team: 0,
    Competition: 0,
    Ask: 0,
    Other: 0,
  };

  for (const [type, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (lowerText.includes(keyword)) {
        scores[type as SlideType]++;
      }
    }
  }

  // Find the type with the highest score
  const entries = Object.entries(scores) as [SlideType, number][];
  const best = entries.sort((a, b) => b[1] - a[1])[0];

  // Only classify if we have at least MIN_KEYWORD_HITS matches
  return best[1] >= MIN_KEYWORD_HITS ? best[0] : 'Other';
}

/**
 * Extract potential title from slide text (first line or first sentence)
 */
export function extractTitle(text: string): string | undefined {
  const cleaned = cleanText(text);
  const lines = cleaned.split('\n');
  
  if (lines.length === 0) return undefined;
  
  const firstLine = lines[0].trim();
  
  // If first line is short (likely a title), return it
  if (firstLine.length > 0 && firstLine.length < 100) {
    return firstLine;
  }
  
  return undefined;
}

/**
 * Build SlideContent array from raw text pages
 */
export function buildSlideContent(
  pages: string[],
  startNumber: number = 1
): SlideContent[] {
  const slides: SlideContent[] = [];
  
  pages.forEach((pageText, index) => {
    const slideNumber = startNumber + index;
    const bodyText = cleanText(pageText);
    
    // Skip empty slides
    if (!hasContent(bodyText)) {
      return;
    }
    
    const title = extractTitle(bodyText);
    const estimatedSlideType = classifySlideType(bodyText, slideNumber);
    
    slides.push({
      slideNumber,
      title,
      bodyText,
      estimatedSlideType,
    });
  });
  
  return slides;
}

// Made with Bob
