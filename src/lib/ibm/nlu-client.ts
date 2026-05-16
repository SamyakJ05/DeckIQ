/**
 * IBM Watson Natural Language Understanding Client
 * Analyzes slide text for sentiment, tone, keywords, entities, and emotions
 */

import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1';
import { IamAuthenticator } from 'ibm-watson/auth';
import type { NLUResult } from '@/types';
import { log } from '@/lib/utils/logger';

const NLU_TIMEOUT = 10000; // 10 seconds as specified in PRD

// Initialize NLU client (singleton pattern)
let nluInstance: NaturalLanguageUnderstandingV1 | null = null;

function getNLUInstance(): NaturalLanguageUnderstandingV1 {
  if (!nluInstance) {
    const apiKey = process.env.NLU_API_KEY;
    const url = process.env.NLU_URL;

    if (!apiKey || !url) {
      throw new Error('NLU_API_KEY and NLU_URL must be set in environment variables');
    }

    nluInstance = new NaturalLanguageUnderstandingV1({
      version: '2022-04-07',
      authenticator: new IamAuthenticator({
        apikey: apiKey,
      }),
      serviceUrl: url,
    });
  }

  return nluInstance;
}

/**
 * Analyze slide text using Watson NLU
 * Returns real NLU data or fallback on timeout/error
 */
export async function analyzeSlide(text: string): Promise<NLUResult> {
  // Validate input
  if (!text || text.trim().length < 10) {
    log.warn('Slide text too short for NLU analysis', { textLength: text.length });
    return createFallbackNLUResult('Text too short');
  }

  try {
    const nlu = getNLUInstance();

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('NLU request timeout')), NLU_TIMEOUT);
    });

    // Create NLU analysis promise
    const analysisPromise = nlu.analyze({
      text,
      features: {
        sentiment: {},
        keywords: {
          emotion: true,
          sentiment: true,
          limit: 5,
        },
        entities: {
          emotion: true,
          sentiment: true,
          limit: 5,
        },
        categories: {
          limit: 3,
        },
      },
      // Note: tone-classifications model is accessed via a separate endpoint
      // We'll handle tone separately if needed
    });

    // Race between analysis and timeout
    const response = await Promise.race([analysisPromise, timeoutPromise]);

    // Transform Watson NLU response to our NLUResult interface
    return transformNLUResponse(response.result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('NLU analysis failed', {
      error: errorMessage,
      textPreview: text.substring(0, 100),
    });

    return createFallbackNLUResult(errorMessage);
  }
}

/**
 * Transform Watson NLU API response to our NLUResult interface
 */
function transformNLUResponse(response: any): NLUResult {
  return {
    sentiment: {
      label: response.sentiment?.document?.label || 'neutral',
      score: response.sentiment?.document?.score || 0,
    },
    tone: extractToneFlags(response),
    keywords: (response.keywords || []).map((kw: any) => ({
      text: kw.text,
      relevance: kw.relevance,
      sentiment: kw.sentiment
        ? {
            label: kw.sentiment.label,
            score: kw.sentiment.score,
          }
        : undefined,
      emotion: kw.emotion
        ? {
            joy: kw.emotion.joy || 0,
            fear: kw.emotion.fear || 0,
            anger: kw.emotion.anger || 0,
            disgust: kw.emotion.disgust || 0,
            sadness: kw.emotion.sadness || 0,
          }
        : undefined,
    })),
    entities: (response.entities || []).map((ent: any) => ({
      text: ent.text,
      type: ent.type,
      relevance: ent.relevance,
      sentiment: ent.sentiment
        ? {
            label: ent.sentiment.label,
            score: ent.sentiment.score,
          }
        : undefined,
      emotion: ent.emotion
        ? {
            joy: ent.emotion.joy || 0,
            fear: ent.emotion.fear || 0,
            anger: ent.emotion.anger || 0,
            disgust: ent.emotion.disgust || 0,
            sadness: ent.emotion.sadness || 0,
          }
        : undefined,
    })),
    categories: (response.categories || []).map((cat: any) => ({
      label: cat.label,
      score: cat.score,
    })),
    emotion: extractDocumentEmotion(response),
  };
}

/**
 * Extract tone flags from NLU response
 * Note: Tone analysis requires a separate model/endpoint in Watson NLU
 * For now, we infer basic tones from sentiment and emotion
 */
function extractToneFlags(response: any): Array<{
  label: 'excited' | 'frustrated' | 'polite' | 'impolite' | 'sad' | 'satisfied' | 'sympathetic';
  score: number;
}> {
  const tones: Array<{ label: any; score: number }> = [];
  const sentiment = response.sentiment?.document;
  const emotion = extractDocumentEmotion(response);

  // Infer tones from sentiment and emotion
  if (sentiment?.label === 'positive' && sentiment.score > 0.5) {
    if (emotion.joy > 0.6) {
      tones.push({ label: 'excited', score: emotion.joy });
    } else {
      tones.push({ label: 'satisfied', score: sentiment.score });
    }
    tones.push({ label: 'polite', score: 0.7 }); // Assume positive = polite
  }

  if (sentiment?.label === 'negative' && sentiment.score < -0.3) {
    if (emotion.anger > 0.5) {
      tones.push({ label: 'frustrated', score: emotion.anger });
    }
    if (emotion.sadness > 0.5) {
      tones.push({ label: 'sad', score: emotion.sadness });
    }
  }

  // Default to polite if no strong tones detected
  if (tones.length === 0) {
    tones.push({ label: 'polite', score: 0.5 });
  }

  return tones;
}

/**
 * Extract document-level emotion from keywords/entities
 */
function extractDocumentEmotion(response: any): {
  joy: number;
  fear: number;
  anger: number;
  disgust: number;
  sadness: number;
} {
  const emotions = { joy: 0, fear: 0, anger: 0, disgust: 0, sadness: 0 };
  let count = 0;

  // Average emotions from keywords
  (response.keywords || []).forEach((kw: any) => {
    if (kw.emotion) {
      emotions.joy += kw.emotion.joy || 0;
      emotions.fear += kw.emotion.fear || 0;
      emotions.anger += kw.emotion.anger || 0;
      emotions.disgust += kw.emotion.disgust || 0;
      emotions.sadness += kw.emotion.sadness || 0;
      count++;
    }
  });

  // Average emotions from entities
  (response.entities || []).forEach((ent: any) => {
    if (ent.emotion) {
      emotions.joy += ent.emotion.joy || 0;
      emotions.fear += ent.emotion.fear || 0;
      emotions.anger += ent.emotion.anger || 0;
      emotions.disgust += ent.emotion.disgust || 0;
      emotions.sadness += ent.emotion.sadness || 0;
      count++;
    }
  });

  // Calculate averages
  if (count > 0) {
    emotions.joy /= count;
    emotions.fear /= count;
    emotions.anger /= count;
    emotions.disgust /= count;
    emotions.sadness /= count;
  }

  return emotions;
}

/**
 * Create fallback NLUResult when analysis fails
 */
function createFallbackNLUResult(reason: string): NLUResult {
  log.warn('Using fallback NLU result', { reason });

  return {
    sentiment: {
      label: 'neutral',
      score: 0,
    },
    tone: [
      {
        label: 'polite',
        score: 0.5,
      },
    ],
    keywords: [
      {
        text: '[NLU unavailable]',
        relevance: 0,
      },
    ],
    entities: [],
    categories: [
      {
        label: '/analysis/unavailable',
        score: 0,
      },
    ],
    emotion: {
      joy: 0,
      fear: 0,
      anger: 0,
      disgust: 0,
      sadness: 0,
    },
  };
}

// Made with Bob
