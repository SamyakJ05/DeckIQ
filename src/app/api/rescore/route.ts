/**
 * POST /api/rescore
 * Re-score a single slide after rewriting
 * 
 * Request body:
 * {
 *   slideNumber: number,
 *   slideType: SlideType,
 *   rewrittenText: string
 * }
 * 
 * Response:
 * {
 *   slideNumber: number,
 *   nluResult: NLUResult,
 *   graniteScores: RubricScores,
 *   slideHealthScore: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SlideType, NLUResult, RubricScores } from '@/types';
import { analyzeSlide } from '@/lib/ibm/nlu-client';
import { callGraniteJSON, createNeutralRubricScores } from '@/lib/ibm/granite-client';
import { buildRubricScoringPrompt } from '@/lib/ibm/prompts/rubric-prompt';
import { log } from '@/lib/utils/logger';

interface RescoreRequest {
  slideNumber: number;
  slideType: SlideType;
  rewrittenText: string;
}

interface RescoreResponse {
  slideNumber: number;
  nluResult: NLUResult;
  graniteScores: RubricScores;
  slideHealthScore: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as RescoreRequest;

    // Validate required fields
    if (!body.slideNumber || !body.slideType || !body.rewrittenText) {
      return NextResponse.json(
        { error: 'Missing required fields: slideNumber, slideType, rewrittenText' },
        { status: 400 }
      );
    }

    log.info('Rescore request received', {
      slideNumber: body.slideNumber,
      slideType: body.slideType,
      textLength: body.rewrittenText.length,
    });

    // Step 1: Run Watson NLU on rewritten text
    let nluResult: NLUResult;
    try {
      nluResult = await analyzeSlide(body.rewrittenText);
      log.info('NLU analysis complete for rewritten slide', {
        slideNumber: body.slideNumber,
        sentiment: nluResult.sentiment.label,
      });
    } catch (error) {
      log.error('NLU analysis failed for rewritten slide', {
        slideNumber: body.slideNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Return fallback NLU result
      nluResult = {
        sentiment: { label: 'neutral' as const, score: 0 },
        tone: [{ label: 'polite' as const, score: 0.5 }],
        keywords: [{ text: '[NLU unavailable]', relevance: 0 }],
        entities: [],
        categories: [{ label: '/analysis/unavailable', score: 0 }],
        emotion: { joy: 0, fear: 0, anger: 0, disgust: 0, sadness: 0 },
      };
    }

    // Step 2: Run Granite rubric scoring on rewritten text
    // Note: For a single slide rescore, we don't have full deck context
    // We'll use a simplified deck map indicating this is a standalone rescore
    const simplifiedDeckMap = `Slide ${body.slideNumber} (${body.slideType}) - Standalone Rescore`;
    const simplifiedContentSummary = JSON.stringify([{
      slideNumber: body.slideNumber,
      slideType: body.slideType,
      keyEntities: nluResult.entities.slice(0, 3).map(e => e.text),
      topKeyword: nluResult.keywords[0]?.text || null,
      sentiment: nluResult.sentiment.label,
    }]);

    let graniteScores: RubricScores;
    try {
      const prompt = buildRubricScoringPrompt(
        body.rewrittenText,
        body.slideType,
        body.slideNumber,
        body.slideNumber, // totalSlides = slideNumber for standalone rescore
        nluResult,
        simplifiedDeckMap,
        simplifiedContentSummary
      );
      
      graniteScores = await callGraniteJSON(prompt);
      log.info('Granite scoring complete for rewritten slide', {
        slideNumber: body.slideNumber,
      });
    } catch (error) {
      log.error('Granite scoring failed for rewritten slide', {
        slideNumber: body.slideNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Return neutral scores on failure
      graniteScores = createNeutralRubricScores('Granite API error during rescore');
    }

    // Step 3: Calculate slide health score
    // Use weighted average of relevant dimensions
    const slideHealthScore = Math.round(
      (graniteScores.problemClarity.score +
        graniteScores.solutionFit.score +
        graniteScores.narrativeFlow.score) / 3 * 10
    );

    log.info('Rescore complete', {
      slideNumber: body.slideNumber,
      slideHealthScore,
    });

    const response: RescoreResponse = {
      slideNumber: body.slideNumber,
      nluResult,
      graniteScores,
      slideHealthScore,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    log.error('Rescore endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { error: 'Failed to process rescore request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Made with Bob