/**
 * PPTX Design Parser for DeckIQ
 * Extracts design metadata from PPTX XML structure
 * Zero AI inference cost - pure XML parsing
 */

import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface PptxDesignSignals {
  // Per-slide
  elementCount: number;
  wordCount: number;
  bulletCount: number;
  imageCount: number;
  fontNames: string[];
  uniqueFontSizes: number[];
  uniqueColors: string[];         // hex strings
  hasBackground: boolean;
  backgroundType: 'solid' | 'gradient' | 'image' | 'none';

  // Derived scores
  densityRating: 'clean' | 'moderate' | 'cluttered';
  fontDiscipline: 'consistent' | 'varied' | 'chaotic';
  colorDiscipline: 'consistent' | 'varied' | 'chaotic';
  whitespaceQuality: 'generous' | 'tight' | 'cramped';
  hasVisualHierarchy: boolean;
  designScore: number;            // 1–10 computed
  designFeedback: string;         // 1-2 sentence actionable note
}

export interface PptxDeckDesign {
  slideCount: number;
  globalFonts: string[];           // fonts used across entire deck
  globalColors: string[];          // colors used across entire deck
  fontConsistencyScore: number;    // deck-level, 1–10
  colorConsistencyScore: number;   // deck-level, 1–10
  slides: PptxDesignSignals[];
}

export async function parsePptxDesign(buffer: Buffer): Promise<PptxDeckDesign> {
  const zip = await JSZip.loadAsync(buffer);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0');
      const nb = parseInt(b.match(/\d+/)?.[0] || '0');
      return na - nb;
    });

  const allFonts = new Set<string>();
  const allColors = new Set<string>();
  const slideSignals: PptxDesignSignals[] = [];

  for (const slideFile of slideFiles) {
    try {
      const xml = await zip.file(slideFile)?.async('string') ?? '';
      const parsed = parser.parse(xml);
      const spTree = parsed?.['p:sld']?.['p:cSld']?.['p:spTree'];

      // Count elements
      const shapes = toArray(spTree?.['p:sp']);
      const pics = toArray(spTree?.['p:pic']);
      const graphicFrames = toArray(spTree?.['p:graphicFrame']);
      const elementCount = shapes.length + pics.length + graphicFrames.length;

      // Extract text content
      let wordCount = 0;
      let bulletCount = 0;
      const fontNames = new Set<string>();
      const fontSizes = new Set<number>();
      const colors = new Set<string>();

      for (const sp of shapes) {
        const txBody = sp?.['p:txBody'];
        const paras = toArray(txBody?.['a:p']);
        for (const para of paras) {
          const runs = toArray(para?.['a:r']);
          if (runs.length > 0) bulletCount++;
          for (const run of runs) {
            const text = run?.['a:t'] ?? '';
            wordCount += String(text).split(/\s+/).filter(Boolean).length;
            const rPr = run?.['a:rPr'];
            if (rPr) {
              const font = rPr?.['a:latin']?.['@_typeface'];
              if (font) { fontNames.add(font); allFonts.add(font); }
              const sz = parseInt(rPr?.['@_sz'] ?? '0') / 100;
              if (sz > 0) fontSizes.add(sz);
              const solidFill = rPr?.['a:solidFill'];
              const hex = solidFill?.['a:srgbClr']?.['@_val'];
              if (hex) { colors.add(`#${hex}`); allColors.add(`#${hex}`); }
            }
          }
        }
      }

      // Derive scores
      const density = elementCount <= 5 ? 'clean' : elementCount <= 10 ? 'moderate' : 'cluttered';
      const fontDisc = fontNames.size <= 2 ? 'consistent' : fontNames.size <= 4 ? 'varied' : 'chaotic';
      const colorDisc = colors.size <= 4 ? 'consistent' : colors.size <= 7 ? 'varied' : 'chaotic';
      const whitespace = wordCount <= 30 ? 'generous' : wordCount <= 60 ? 'tight' : 'cramped';
      const hasHierarchy = fontSizes.size >= 2 && fontSizes.size <= 4;

      const designScore = computeDesignScore({
        elementCount, wordCount, fontCount: fontNames.size,
        colorCount: colors.size, hasHierarchy, bulletCount,
      });

      const designFeedback = buildDesignFeedback({
        density, fontDisc, colorDisc, whitespace,
        wordCount, bulletCount, elementCount, fontCount: fontNames.size,
      });

      slideSignals.push({
        elementCount, wordCount, bulletCount,
        imageCount: pics.length + graphicFrames.length,
        fontNames: [...fontNames],
        uniqueFontSizes: [...fontSizes].sort((a, b) => b - a),
        uniqueColors: [...colors],
        hasBackground: false,
        backgroundType: 'none',
        densityRating: density,
        fontDiscipline: fontDisc,
        colorDiscipline: colorDisc,
        whitespaceQuality: whitespace,
        hasVisualHierarchy: hasHierarchy,
        designScore,
        designFeedback,
      });
    } catch (err) {
      // Gracefully skip malformed XML
      console.warn(`[PPTX Design] Failed to parse ${slideFile}:`, err);
      slideSignals.push(createFallbackDesignSignals());
    }
  }

  const globalFontArr = [...allFonts];
  const globalColorArr = [...allColors];

  return {
    slideCount: slideSignals.length,
    globalFonts: globalFontArr,
    globalColors: globalColorArr,
    fontConsistencyScore: globalFontArr.length <= 2 ? 9 : globalFontArr.length <= 4 ? 6 : 3,
    colorConsistencyScore: globalColorArr.length <= 5 ? 9 : globalColorArr.length <= 9 ? 6 : 3,
    slides: slideSignals,
  };
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function computeDesignScore(params: {
  elementCount: number; wordCount: number; fontCount: number;
  colorCount: number; hasHierarchy: boolean; bulletCount: number;
}): number {
  let score = 10;
  if (params.elementCount > 10) score -= 2;
  else if (params.elementCount > 6) score -= 1;
  if (params.wordCount > 60) score -= 2;
  else if (params.wordCount > 40) score -= 1;
  if (params.fontCount > 4) score -= 2;
  else if (params.fontCount > 2) score -= 1;
  if (params.colorCount > 7) score -= 2;
  else if (params.colorCount > 4) score -= 1;
  if (!params.hasHierarchy) score -= 1;
  if (params.bulletCount > 6) score -= 1;
  return Math.max(1, score);
}

function buildDesignFeedback(params: {
  density: string; fontDisc: string; colorDisc: string;
  whitespace: string; wordCount: number; bulletCount: number;
  elementCount: number; fontCount: number;
}): string {
  const issues: string[] = [];
  if (params.density === 'cluttered') issues.push(`${params.elementCount} elements is too many — aim for ≤6`);
  if (params.wordCount > 60) issues.push(`${params.wordCount} words per slide — cut to under 40`);
  if (params.bulletCount > 5) issues.push(`${params.bulletCount} bullet points — use 3 max`);
  if (params.fontDisc !== 'consistent') issues.push(`${params.fontCount} font families used — limit to 2`);
  if (params.colorDisc === 'chaotic') issues.push('too many colors — establish a 3-color palette');
  if (issues.length === 0) return 'Well-designed slide with good visual discipline.';
  return issues.slice(0, 2).join('. ') + '.';
}

function createFallbackDesignSignals(): PptxDesignSignals {
  return {
    elementCount: 0,
    wordCount: 0,
    bulletCount: 0,
    imageCount: 0,
    fontNames: [],
    uniqueFontSizes: [],
    uniqueColors: [],
    hasBackground: false,
    backgroundType: 'none',
    densityRating: 'moderate',
    fontDiscipline: 'consistent',
    colorDiscipline: 'consistent',
    whitespaceQuality: 'tight',
    hasVisualHierarchy: false,
    designScore: 5,
    designFeedback: 'Unable to parse design metadata for this slide.',
  };
}

// Made with Bob