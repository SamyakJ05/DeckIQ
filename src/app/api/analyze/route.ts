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
  SlideImage,
  SlideType,
  VisualSlideContext,
} from '@/types';
import { parsePDF } from '@/lib/parsers/pdf-parser';
import { parsePPTX } from '@/lib/parsers/pptx-parser';
import { parsePptxDesign } from '@/lib/pptx-design-parser';
import { parseGoogleSlides, extractPresentationId } from '@/lib/google-slides-parser';
import { analyzeSlide } from '@/lib/ibm/nlu-client';
import { log } from '@/lib/utils/logger';
import { buildDeckMap, buildDeckContentSummary } from '@/lib/utils/deck-map-builder';
import { extractSlideImages } from '@/lib/vision/pdf-to-images';
import { generatePptxSlideImages } from '@/lib/vision/pptx-to-images';
import { analyzeSlideVisually } from '@/lib/vision/vision-client';
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
    // Parse multipart/form-data and extract file or URL
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    // Handle Google Slides URL
    if (url) {
      const presentationId = extractPresentationId(url);
      if (!presentationId) {
        return NextResponse.json(
          { error: 'Invalid Google Slides URL. Please provide a valid presentation link.' },
          { status: 400 }
        );
      }

      try {
        log.info('Parsing Google Slides presentation', { presentationId });
        const googleSlidesResult = await parseGoogleSlides(presentationId);
        
        // Convert Google Slides result to SlideContent format
        const slides: SlideContent[] = googleSlidesResult.slides.map(slide => ({
          slideNumber: slide.index + 1,
          title: undefined,
          bodyText: slide.text,
          estimatedSlideType: 'Other' as SlideType,
          visualContext: {
            hasCharts: slide.hasChart,
            hasImages: slide.imageCount > 0,
            hasTables: false,
            chartData: '',
            imageDescriptions: '',
            tableData: '',
            layoutDescription: '',
            rawVisualText: '',
            designScore: slide.designScore,
            densityRating: slide.densityRating,
            hasVisualHierarchy: slide.hasVisualHierarchy,
            colorDiscipline: slide.colorDiscipline,
            whitespaceQuality: slide.whitespaceQuality,
            typographyNotes: `Fonts: ${slide.fontNames.join(', ') || 'default'}`,
            designFeedback: slide.designFeedback,
          },
        }));

        // Store deck design metadata for later use
        const deckDesignMetadata = {
          fontConsistencyScore: googleSlidesResult.globalFonts.length <= 2 ? 9 : googleSlidesResult.globalFonts.length <= 4 ? 6 : 3,
          colorConsistencyScore: googleSlidesResult.globalColors.length <= 5 ? 9 : googleSlidesResult.globalColors.length <= 9 ? 6 : 3,
          globalFonts: googleSlidesResult.globalFonts,
          globalColors: googleSlidesResult.globalColors,
        };

        // Continue with normal analysis flow using slides
        return await analyzeSlides(slides, 'google-slides', deckDesignMetadata);
      } catch (error) {
        log.error('Google Slides parsing failed', {
          error: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to parse Google Slides presentation' },
          { status: 500 }
        );
      }
    }

    // Handle file upload
    if (!file) {
      return NextResponse.json(
        { error: 'No file or URL provided' },
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
    let deckDesignMetadata: { fontConsistencyScore: number; colorConsistencyScore: number; globalFonts: string[]; globalColors: string[] } | undefined;
    let pptxImages: SlideImage[] = [];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      slides = await parsePDF(buffer);
    } else if (fileName.endsWith('.pptx')) {
      slides = await parsePPTX(buffer);

      // Parse PPTX design metadata and generate slide thumbnails
      try {
        log.info('Parsing PPTX design metadata');
        const deckDesign = await parsePptxDesign(buffer);

        // Merge design signals into each slide's visualContext
        for (const slide of slides) {
          const designSignals = deckDesign.slides[slide.slideNumber - 1];
          if (designSignals) {
            slide.visualContext = {
              ...(slide.visualContext ?? {
                hasCharts: false,
                hasImages: false,
                hasTables: false,
                chartData: '',
                imageDescriptions: '',
                tableData: '',
                layoutDescription: '',
                rawVisualText: '',
              }),
              hasImages: designSignals.imageCount > 0,
              designScore: designSignals.designScore,
              densityRating: designSignals.densityRating,
              hasVisualHierarchy: designSignals.hasVisualHierarchy,
              colorDiscipline: designSignals.colorDiscipline,
              whitespaceQuality: designSignals.whitespaceQuality,
              typographyNotes: `Fonts: ${designSignals.fontNames.join(', ') || 'default'} · Sizes: ${designSignals.uniqueFontSizes.slice(0, 4).join('pt, ')}pt`,
              designFeedback: designSignals.designFeedback,
            };
          }
        }

        // Store deck-level design metadata
        deckDesignMetadata = {
          fontConsistencyScore: deckDesign.fontConsistencyScore,
          colorConsistencyScore: deckDesign.colorConsistencyScore,
          globalFonts: deckDesign.globalFonts,
          globalColors: deckDesign.globalColors,
        };

        log.info('PPTX design parsing complete', {
          fontConsistency: deckDesign.fontConsistencyScore,
          colorConsistency: deckDesign.colorConsistencyScore,
        });

        // Generate branded slide thumbnails for display
        pptxImages = await generatePptxSlideImages(slides, deckDesign);
      } catch (err) {
        log.warn('PPTX design/thumbnail step failed, continuing without', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or PPTX file.' },
        { status: 400 }
      );
    }

    return await analyzeSlides(
      slides,
      fileName.endsWith('.pdf') ? 'pdf' : 'pptx',
      deckDesignMetadata,
      fileName.endsWith('.pdf') ? buffer : undefined,
      fileName.endsWith('.pptx') ? pptxImages : undefined,
    );
  } catch (error) {
    log.error('Analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error during analysis' },
      { status: 500 }
    );
  }
}

async function analyzeSlides(
  slides: SlideContent[],
  fileType: 'pdf' | 'pptx' | 'google-slides',
  deckDesignMetadata?: { fontConsistencyScore: number; colorConsistencyScore: number; globalFonts: string[]; globalColors: string[] },
  pdfBuffer?: Buffer,
  preGeneratedImages?: SlideImage[],
): Promise<NextResponse> {
  try {

    if (slides.length === 0) {
      return NextResponse.json(
        { error: 'No slides could be extracted from the file' },
        { status: 400 }
      );
    }

    if (slides.length < 5) {
      log.warn('Deck has fewer than 5 slides', { slideCount: slides.length });
    }

    // Step 2.5: Obtain slide images — extracted from PDF or pre-rendered for PPTX
    let slideImages: SlideImage[] = [];
    if (fileType === 'pdf' && pdfBuffer) {
      try {
        log.info('Extracting slide images for vision analysis', { slideCount: slides.length });
        slideImages = await extractSlideImages(pdfBuffer, slides.length);
        log.info('Slide image extraction complete', {
          successCount: slideImages.filter(img => img.base64.length > 0).length
        });
      } catch (err) {
        log.warn('Image extraction failed, continuing without vision analysis', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    } else if (preGeneratedImages && preGeneratedImages.length > 0) {
      slideImages = preGeneratedImages;
      log.info('Using pre-generated PPTX slide thumbnails', { count: slideImages.length });
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

    // Step 3.5: Run vision analysis in parallel (non-blocking)
    let visionResults: VisualSlideContext[] = [];
    if (fileType === 'pdf' && slideImages.length > 0) {
      log.info('Starting vision analysis', { slideCount: slides.length });
      const visionPromises = slides.map((slide, i) =>
        analyzeSlideVisually(
          slideImages[i]?.base64 ?? '',
          slide.bodyText,
          slide.estimatedSlideType,
          slide.slideNumber
        )
      );
      
      const visionSettled = await Promise.allSettled(visionPromises);
      visionResults = visionSettled.map(result =>
        result.status === 'fulfilled' ? result.value : {
          hasCharts: false,
          hasImages: false,
          hasTables: false,
          chartData: '',
          imageDescriptions: '',
          tableData: '',
          layoutDescription: '',
          rawVisualText: '',
        }
      );
      
      log.info('Vision analysis complete', {
        slideCount: slides.length,
        chartsDetected: visionResults.filter(v => v.hasCharts).length,
        imagesDetected: visionResults.filter(v => v.hasImages).length,
        tablesDetected: visionResults.filter(v => v.hasTables).length,
      });
    }

    // Build temporary slide analysis objects with NLU data and vision context
    const slidesWithNLU = slides.map((slide, index) => ({
      slideNumber: slide.slideNumber,
      slideType: slide.estimatedSlideType,
      rawText: slide.bodyText,
      nluResult: nluResults[index],
      visualContext: visionResults[index] || slide.visualContext || null,
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
          deckContentSummary,
          slide.visualContext  // Pass visual context to prompt builder
        );
        
        const result = await callGraniteJSONWithRateLimit(prompt) as RubricScores;
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

      // Attach slide image if available (from slideImages array)
      const slideImage = slideImages[index];
      const hasImage = slideImage && slideImage.base64.length > 0;

      return {
        slideNumber: slide.slideNumber,
        slideType: slide.slideType,
        rawText: slide.rawText,
        nluResult: slide.nluResult,
        graniteScores,
        slideHealthScore,
        usedOcr: slides[index].usedOcr, // Propagate OCR flag from parsed slide
        visualContext: slide.visualContext, // Propagate visual context
        image: hasImage ? slideImage.base64 : undefined, // Attach base64 image
        imageMime: hasImage ? (slideImage.mimeType ?? 'image/jpeg') : undefined, // Attach MIME type
      };
    });

    // Step 7: Aggregate rubric scores across all slides
    log.info('Aggregating rubric scores');
    const aggregatedRubricScores = aggregateRubricScores(perSlideAnalysis);
    
    // Calculate overall score from aggregated rubric
    const overallScore = calculateOverallScore(aggregatedRubricScores);
    const verdict = generateVerdict(overallScore);

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
      deckDesign: deckDesignMetadata,
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
    log.error('Analysis error', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Failed to analyze deck', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateVerdict(overallScore: number): string {
  if (overallScore >= 80) return 'Strong deck with a compelling narrative and solid fundamentals.';
  if (overallScore >= 65) return 'Good foundation, but key areas need strengthening before investor meetings.';
  if (overallScore >= 50) return 'Potential is visible, but significant gaps exist in your investor story.';
  return 'Major gaps detected — focus on fundamentals before approaching investors.';
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

// Made with Bob
