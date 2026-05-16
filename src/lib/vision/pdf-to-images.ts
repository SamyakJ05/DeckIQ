/**
 * PDF Slide Image Extraction for Vision Analysis
 * Converts each PDF page to a base64-encoded PNG for IBM Granite Vision API
 * Reuses existing pdf-to-image infrastructure with compression for API payload limits
 */

import sharp from 'sharp';
import type { SlideImage } from '@/types';
import { renderPdfPageToImageBuffer } from '../ocr/pdf-to-image';
import { log } from '../utils/logger';

// Vision API optimal dimensions (balance quality vs payload size)
const VISION_WIDTH = 1024;
const VISION_HEIGHT = 576;
const VISION_QUALITY = 80;

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
      // Render page to high-res PNG using existing infrastructure
      const imageBuffer = await renderPdfPageToImageBuffer(pdfBuffer, pageNumber, 2.0);

      // Compress and resize for vision API payload limits
      const compressed = await sharp(imageBuffer)
        .resize(VISION_WIDTH, VISION_HEIGHT, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .png({ quality: VISION_QUALITY, compressionLevel: 9 })
        .toBuffer();

      const base64 = compressed.toString('base64');
      
      results.push({
        slideNumber: pageNumber,
        base64,
        width: VISION_WIDTH,
        height: VISION_HEIGHT,
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
      });
    }
  }

  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.base64.length > 0).length;
  log.info(`Image extraction complete: ${successCount}/${totalPages} slides in ${duration}ms (avg ${Math.round(duration / totalPages)}ms/slide)`);

  return results;
}

// Made with Bob
