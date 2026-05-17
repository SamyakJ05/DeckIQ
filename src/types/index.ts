/**
 * DeckIQ Shared TypeScript Interfaces
 * Source of truth for all type definitions across the application.
 * DO NOT duplicate these types elsewhere.
 */

// ============================================================================
// Slide Type Classification
// ============================================================================

export type SlideType =
  | 'Title'
  | 'Problem'
  | 'Solution'
  | 'Market'
  | 'Traction'
  | 'BusinessModel'
  | 'Team'
  | 'Competition'
  | 'Ask'
  | 'Other';

// ============================================================================
// Raw Parsed Slide Content
// ============================================================================

export interface SlideContent {
  slideNumber: number;
  title?: string;
  bodyText: string;
  estimatedSlideType: SlideType;
  usedOcr?: boolean; // True if OCR was used to extract text from image-only page
  visualContext?: VisualSlideContext; // Visual analysis from Granite Vision
}

// ============================================================================
// Vision Analysis Types
// ============================================================================

export interface VisualSlideContext {
  hasCharts: boolean;
  hasImages: boolean;
  hasTables: boolean;
  chartData: string;       // Extracted values/labels from charts
  imageDescriptions: string; // What images/logos are visible
  tableData: string;       // Extracted table content
  layoutDescription: string; // Overall slide layout summary
  rawVisualText: string;   // Full vision model output
  // Design quality assessment fields
  designScore?: number;           // 1-10 overall design quality
  densityRating?: 'clean' | 'moderate' | 'cluttered';
  hasVisualHierarchy?: boolean;   // clear focal point / headline
  colorDiscipline?: 'consistent' | 'varied' | 'chaotic';
  whitespaceQuality?: 'generous' | 'tight' | 'cramped';
  typographyNotes?: string;       // e.g. "too many font sizes", "good hierarchy"
  designFeedback?: string;        // 1-2 sentence actionable design note
}

export interface SlideImage {
  slideNumber: number;
  base64: string;       // base64-encoded image (PNG or JPEG)
  width: number;
  height: number;
  mimeType?: string;    // MIME type (e.g., 'image/jpeg', 'image/png')
}

// ============================================================================
// Watson NLU Types
// ============================================================================

export interface Sentiment {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}

export interface EmotionScores {
  joy: number;
  fear: number;
  anger: number;
  disgust: number;
  sadness: number;
}

export interface ToneFlag {
  label: 'excited' | 'frustrated' | 'polite' | 'impolite' | 'sad' | 'satisfied' | 'sympathetic';
  score: number;
}

export interface Keyword {
  text: string;
  relevance: number;
  sentiment?: Sentiment;
  emotion?: EmotionScores;
}

export interface Entity {
  text: string;
  type: string;
  relevance: number;
  sentiment?: Sentiment;
  emotion?: EmotionScores;
}

export interface Category {
  label: string;
  score: number;
}

export interface NLUResult {
  sentiment: Sentiment;
  tone: ToneFlag[];
  keywords: Keyword[];
  entities: Entity[];
  categories: Category[];
  emotion: EmotionScores;
}

// ============================================================================
// Granite Rubric Scoring Types
// ============================================================================

export interface RubricDimensionScore {
  score: number;
  rationale: string;
}

export interface RubricScores {
  problemClarity: RubricDimensionScore;
  solutionFit: RubricDimensionScore;
  marketSize: RubricDimensionScore;
  tractionEvidence: RubricDimensionScore;
  businessModel: RubricDimensionScore;
  competitiveMoat: RubricDimensionScore;
  teamStrength: RubricDimensionScore;
  askClarity: RubricDimensionScore;
  narrativeFlow: RubricDimensionScore;
  investorReadiness: RubricDimensionScore;
}

// ============================================================================
// Per-Slide Analysis
// ============================================================================

export interface SlideAnalysis {
  slideNumber: number;
  slideType: SlideType;
  rawText: string;
  nluResult: NLUResult;
  graniteScores: RubricScores;
  slideHealthScore: number;
  usedOcr?: boolean; // True if OCR was used to extract text from image-only page
  visualContext?: VisualSlideContext; // Visual analysis from Granite Vision
  image?: string;    // base64-encoded slide image (no data: prefix)
  imageMime?: string; // MIME type for the image (defaults to 'image/jpeg')
}

// ============================================================================
// Critical Fixes
// ============================================================================

export interface CriticalFix {
  rank: number;
  dimension: string;
  fix: string;
  estimatedScoreImpact: number;
  slideToFix: number;
}

// ============================================================================
// Emotional Journey
// ============================================================================

export interface EmotionalJourneyPoint {
  slideIndex: number;
  sentiment: number;
  intensity: number;
  toneFlags?: string[];
}

// ============================================================================
// Contextual Memory Types
// ============================================================================

export interface DeckMapEntry {
  slideNumber: number;
  slideType: SlideType;
  keyEntities: string[];
  topKeyword: string | null;
  sentiment: string | null;
}

export type DeckMap = string;

// ============================================================================
// Full Deck Analysis Result (API Response)
// ============================================================================

export interface DeckAnalysisResult {
  overallScore: number;
  verdict: string;
  rubricBreakdown: RubricScores;
  perSlideAnalysis: SlideAnalysis[];
  criticalFixes: CriticalFix[];
  investorSummary: string;
  emotionalJourney: EmotionalJourneyPoint[];
  deckDesign?: {
    fontConsistencyScore: number;
    colorConsistencyScore: number;
    globalFonts: string[];
    globalColors: string[];
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface AppError extends Error {
  code: string;
  statusCode?: number;
}

// Made with Bob
