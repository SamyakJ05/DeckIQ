/**
 * Google Slides API Parser for DeckIQ
 * Extracts slide content and design metadata from Google Slides presentations
 * Requires GOOGLE_API_KEY environment variable
 */

export interface GoogleSlidesResult {
  title: string;
  slideCount: number;
  slides: {
    index: number;
    text: string;
    wordCount: number;
    elementCount: number;
    fontNames: string[];
    uniqueColors: string[];
    imageCount: number;
    hasChart: boolean;
    designScore: number;
    designFeedback: string;
    densityRating: 'clean' | 'moderate' | 'cluttered';
    colorDiscipline: 'consistent' | 'varied' | 'chaotic';
    whitespaceQuality: 'generous' | 'tight' | 'cramped';
    hasVisualHierarchy: boolean;
  }[];
  globalFonts: string[];
  globalColors: string[];
}

export function extractPresentationId(url: string): string | null {
  const match = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export async function parseGoogleSlides(presentationId: string): Promise<GoogleSlidesResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

  const res = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}?key=${apiKey}`,
    { 
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 } // Don't cache in Next.js
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Presentation not found. Ensure the link is shared as "Anyone with the link can view".');
    }
    throw new Error(`Google Slides API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  
  const title = data.title || 'Untitled Presentation';
  const slides = data.slides || [];
  
  const allFonts = new Set<string>();
  const allColors = new Set<string>();
  const parsedSlides = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const pageElements = slide.pageElements || [];
    
    let text = '';
    let wordCount = 0;
    let elementCount = pageElements.length;
    const fontNames = new Set<string>();
    const colors = new Set<string>();
    let imageCount = 0;
    let hasChart = false;

    for (const element of pageElements) {
      // Extract text from shapes
      if (element.shape?.text) {
        const textElements = element.shape.text.textElements || [];
        for (const textEl of textElements) {
          if (textEl.textRun) {
            const content = textEl.textRun.content || '';
            text += content;
            wordCount += content.split(/\s+/).filter(Boolean).length;
            
            // Extract font
            const style = textEl.textRun.style;
            if (style?.fontFamily) {
              fontNames.add(style.fontFamily);
              allFonts.add(style.fontFamily);
            }
            
            // Extract color
            if (style?.foregroundColor?.opaqueColor?.rgbColor) {
              const rgb = style.foregroundColor.opaqueColor.rgbColor;
              const hex = rgbToHex(rgb.red || 0, rgb.green || 0, rgb.blue || 0);
              colors.add(hex);
              allColors.add(hex);
            }
          }
        }
      }
      
      // Count images
      if (element.image) {
        imageCount++;
      }
      
      // Detect charts
      if (element.sheetsChart) {
        hasChart = true;
      }
    }

    // Derive design scores
    const density: 'clean' | 'moderate' | 'cluttered' = elementCount <= 5 ? 'clean' : elementCount <= 10 ? 'moderate' : 'cluttered';
    const colorDisc: 'consistent' | 'varied' | 'chaotic' = colors.size <= 4 ? 'consistent' : colors.size <= 7 ? 'varied' : 'chaotic';
    const whitespace: 'generous' | 'tight' | 'cramped' = wordCount <= 30 ? 'generous' : wordCount <= 60 ? 'tight' : 'cramped';
    const hasHierarchy = fontNames.size >= 2 && fontNames.size <= 4;

    const designScore = computeDesignScore({
      elementCount,
      wordCount,
      fontCount: fontNames.size,
      colorCount: colors.size,
      hasHierarchy,
    });

    const designFeedback = buildDesignFeedback({
      density,
      colorDisc,
      whitespace,
      wordCount,
      elementCount,
      fontCount: fontNames.size,
    });

    parsedSlides.push({
      index: i,
      text: text.trim(),
      wordCount,
      elementCount,
      fontNames: [...fontNames],
      uniqueColors: [...colors],
      imageCount,
      hasChart,
      designScore,
      designFeedback,
      densityRating: density,
      colorDiscipline: colorDisc,
      whitespaceQuality: whitespace,
      hasVisualHierarchy: hasHierarchy,
    });
  }

  return {
    title,
    slideCount: slides.length,
    slides: parsedSlides,
    globalFonts: [...allFonts],
    globalColors: [...allColors],
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const val = Math.round(n * 255);
    const hex = val.toString(16).padStart(2, '0');
    return hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function computeDesignScore(params: {
  elementCount: number;
  wordCount: number;
  fontCount: number;
  colorCount: number;
  hasHierarchy: boolean;
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
  return Math.max(1, score);
}

function buildDesignFeedback(params: {
  density: string;
  colorDisc: string;
  whitespace: string;
  wordCount: number;
  elementCount: number;
  fontCount: number;
}): string {
  const issues: string[] = [];
  if (params.density === 'cluttered') issues.push(`${params.elementCount} elements is too many — aim for ≤6`);
  if (params.wordCount > 60) issues.push(`${params.wordCount} words per slide — cut to under 40`);
  if (params.fontCount > 2) issues.push(`${params.fontCount} font families used — limit to 2`);
  if (params.colorDisc === 'chaotic') issues.push('too many colors — establish a 3-color palette');
  if (issues.length === 0) return 'Well-designed slide with good visual discipline.';
  return issues.slice(0, 2).join('. ') + '.';
}

// Made with Bob