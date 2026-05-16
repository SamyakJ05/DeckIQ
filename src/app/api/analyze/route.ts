/**
 * POST /api/analyze
 * Main analysis endpoint for DeckIQ
 *
 * Current implementation: Parses PDF/PPTX files, returns mock NLU and Granite data
 * TODO: Integrate real NLU and Granite scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  DeckAnalysisResult,
  SlideAnalysis,
  NLUResult,
  RubricScores,
  SlideContent,
  SlideType,
} from '@/types';
import { parsePDF } from '@/lib/parsers/pdf-parser';
import { parsePPTX } from '@/lib/parsers/pptx-parser';
import { analyzeSlide } from '@/lib/ibm/nlu-client';
import { log } from '@/lib/utils/logger';
import { buildDeckMap, buildDeckContentSummary } from '@/lib/utils/deck-map-builder';
import {
  callGraniteJSON,
  callGraniteJSONWithRateLimit,
  createNeutralRubricScores,
  getTopCriticalFixes,
  getInvestorSummary
} from '@/lib/ibm/granite-client';
import { buildRubricScoringPrompt } from '@/lib/ibm/prompts/rubric-prompt';
import { buildEmotionalJourney } from '@/lib/scoring/emotional-journey';


// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Aggregate rubric scores across all slides
 * Takes the average score for each dimension
 */
function aggregateRubricScores(slides: SlideAnalysis[]): RubricScores {
  const dimensionKeys: (keyof RubricScores)[] = [
    'problemClarity',
    'solutionFit',
    'marketSize',
    'tractionEvidence',
    'businessModel',
    'competitiveMoat',
    'teamStrength',
    'askClarity',
    'narrativeFlow',
    'investorReadiness',
  ];

  const aggregated: any = {};

  for (const dimension of dimensionKeys) {
    // Calculate average score across all slides
    const scores = slides.map(s => s.graniteScores[dimension].score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Collect all rationales
    const rationales = slides
      .map((s, i) => `Slide ${i + 1}: ${s.graniteScores[dimension].rationale}`)
      .join(' | ');

    aggregated[dimension] = {
      score: Math.round(avgScore * 10) / 10, // Round to 1 decimal
      rationale: `Avg across ${slides.length} slides: ${rationales.substring(0, 200)}...`,
    };
  }

  return aggregated as RubricScores;
}

/**
 * Calculate overall deck health score from aggregated rubric scores
 * Uses weighted formula from PRD Section 6.4
 */
function calculateOverallScore(rubricScores: RubricScores): number {
  const weights = {
    problemClarity: 0.10,
    solutionFit: 0.10,
    marketSize: 0.10,
    tractionEvidence: 0.20, // Highest weight
    businessModel: 0.10,
    competitiveMoat: 0.08,
    teamStrength: 0.12, // Second highest
    askClarity: 0.10,
    narrativeFlow: 0.08,
    investorReadiness: 0.02,
  };

  let weightedSum = 0;
  for (const [dimension, weight] of Object.entries(weights)) {
    const score = rubricScores[dimension as keyof RubricScores].score;
    weightedSum += score * weight;
  }

  // Convert from 0-10 scale to 0-100 scale
  return Math.round(weightedSum * 10);
}
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse multipart/form-data and extract file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 20MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file type and parse
    let slides: SlideContent[];
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      slides = await parsePDF(buffer);
    } else if (fileName.endsWith('.pptx')) {
      slides = await parsePPTX(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or PPTX file.' },
        { status: 400 }
      );
    }

    if (slides.length === 0) {
      return NextResponse.json(
        { error: 'No slides could be extracted from the file' },
        { status: 400 }
      );
    }

    if (slides.length < 5) {
      log.warn('Deck has fewer than 5 slides', { slideCount: slides.length });
    }

    log.info('Starting NLU analysis', { slideCount: slides.length });

    // Step 3: Run Watson NLU analysis sequentially with rate limiting
    const nluResults: NLUResult[] = [];
    for (const slide of slides) {
      try {
        const result = await analyzeSlide(slide.bodyText);
        nluResults.push(result);
      } catch (error) {
        log.error('NLU analysis failed for slide', {
          slideNumber: slide.slideNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Return fallback on error
        nluResults.push({
          sentiment: { label: 'neutral' as const, score: 0 },
          tone: [{ label: 'polite' as const, score: 0.5 }],
          keywords: [{ text: '[NLU unavailable]', relevance: 0 }],
          entities: [],
          categories: [{ label: '/analysis/unavailable', score: 0 }],
          emotion: { joy: 0, fear: 0, anger: 0, disgust: 0, sadness: 0 },
        });
      }
    }

    log.info('NLU analysis complete', {
      slideCount: slides.length,
      successCount: nluResults.filter(r => r.keywords[0]?.text !== '[NLU unavailable]').length,
    });

    // Build temporary slide analysis objects with NLU data (no Granite scores yet)
    const slidesWithNLU = slides.map((slide, index) => ({
      slideNumber: slide.slideNumber,
      slideType: slide.estimatedSlideType,
      rawText: slide.bodyText,
      nluResult: nluResults[index],
    }));

    // Step 4: Build deck-level context (Deck Map and Content Summary)
    log.info('Building deck-level context');
    const deckMap = buildDeckMap(slidesWithNLU.map(s => ({
      ...s,
      graniteScores: createMockRubricScores(), // Temporary for type compatibility
      slideHealthScore: 0,
    })));
    const deckContentSummary = buildDeckContentSummary(slidesWithNLU.map(s => ({
      ...s,
      graniteScores: createMockRubricScores(), // Temporary for type compatibility
      slideHealthScore: 0,
    })));

    log.info('Deck context built', {
      deckMapLength: deckMap.length,
      contentSummaryLength: deckContentSummary.length,
    });

    // Step 5: Run Granite rubric scoring sequentially with rate limiting
    log.info('Starting Granite rubric scoring', { slideCount: slides.length });
    
    const graniteResults: RubricScores[] = [];
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3; // Stop after 3 consecutive failures
    
    for (let i = 0; i < slidesWithNLU.length; i++) {
      const slide = slidesWithNLU[i];
      
      // If too many consecutive failures, use fallback for remaining slides
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        log.warn('Too many consecutive Granite failures, using fallback for remaining slides', {
          remainingSlides: slidesWithNLU.length - i
        });
        for (let j = i; j < slidesWithNLU.length; j++) {
          graniteResults.push(createNeutralRubricScores('Too many API failures'));
        }
        break;
      }
      
      try {
        const prompt = buildRubricScoringPrompt(
          slide.rawText,
          slide.slideType,
          slide.slideNumber,
          slidesWithNLU.length,
          slide.nluResult,
          deckMap,
          deckContentSummary
        );
        
        const result = await callGraniteJSONWithRateLimit(prompt);
        graniteResults.push(result);
        consecutiveFailures = 0; // Reset on success
        
      } catch (error) {
        consecutiveFailures++;
        log.error('Granite scoring failed for slide', {
          slideNumber: slide.slideNumber,
          consecutiveFailures,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Return neutral scores on failure instead of crashing
        graniteResults.push(createNeutralRubricScores('Granite API error'));
      }
    }

    log.info('Granite rubric scoring complete', {
      slideCount: slides.length,
      successCount: graniteResults.filter(r => !r.problemClarity.rationale.includes('Unable to score')).length,
    });

    // Step 6: Build final SlideAnalysis objects with real Granite scores
    const perSlideAnalysis: SlideAnalysis[] = slidesWithNLU.map((slide, index) => {
      const graniteScores = graniteResults[index];
      
      // Calculate slide health score as weighted average of relevant dimensions
      const slideHealthScore = Math.round(
        (graniteScores.problemClarity.score +
          graniteScores.solutionFit.score +
          graniteScores.narrativeFlow.score) / 3 * 10
      );

      return {
        slideNumber: slide.slideNumber,
        slideType: slide.slideType,
        rawText: slide.rawText,
        nluResult: slide.nluResult,
        graniteScores,
        slideHealthScore,
        usedOcr: slides[index].usedOcr, // Propagate OCR flag from parsed slide
      };
    });

    // Step 7: Aggregate rubric scores across all slides
    log.info('Aggregating rubric scores');
    const aggregatedRubricScores = aggregateRubricScores(perSlideAnalysis);
    
    // Calculate overall score from aggregated rubric
    const overallScore = calculateOverallScore(aggregatedRubricScores);
    const verdict = generateVerdict(slides.length);

    // Step 8: Build full deck text for investor summary
    const fullDeckText = slides.map(s => s.bodyText).join('\n\n');

    // Step 9: Generate Critical Fixes and Investor Summary with Granite
    log.info('Generating critical fixes and investor summary');
    const [criticalFixes, investorSummary] = await Promise.all([
      getTopCriticalFixes(aggregatedRubricScores, slides.length, overallScore),
      getInvestorSummary(fullDeckText, deckMap),
    ]);

    log.info('Critical fixes and investor summary complete');

    // Parse content summary for debug output (first 2 entries)
    const parsedContentSummary = JSON.parse(deckContentSummary);
    const debugContentSummary = parsedContentSummary.slice(0, 2);

    // Step 10: Build emotional journey from NLU sentiment data
    log.info('Building emotional journey');
    const emotionalJourney = buildEmotionalJourney(perSlideAnalysis);

    const analysisResult: DeckAnalysisResult = {
      overallScore,
      verdict,
      rubricBreakdown: aggregatedRubricScores,
      perSlideAnalysis,
      criticalFixes,
      investorSummary,
      emotionalJourney,
    };

    // Add debug metadata to response for manual inspection
    const responseWithDebug = {
      ...analysisResult,
      _debug: {
        deckMap,
        deckContentSummaryPreview: debugContentSummary,
        deckContentSummaryFullLength: deckContentSummary.length,
      },
    };

    return NextResponse.json(responseWithDebug, { status: 200 });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze deck', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function calculateMockOverallScore(slideCount: number): number {
  // Base score varies with slide count
  const baseScore = Math.min(70, 50 + slideCount * 2);
  return Math.round(baseScore);
}

function generateVerdict(slideCount: number): string {
  if (slideCount < 5) {
    return 'Deck is too short - add more slides to tell your complete story';
  } else if (slideCount < 10) {
    return 'Good foundation, but needs more detail in key areas';
  } else if (slideCount <= 15) {
    return 'Strong foundation, but your traction story needs work';
  } else {
    return 'Comprehensive deck - focus on tightening the narrative';
  }
}

function generateMockCriticalFixes(slideCount: number): Array<{
  rank: number;
  dimension: string;
  fix: string;
  estimatedScoreImpact: number;
  slideToFix: number;
}> {
  return [
    {
      rank: 1,
      dimension: 'tractionEvidence',
      fix: 'Add specific revenue numbers or user growth metrics with timeframes',
      estimatedScoreImpact: 12,
      slideToFix: Math.min(slideCount, 5),
    },
    {
      rank: 2,
      dimension: 'marketSize',
      fix: 'Include TAM/SAM/SOM breakdown with data sources',
      estimatedScoreImpact: 8,
      slideToFix: Math.min(slideCount, 4),
    },
    {
      rank: 3,
      dimension: 'askClarity',
      fix: 'Specify exact funding amount and use of funds breakdown',
      estimatedScoreImpact: 6,
      slideToFix: slideCount,
    },
  ];
}

function generateMockInvestorSummary(slideCount: number): string {
  return `Based on ${slideCount} slides: The problem is compelling and the solution is technically sound. However, I need to see concrete traction metrics before I can assess product-market fit. The team background is missing, which raises questions about execution capability.`;
}

function generateMockEmotionalJourney(slideCount: number): Array<{
  slideIndex: number;
  sentiment: number;
  intensity: number;
  toneFlags?: string[];
}> {
  const journey = [];
  for (let i = 1; i <= slideCount; i++) {
    // Create a simple emotional arc: start negative, peak positive in middle, end moderate
    const progress = i / slideCount;
    const sentiment = Math.sin(progress * Math.PI) * 0.8 - 0.2;
    const intensity = 0.5 + Math.random() * 0.3;
    
    journey.push({
      slideIndex: i,
      sentiment: Math.round(sentiment * 100) / 100,
      intensity: Math.round(intensity * 100) / 100,
      toneFlags: i === 1 ? ['frustrated'] : i === Math.floor(slideCount / 2) ? ['excited', 'polite'] : ['satisfied'],
    });
  }
  return journey;
}

function createMockRubricScores(): RubricScores {
  return {
    problemClarity: { score: 8, rationale: 'Problem is well-articulated with clear pain points' },
    solutionFit: { score: 7, rationale: 'Solution directly addresses the problem but needs more differentiation' },
    marketSize: { score: 5, rationale: 'Market size mentioned but lacks TAM/SAM/SOM breakdown' },
    tractionEvidence: { score: 4, rationale: 'Beta users mentioned but no revenue or growth metrics provided' },
    businessModel: { score: 6, rationale: 'Revenue model implied but not explicitly stated' },
    competitiveMoat: { score: 6, rationale: 'IBM technology integration provides some defensibility' },
    teamStrength: { score: 5, rationale: 'Team slide missing - cannot assess founder backgrounds' },
    askClarity: { score: 5, rationale: 'Funding need not specified with exact amount' },
    narrativeFlow: { score: 7, rationale: 'Logical progression from problem to solution to traction' },
    investorReadiness: { score: 7, rationale: 'Deck structure is sound but missing key slides (Team, Competition, Ask)' },
  };
}

/**
 * Create SlideAnalysis with real NLU data and mock Granite scores
 */
function createSlideAnalysisWithRealNLU(
  slideNumber: number,
  slideType: SlideType,
  rawText: string,
  nluResult: NLUResult
): SlideAnalysis {
  const mockRubric = createMockRubricScores();
  
  // Calculate slide health score as weighted average of relevant dimensions
  const slideHealthScore = Math.round(
    (mockRubric.problemClarity.score +
      mockRubric.solutionFit.score +
      mockRubric.narrativeFlow.score) / 3 * 10
  );

  return {
    slideNumber,
    slideType,
    rawText,
    nluResult, // Real Watson NLU data
    graniteScores: mockRubric, // Still mock - will be replaced in next step
    slideHealthScore,
  };
}

// Made with Bob
