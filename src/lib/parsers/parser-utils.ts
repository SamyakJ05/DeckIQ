/**
 * Shared utilities for PDF and PPTX parsers
 */

import type { SlideContent, SlideType } from '@/types';

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
 */
export function classifySlideType(text: string, slideNumber: number): SlideType {
  const lowerText = text.toLowerCase();

  // First slide is typically Title
  if (slideNumber === 1) {
    return 'Title';
  }

  // Problem slide keywords
  if (
    lowerText.includes('problem') ||
    lowerText.includes('pain') ||
    lowerText.includes('challenge') ||
    lowerText.includes('struggle') ||
    lowerText.includes('currently') ||
    lowerText.includes('today')
  ) {
    return 'Problem';
  }

  // Solution slide keywords
  if (
    lowerText.includes('solution') ||
    lowerText.includes('we built') ||
    lowerText.includes('our product') ||
    lowerText.includes('introducing') ||
    lowerText.includes('platform')
  ) {
    return 'Solution';
  }

  // Market slide keywords
  if (
    lowerText.includes('market') ||
    lowerText.includes('tam') ||
    lowerText.includes('sam') ||
    lowerText.includes('som') ||
    lowerText.includes('billion') ||
    lowerText.includes('opportunity') ||
    lowerText.includes('addressable')
  ) {
    return 'Market';
  }

  // Traction slide keywords
  if (
    lowerText.includes('mrr') ||
    lowerText.includes('arr') ||
    lowerText.includes('users') ||
    lowerText.includes('growth') ||
    lowerText.includes('customers') ||
    lowerText.includes('revenue') ||
    lowerText.includes('retention')
  ) {
    return 'Traction';
  }

  // Business Model slide keywords
  if (
    lowerText.includes('pricing') ||
    lowerText.includes('revenue model') ||
    lowerText.includes('subscription') ||
    lowerText.includes('per seat') ||
    lowerText.includes('freemium')
  ) {
    return 'BusinessModel';
  }

  // Team slide keywords
  if (
    lowerText.includes('founder') ||
    lowerText.includes('ceo') ||
    lowerText.includes('cto') ||
    lowerText.includes('previously') ||
    lowerText.includes('experience') ||
    lowerText.includes('background')
  ) {
    return 'Team';
  }

  // Competition slide keywords
  if (
    lowerText.includes('competitor') ||
    lowerText.includes(' vs ') ||
    lowerText.includes('alternative') ||
    lowerText.includes('landscape') ||
    lowerText.includes('differentiated')
  ) {
    return 'Competition';
  }

  // Ask slide keywords
  if (
    lowerText.includes('raising') ||
    lowerText.includes('seeking') ||
    lowerText.includes('use of funds') ||
    lowerText.includes('milestone') ||
    lowerText.includes('runway')
  ) {
    return 'Ask';
  }

  return 'Other';
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
