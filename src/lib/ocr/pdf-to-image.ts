/**
 * PDF page → PNG buffer using pdfjs-dist (legacy Node build) + @napi-rs/canvas.
 * Node-only. No browser globals required.
 */

import path from 'path';
// Legacy build required for Node.js — compatible with pdfjs-dist v5 which also ships legacy/build/
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { log } from '../utils/logger';

const DEFAULT_SCALE = 2.0;

/**
 * Render a single PDF page to a PNG buffer.
 * Throws on failure — callers should catch and fall back to empty text.
 *
 * @param pdfBuffer  - Full PDF file bytes
 * @param pageNumber - 1-based page number
 * @param scale      - Viewport scale factor (higher = better OCR resolution)
 */
export async function renderPdfPageToImageBuffer(
  pdfBuffer: Buffer,
  pageNumber: number,
  scale: number = DEFAULT_SCALE
): Promise<Buffer> {
  log.info(`Rendering PDF page ${pageNumber} to image (scale=${scale})`);

  // Set workerSrc inside function (not module-level) so pdf-parse initializing
  // its own pdfjs instance cannot overwrite this before getDocument() runs.
  const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

  const data = new Uint8Array(pdfBuffer);

  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    // Prevents pdfjs from fetching standard fonts over the network
    standardFontDataUrl: undefined,
  });

  const pdf = await loadingTask.promise;

  try {
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(
        `Page ${pageNumber} out of range — PDF has ${pdf.numPages} page(s)`
      );
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    page.cleanup();

    const imageBuffer = canvas.toBuffer('image/png');
    log.info(
      `Page ${pageNumber} rendered: ${width}×${height}px, ${imageBuffer.length} bytes`
    );

    return imageBuffer;
  } finally {
    await pdf.destroy();
  }
}
