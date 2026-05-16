/**
 * PDF Parser for DeckIQ
 * Extracts text content from PDF files page-by-page using pdf-parse
 */

import * as pdfParse from 'pdf-parse';
import type { SlideContent } from '@/types';
import { buildSlideContent } from './parser-utils';

// Handle both CommonJS and ESM exports
const pdf = (pdfParse as any).default || pdfParse;

/**
 * Parse a PDF buffer and extract slide content
 * @param buffer - PDF file buffer
 * @returns Array of SlideContent objects, one per page
 */
export async function parsePDF(buffer: Buffer): Promise<SlideContent[]> {
  try {
    const data = await pdf(buffer);
    
    // pdf-parse returns full text, we need to split by pages
    // The library provides numpages but not per-page text directly
    // We'll use a workaround: parse with page render option
    const pagesText: string[] = [];
    
    // Parse again with page-by-page extraction
    const options = {
      max: data.numpages,
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        pagesText.push(pageText);
        return pageText;
      },
    };
    
    await pdf(buffer, options);
    
    // If page-by-page extraction failed, fall back to splitting full text
    if (pagesText.length === 0) {
      // Rough heuristic: split by form feed or estimate based on length
      const fullText = data.text;
      const estimatedPages = Math.max(1, data.numpages);
      const charsPerPage = Math.ceil(fullText.length / estimatedPages);
      
      for (let i = 0; i < estimatedPages; i++) {
        const start = i * charsPerPage;
        const end = Math.min((i + 1) * charsPerPage, fullText.length);
        pagesText.push(fullText.substring(start, end));
      }
    }
    
    return buildSlideContent(pagesText);
  } catch (error) {
    throw new Error(
      `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validate if a buffer is a valid PDF
 */
export function isPDF(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  return buffer.length > 4 && buffer.toString('utf-8', 0, 5) === '%PDF-';
}

// Made with Bob
