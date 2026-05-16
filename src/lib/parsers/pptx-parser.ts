/**
 * PPTX Parser for DeckIQ
 * Extracts text content from PowerPoint files slide-by-slide using officeparser
 */

import officeParser from 'officeparser';
import type { SlideContent } from '@/types';
import { buildSlideContent } from './parser-utils';

/**
 * Parse a PPTX buffer and extract slide content
 * @param buffer - PPTX file buffer
 * @returns Array of SlideContent objects, one per slide
 */
export async function parsePPTX(buffer: Buffer): Promise<SlideContent[]> {
  try {
    // officeparser returns full text from the PPTX
    const text = await officeParser.parseOffice(buffer);
    
    if (!text || typeof text !== 'string') {
      throw new Error('Failed to extract text from PPTX');
    }
    
    // PPTX text extraction typically separates slides with multiple newlines
    // Split by common slide separators
    const slideTexts = splitIntoSlides(text);
    
    return buildSlideContent(slideTexts);
  } catch (error) {
    throw new Error(
      `PPTX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Split extracted PPTX text into individual slides
 * Uses heuristics to detect slide boundaries
 */
function splitIntoSlides(text: string): string[] {
  // Try splitting by common patterns that indicate slide breaks
  // Pattern 1: Multiple consecutive newlines (3+)
  let slides = text.split(/\n{3,}/);
  
  // If we only got 1 slide, try other patterns
  if (slides.length === 1) {
    // Pattern 2: Form feed character
    slides = text.split('\f');
  }
  
  // If still only 1 slide, try splitting by "Slide" keyword
  if (slides.length === 1) {
    slides = text.split(/(?=Slide \d+)/i);
  }
  
  // If still only 1 slide, estimate based on length
  // Assume average slide has ~500 characters
  if (slides.length === 1 && text.length > 500) {
    const estimatedSlides = Math.ceil(text.length / 500);
    const charsPerSlide = Math.ceil(text.length / estimatedSlides);
    slides = [];
    
    for (let i = 0; i < estimatedSlides; i++) {
      const start = i * charsPerSlide;
      const end = Math.min((i + 1) * charsPerSlide, text.length);
      slides.push(text.substring(start, end));
    }
  }
  
  return slides.filter(slide => slide.trim().length > 0);
}

/**
 * Validate if a buffer is a valid PPTX
 */
export function isPPTX(buffer: Buffer): boolean {
  // PPTX files are ZIP archives, they start with PK (0x50 0x4B)
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
}

// Made with Bob
