/**
 * PPTX Slide Thumbnail Generator
 * Renders branded slide thumbnails from extracted text and design signals.
 * Uses @napi-rs/canvas — no AI inference cost, pure CPU.
 */

import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import sharp from 'sharp';
import type { SlideContent, SlideImage, SlideType } from '@/types';
import type { PptxDeckDesign } from '@/lib/pptx-design-parser';
import { log } from '@/lib/utils/logger';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const JPEG_QUALITY = 75;
const PAD_X = 80;

// Fallback accent colors per slide type (used when no brand colors found)
const TYPE_ACCENT: Record<SlideType, string> = {
  Title:         '#4A90E2',
  Problem:       '#E25C5C',
  Solution:      '#5CE27A',
  Market:        '#7A5CE2',
  BusinessModel: '#E2925C',
  Traction:      '#E24A4A',
  Competition:   '#5C8CE2',
  Team:          '#C25CE2',
  Ask:           '#E2D44A',
  Other:         '#5C9CE2',
};

function isNeutral(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length < 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 35 || brightness > 215;
}

function pickAccent(slideColors: string[], deckColors: string[], slideType: SlideType): string {
  const candidates = [...slideColors, ...deckColors].filter(c => c && !isNeutral(c));
  return candidates[0] ?? TYPE_ACCENT[slideType];
}

function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(test).width > maxWidth) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function renderSlide(
  slide: SlideContent,
  accentHex: string,
  totalSlides: number,
): Promise<string> {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d') as SKRSContext2D;

  // Dark background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle brand tint overlay
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.globalAlpha = 1.0;

  // Left accent bar (5px)
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 5, CANVAS_HEIGHT);

  const textLines = slide.bodyText.split('\n').filter(l => l.trim());
  const title = (slide.title ?? textLines[0] ?? slide.estimatedSlideType).substring(0, 70);
  const bodyContent = textLines.slice(slide.title ? 0 : 1);

  // Slide type label (small, muted)
  ctx.fillStyle = `${accentHex}AA`;
  ctx.font = '500 18px sans-serif';
  ctx.fillText(slide.estimatedSlideType.toUpperCase(), PAD_X, 72);

  // Title
  ctx.fillStyle = '#f0ede5';
  ctx.font = 'bold 52px sans-serif';
  const titleLines = wrapText(ctx, title, CANVAS_WIDTH - PAD_X * 2);
  let titleBottom = 72;
  titleLines.slice(0, 2).forEach((line, li) => {
    ctx.fillText(line, PAD_X, 72 + 68 + li * 66);
    titleBottom = 72 + 68 + li * 66;
  });

  // Divider
  const dividerY = titleBottom + 20;
  ctx.fillStyle = `${accentHex}55`;
  ctx.fillRect(PAD_X, dividerY, 90, 3);

  // Body text
  ctx.fillStyle = 'rgba(240,237,229,0.62)';
  ctx.font = '25px sans-serif';
  const maxBodyLines = Math.floor((CANVAS_HEIGHT - dividerY - 70) / 43);
  let bodyY = dividerY + 46;
  let rendered = 0;

  for (const line of bodyContent) {
    if (rendered >= maxBodyLines) break;
    const wrapped = wrapText(ctx, line.substring(0, 110), CANVAS_WIDTH - PAD_X * 2);
    for (const wl of wrapped) {
      if (rendered >= maxBodyLines) break;
      ctx.fillText(wl, PAD_X, bodyY);
      bodyY += 43;
      rendered++;
    }
  }

  // Slide counter (bottom-right)
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '15px monospace';
  ctx.fillText(
    `${String(slide.slideNumber).padStart(2, '0')} / ${totalSlides}`,
    CANVAS_WIDTH - 96,
    CANVAS_HEIGHT - 28,
  );

  const pngBuffer = canvas.toBuffer('image/png');
  const jpegBuffer = await sharp(pngBuffer)
    .resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return jpegBuffer.toString('base64');
}

export async function generatePptxSlideImages(
  slides: SlideContent[],
  deckDesign: PptxDeckDesign,
): Promise<SlideImage[]> {
  log.info('Generating PPTX slide thumbnails', { slideCount: slides.length });

  const results: SlideImage[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const designSignals = deckDesign.slides[i];
    try {
      const accentHex = pickAccent(
        designSignals?.uniqueColors ?? [],
        deckDesign.globalColors,
        slide.estimatedSlideType,
      );
      const base64 = await renderSlide(slide, accentHex, slides.length);
      results.push({ slideNumber: slide.slideNumber, base64, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, mimeType: 'image/jpeg' });
    } catch (err) {
      log.warn('PPTX thumbnail failed for slide', {
        slideNumber: slide.slideNumber,
        error: err instanceof Error ? err.message : String(err),
      });
      results.push({ slideNumber: slide.slideNumber, base64: '', width: 0, height: 0, mimeType: 'image/jpeg' });
    }
  }

  const success = results.filter(r => r.base64.length > 0).length;
  log.info('PPTX thumbnails complete', { total: slides.length, success });
  return results;
}
