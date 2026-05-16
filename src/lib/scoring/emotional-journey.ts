/**
 * Emotional Journey Builder
 * Computes investor emotional journey data points from slide NLU analysis
 */

import type { SlideAnalysis, EmotionalJourneyPoint } from '@/types';

/**
 * Build emotional journey data from slide analysis results
 * Maps sentiment scores and tone flags across the deck to visualize
 * the emotional arc an investor experiences while reading
 * 
 * @param slides - Array of analyzed slides with NLU results
 * @returns Array of emotional journey points for visualization
 */
export function buildEmotionalJourney(slides: SlideAnalysis[]): EmotionalJourneyPoint[] {
  return slides.map((slide, index) => {
    const { nluResult } = slide;
    
    // Use NLU sentiment score directly (-1 to +1 range)
    const sentiment = nluResult.sentiment.score;
    
    // Calculate intensity from emotion scores
    // Higher emotion values = higher intensity
    const emotionSum = 
      nluResult.emotion.joy +
      nluResult.emotion.fear +
      nluResult.emotion.anger +
      nluResult.emotion.disgust +
      nluResult.emotion.sadness;
    
    // Normalize intensity to 0-1 range (emotion scores are 0-1 each, max sum is 5)
    const intensity = Math.min(1, emotionSum / 2);
    
    // Extract significant tone flags (score > 0.5)
    const toneFlags = nluResult.tone
      .filter(t => t.score > 0.5)
      .map(t => t.label);
    
    return {
      slideIndex: index,
      sentiment: Math.round(sentiment * 100) / 100, // Round to 2 decimals
      intensity: Math.round(intensity * 100) / 100,
      toneFlags: toneFlags.length > 0 ? toneFlags : undefined,
    };
  });
}

// Made with Bob