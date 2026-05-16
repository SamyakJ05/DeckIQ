/**
 * PDF page to image conversion for OCR
 * Simplified stub implementation for hackathon
 * 
 * NOTE: This is a minimal implementation. In production, you would use:
 * - pdf2pic or similar library for server-side PDF rendering
 * - Or a service like AWS Textract for OCR
 * 
 * For the hackathon, we'll return null and log a warning,
 * which will cause the OCR to be skipped gracefully.
 */

import { log } from '../utils/logger';

/**
 * Attempts to render a PDF page to an image buffer for OCR
 * 
 * CURRENT LIMITATION: This is a stub implementation.
 * Proper PDF-to-image rendering requires native dependencies (Cairo, Poppler)
 * which are complex to install. For the hackathon demo, we'll skip OCR
 * and document this as a known limitation.
 * 
 * @param pdfBuffer - The PDF file buffer
 * @param pageNumber - 1-based page number
 * @returns Image buffer or null (currently always returns null)
 */
export async function renderPdfPageToImageBuffer(
  pdfBuffer: Buffer,
  pageNumber: number
): Promise<Buffer | null> {
  log.warn(
    `PDF-to-image rendering not implemented for page ${pageNumber}. ` +
    `OCR will be skipped. To enable OCR, install pdf2pic or similar library with native dependencies.`
  );
  
  // Return null to skip OCR gracefully
  // The parsing pipeline will handle this and use the original (empty) text
  return null;
}

// Made with Bob