/**
 * PDF Parser for DeckIQ
 * Extracts text content from PDF files page-by-page using pdf-parse v2
 * Includes OCR fallback for image-only pages
 */

import { PDFParse } from 'pdf-parse';
import * as PDFWorker from 'pdf-parse/worker';
import type { SlideContent } from '@/types';
import { buildSlideContent, isLikelyImageOnly } from './parser-utils';
import { renderPdfPageToImageBuffer } from '../ocr/pdf-to-image';
import { ocrImageBuffer } from '../ocr/ocr-client';
import { log } from '../utils/logger';

// Maximum number of pages to OCR (performance cap)
const MAX_OCR_PAGES = 10;

// Minimum OCR text length to consider it successful
const MIN_OCR_TEXT_LENGTH = 20;

/**
 * Clean extracted text to fix letter-spaced garbled text
 * e.g., "C O N F I D E N T I A L" → "CONFIDENTIAL"
 */
function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\b(\w) (?=\w )/g, '$1')  // collapse spaced chars mid-word
    .replace(/\b(\w) (\w)\b/g, '$1$2') // collapse two trailing spaced chars
    .replace(/  +/g, ' ')              // normalize extra spaces
    .trim();
}

/**
 * Parse a PDF buffer and extract slide content with OCR fallback
 * @param buffer - PDF file buffer
 * @returns Array of SlideContent objects, one per page
 */
export async function parsePDF(buffer: Buffer): Promise<SlideContent[]> {
  // worker must be injected explicitly in Next.js server environment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new PDFParse({ data: buffer, worker: PDFWorker as any });
  try {
    const result = await parser.getText();
    const pagesText = result.pages.map((p: { text: string; num: number }) => p.text);
    
    // Track OCR usage for logging
    let ocrPagesCount = 0;
    const ocrStartTime = Date.now();
    
    // Process pages with OCR fallback for image-only pages
    const enhancedPagesText: Array<{ text: string; usedOcr: boolean }> = [];
    
    for (let i = 0; i < pagesText.length; i++) {
      const pageText = pagesText[i];
      const pageNumber = i + 1;
      
      // Check if page is likely image-only
      if (isLikelyImageOnly(pageText)) {
        // Check if we've hit the OCR cap
        if (ocrPagesCount >= MAX_OCR_PAGES) {
          log.warn(`Skipping OCR for page ${pageNumber} (reached cap of ${MAX_OCR_PAGES} pages)`);
          enhancedPagesText.push({ text: pageText, usedOcr: false });
          continue;
        }
        
        log.info(`Page ${pageNumber} appears to be image-only, attempting OCR`);

        try {
          // Render page to image then OCR
          const imageBuffer = await renderPdfPageToImageBuffer(buffer, pageNumber);
          const ocrText = await ocrImageBuffer(imageBuffer);
          const trimmed = ocrText.trim();

          if (trimmed.length >= MIN_OCR_TEXT_LENGTH) {
            log.info(`OCR successful for page ${pageNumber}, extracted ${trimmed.length} characters`);
            // Clean OCR text as well
            const cleanedOcrText = cleanExtractedText(trimmed);
            enhancedPagesText.push({ text: cleanedOcrText, usedOcr: true });
            ocrPagesCount++;
          } else {
            log.warn(`OCR produced insufficient text for page ${pageNumber} (${trimmed.length} chars), using original`);
            enhancedPagesText.push({ text: pageText, usedOcr: false });
          }
        } catch (renderErr) {
          log.warn(`Failed to render/OCR page ${pageNumber}: ${renderErr instanceof Error ? renderErr.message : String(renderErr)}`);
          enhancedPagesText.push({ text: pageText, usedOcr: false });
        }
      } else {
        // Page has sufficient text, no OCR needed
        // Clean the text to fix letter-spacing issues
        const cleanedText = cleanExtractedText(pageText);
        enhancedPagesText.push({ text: cleanedText, usedOcr: false });
      }
    }
    
    // Log OCR summary
    if (ocrPagesCount > 0) {
      const ocrDuration = Date.now() - ocrStartTime;
      log.info(`OCR completed for ${ocrPagesCount} pages in ${ocrDuration}ms (avg ${Math.round(ocrDuration / ocrPagesCount)}ms per page)`);
    }
    
    // Build slide content with OCR metadata
    const slides = buildSlideContentWithOcr(enhancedPagesText);
    
    return slides;
  } catch (error) {
    throw new Error(
      `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    await parser.destroy();
  }
}

/**
 * Build SlideContent array from enhanced pages with OCR metadata
 */
function buildSlideContentWithOcr(
  pages: Array<{ text: string; usedOcr: boolean }>
): SlideContent[] {
  const baseSlides = buildSlideContent(pages.map(p => p.text));
  
  // Add usedOcr flag to slides
  return baseSlides.map((slide, index) => ({
    ...slide,
    usedOcr: pages[slide.slideNumber - 1]?.usedOcr || false,
  }));
}

/**
 * Validate if a buffer is a valid PDF
 */
export function isPDF(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  return buffer.length > 4 && buffer.toString('utf-8', 0, 5) === '%PDF-';
}

// Made with Bob
