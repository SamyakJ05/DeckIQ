/**
 * PDF Slide Image Extraction for Vision Analysis
 * Converts each PDF page to a base64-encoded PNG for IBM Granite Vision API
 * Reuses existing pdf-to-image infrastructure with compression for API payload limits
 */

import sharp from 'sharp';
import type { SlideImage } from '@/types';
import { renderPdfPageToImageBuffer } from '../ocr/pdf-to-image';
import { log } from '../utils/logger';

// Image storage dimensions (balance quality vs payload size)
// Using JPEG at quality 0.75 with scale 1.2 to keep files under 80KB per slide
const STORAGE_WIDTH = 1280;
const STORAGE_HEIGHT = 720;
const JPEG_QUALITY = 75; // 0.75 quality as specified
const RENDER_SCALE = 1.2; // Reduced from 1.5 to keep file sizes down

/**
 * Extract all slides as compressed base64 images for vision analysis
 * 
 * @param pdfBuffer - Full PDF file buffer
 * @param totalPages - Number of pages in the PDF
 * @returns Array of SlideImage objects with base64-encoded PNGs
 */
export async function extractSlideImages(
  pdfBuffer: Buffer,
  totalPages: number
): Promise<SlideImage[]> {
  log.info(`Extracting ${totalPages} slide images for vision analysis`);
  const startTime = Date.now();
  
  const results: SlideImage[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    try {
      // Render page to image using existing infrastructure
      const imageBuffer = await renderPdfPageToImageBuffer(pdfBuffer, pageNumber, RENDER_SCALE);

      // Convert to JPEG at quality 0.75 for storage
      const compressed = await sharp(imageBuffer)
        .resize(STORAGE_WIDTH, STORAGE_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();

      const base64 = compressed.toString('base64');
      
      results.push({
        slideNumber: pageNumber,
        base64,
        width: STORAGE_WIDTH,
        height: STORAGE_HEIGHT,
        mimeType: 'image/jpeg', // Add MIME type for JPEG
      });

      log.info(`Slide ${pageNumber} image extracted: ${Math.round(base64.length / 1024)}KB base64`);
    } catch (err) {
      log.warn(`Failed to extract image for slide ${pageNumber}: ${err instanceof Error ? err.message : String(err)}`);
      // Push empty image so array indices stay aligned with slide numbers
      results.push({
        slideNumber: pageNumber,
        base64: '',
        width: 0,
        height: 0,
        mimeType: 'image/jpeg',
      });
    }
  }

  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.base64.length > 0).length;
  log.info(`Image extraction complete: ${successCount}/${totalPages} slides in ${duration}ms (avg ${Math.round(duration / totalPages)}ms/slide)`);

  return results;
}

// Made with Bob
