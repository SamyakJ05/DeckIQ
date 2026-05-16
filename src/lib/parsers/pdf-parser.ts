/**
 * PDF Parser for DeckIQ
 * Extracts text content from PDF files page-by-page using pdf-parse v2
 */

import { PDFParse } from 'pdf-parse';
import * as PDFWorker from 'pdf-parse/worker';
import type { SlideContent } from '@/types';
import { buildSlideContent } from './parser-utils';

/**
 * Parse a PDF buffer and extract slide content
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
    return buildSlideContent(pagesText);
  } catch (error) {
    throw new Error(
      `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    await parser.destroy();
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
