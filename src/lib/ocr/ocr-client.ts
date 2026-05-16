/**
 * OCR client using tesseract.js for image-to-text extraction
 */

import Tesseract from 'tesseract.js';
import { log } from '../utils/logger';

/**
 * Performs OCR on an image buffer to extract text
 * @param imageBuffer - PNG or JPEG image buffer
 * @returns Extracted text or empty string on failure
 */
export async function ocrImageBuffer(imageBuffer: Buffer): Promise<string> {
  try {
    log.info('Starting OCR on image buffer');
    
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          log.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const extractedText = result.data.text || '';
    log.info(`OCR completed, extracted ${extractedText.length} characters`);
    
    return extractedText;
  } catch (error) {
    log.error('OCR failed', { error });
    return '';
  }
}

// Made with Bob