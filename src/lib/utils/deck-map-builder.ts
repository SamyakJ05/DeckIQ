/**
 * Deck Map Builder
 * Builds deck-level context summaries from SlideAnalysis results
 * Used to provide Granite with structural and content overview before scoring
 */

import type { SlideAnalysis, DeckMap, DeckMapEntry } from '@/types';

/**
 * Build a linear deck map showing slide progression
 * Example: "Slide 1 (Title) -> Slide 2 (Problem) -> Slide 3 (Solution) -> ..."
 */
export function buildDeckMap(slides: SlideAnalysis[]): DeckMap {
  if (slides.length === 0) {
    return 'Empty deck';
  }

  const mapParts = slides.map(
    (slide) => `Slide ${slide.slideNumber} (${slide.slideType})`
  );

  return mapParts.join(' -> ');
}

/**
 * Build a detailed deck content summary with key entities, keywords, and sentiment per slide
 * Returns JSON string of DeckMapEntry array for compact transmission to Granite
 */
export function buildDeckContentSummary(slides: SlideAnalysis[]): string {
  const deckContentEntries: DeckMapEntry[] = slides.map((slide) => {
    // Extract up to 3 key entities
    const keyEntities = slide.nluResult.entities
      .slice(0, 3)
      .map((entity) => entity.text);

    // Get top keyword (first one, or null if none)
    const topKeyword =
      slide.nluResult.keywords.length > 0
        ? slide.nluResult.keywords[0].text
        : null;

    // Get sentiment label
    const sentiment = slide.nluResult.sentiment.label || null;

    return {
      slideNumber: slide.slideNumber,
      slideType: slide.slideType,
      keyEntities,
      topKeyword,
      sentiment,
    };
  });

  // Return compact JSON (no pretty-printing for efficiency)
  return JSON.stringify(deckContentEntries, null, 0);
}

// Made with Bob
