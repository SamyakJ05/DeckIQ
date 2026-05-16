/**
 * IBM watsonx.ai Granite Client
 * Handles JSON generation from Granite models with retry logic
 */

import { log } from '@/lib/utils/logger';
import type { RubricScores, CriticalFix, DeckMap } from '@/types';
import { buildCriticalFixesPrompt } from './prompts/fixes-prompt';
import { buildInvestorSummaryPrompt } from './prompts/investor-prompt';

const WATSONX_API_KEY = process.env.WATSONX_API_KEY;
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const WATSONX_URL = process.env.WATSONX_URL;
const PRIMARY_MODEL = 'ibm/granite-3-8b-instruct';
const FALLBACK_MODEL = process.env.GRANITE_FALLBACK_MODEL || 'ibm/granite-3-8b-instruct';

const MAX_JSON_RETRIES = 3;
const GENERATION_TIMEOUT_MS = 30000; // 30 seconds

// IAM token cache — IBM Cloud tokens expire in 1 hour, refresh 5 min early
let iamTokenCache: { token: string; expiresAt: number } | null = null;

async function getIAMToken(): Promise<string> {
  const now = Date.now();
  if (iamTokenCache && now < iamTokenCache.expiresAt) {
    return iamTokenCache.token;
  }

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: WATSONX_API_KEY!,
    }),
  });

  if (!response.ok) {
    throw new Error(`IAM token exchange failed: ${response.status}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  iamTokenCache = {
    token: data.access_token,
    // refresh 5 minutes before actual expiry
    expiresAt: now + (data.expires_in - 300) * 1000,
  };
  return iamTokenCache.token;
}

interface GraniteGenerationParams {
  model_id: string;
  input: string;
  parameters: {
    decoding_method: string;
    max_new_tokens: number;
    temperature: number;
    top_p?: number;
    top_k?: number;
  };
  project_id: string;
}

interface GraniteResponse {
  results: Array<{
    generated_text: string;
    generated_token_count: number;
    input_token_count: number;
  }>;
  model_id: string;
  created_at: string;
}

/**
 * Call Granite model and parse JSON response with retry logic
 * @param prompt - The prompt to send to Granite
 * @param useFallback - Whether to use fallback model (internal use)
 * @returns Parsed JSON object
 */
export async function callGraniteJSON(
  prompt: string,
  useFallback: boolean = false
): Promise<any> {
  if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID || !WATSONX_URL) {
    throw new Error('Missing watsonx.ai credentials in environment variables');
  }

  const modelId = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
  
  log.info('Calling Granite model', { 
    model: modelId, 
    promptLength: prompt.length,
    isFallback: useFallback 
  });

  const requestBody: GraniteGenerationParams = {
    model_id: modelId,
    input: prompt,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: 1500,
      temperature: 0.1, // Low temperature for structured JSON output
      top_p: 0.95,
      top_k: 50,
    },
    project_id: WATSONX_PROJECT_ID,
  };

  try {
    const iamToken = await getIAMToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    const response = await fetch(`${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${iamToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Granite API error', {
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });

      // If primary model fails with rate limit or quota, try fallback
      if (!useFallback && (response.status === 429 || response.status === 503)) {
        log.warn('Primary model rate limited, trying fallback model');
        return callGraniteJSON(prompt, true);
      }

      throw new Error(`Granite API error: ${response.status} ${response.statusText}`);
    }

    const data: GraniteResponse = await response.json();
    const generatedText = data.results[0]?.generated_text;

    if (!generatedText) {
      throw new Error('No generated text in Granite response');
    }

    log.info('Granite generation complete', {
      model: modelId,
      inputTokens: data.results[0].input_token_count,
      outputTokens: data.results[0].generated_token_count,
    });

    // Attempt to parse JSON with retry logic
    return await parseJSONWithRetry(generatedText, prompt, useFallback);

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      log.error('Granite request timeout', { model: modelId });
      throw new Error('Granite request timed out after 30 seconds');
    }

    log.error('Granite call failed', { 
      model: modelId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Parse JSON from Granite response with retry logic
 * If parsing fails, retry with stricter prompt up to MAX_JSON_RETRIES times
 */
async function parseJSONWithRetry(
  generatedText: string,
  originalPrompt: string,
  useFallback: boolean,
  attempt: number = 1
): Promise<any> {
  try {
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    let cleaned = generatedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    // Extract first JSON object or array
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const jsonText = jsonMatch ? jsonMatch[0] : cleaned;

    const parsed = JSON.parse(jsonText);
    log.info('JSON parsed successfully', { attempt });
    return parsed;

  } catch (error) {
    log.warn('JSON parse failed', { 
      attempt, 
      error: error instanceof Error ? error.message : 'Unknown error',
      textPreview: generatedText.substring(0, 200)
    });

    if (attempt >= MAX_JSON_RETRIES) {
      log.error('Max JSON retry attempts reached', { attempts: MAX_JSON_RETRIES });
      throw new Error(`Failed to parse valid JSON after ${MAX_JSON_RETRIES} attempts`);
    }

    // Retry with stricter prompt
    const stricterPrompt = `${originalPrompt}

CRITICAL: Your previous response was not valid JSON. Return ONLY valid JSON that exactly matches the schema. Do not include any explanatory text before or after the JSON object.`;

    log.info('Retrying with stricter prompt', { attempt: attempt + 1 });
    
    const modelId = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;
    const requestBody: GraniteGenerationParams = {
      model_id: modelId,
      input: stricterPrompt,
      parameters: {
        decoding_method: 'greedy',
        max_new_tokens: 1500,
        temperature: 0.05, // Even lower temperature for retry
        top_p: 0.9,
        top_k: 30,
      },
      project_id: WATSONX_PROJECT_ID!,
    };

    const iamToken = await getIAMToken();
    const response = await fetch(`${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${iamToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Granite retry failed: ${response.status}`);
    }

    const data: GraniteResponse = await response.json();
    const retryText = data.results[0]?.generated_text;

    if (!retryText) {
      throw new Error('No generated text in retry response');
    }

    // Recursive retry
    return parseJSONWithRetry(retryText, originalPrompt, useFallback, attempt + 1);
  }
}

/**
 * Create a neutral fallback RubricScores object when Granite fails
 */

/**
 * Get top 3 critical fixes from Granite based on aggregated rubric scores
 * @param aggregatedRubricScores - Aggregated rubric scores across all slides
 * @param slideCount - Total number of slides
 * @param overallScore - Overall deck health score (0-100)
 * @returns Array of 3 CriticalFix objects
 */
export async function getTopCriticalFixes(
  aggregatedRubricScores: RubricScores,
  slideCount: number,
  overallScore: number
): Promise<CriticalFix[]> {
  try {
    log.info('Generating critical fixes with Granite');
    
    const prompt = buildCriticalFixesPrompt(
      aggregatedRubricScores,
      slideCount,
      overallScore
    );
    
    const result = await callGraniteJSON(prompt);
    
    // Validate result is an array of 3 fixes
    if (!Array.isArray(result) || result.length !== 3) {
      log.warn('Granite returned invalid fixes array', { 
        isArray: Array.isArray(result), 
        length: Array.isArray(result) ? result.length : 0 
      });
      return createFallbackCriticalFixes(slideCount);
    }
    
    log.info('Critical fixes generated successfully');
    return result as CriticalFix[];
    
  } catch (error) {
    log.error('Failed to generate critical fixes', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createFallbackCriticalFixes(slideCount);
  }
}

/**
 * Get investor perspective summary from Granite
 * @param fullDeckText - Concatenated text from all slides
 * @param deckMap - Linear deck structure map
 * @returns 3-sentence investor perspective summary
 */
export async function getInvestorSummary(
  fullDeckText: string,
  deckMap: DeckMap
): Promise<string> {
  try {
    log.info('Generating investor summary with Granite', {
      deckTextLength: fullDeckText.length,
    });
    
    const prompt = buildInvestorSummaryPrompt(fullDeckText, deckMap);
    
    // For investor summary, we expect plain text, not JSON
    const response = await callGraniteText(prompt);
    
    log.info('Investor summary generated successfully', {
      summaryLength: response.length,
    });
    
    return response;
    
  } catch (error) {
    log.error('Failed to generate investor summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createFallbackInvestorSummary();
  }
}

/**
 * Call Granite for plain text response (not JSON)
 * Used for investor summary and slide rewrites which return prose, not structured data
 */
export async function callGraniteText(prompt: string): Promise<string> {
  if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID || !WATSONX_URL) {
    throw new Error('Missing watsonx.ai credentials in environment variables');
  }

  log.info('Calling Granite for text generation');

  const requestBody: GraniteGenerationParams = {
    model_id: PRIMARY_MODEL,
    input: prompt,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: 500, // Shorter for 3-sentence summary
      temperature: 0.3, // Slightly higher for more natural prose
      top_p: 0.95,
      top_k: 50,
    },
    project_id: WATSONX_PROJECT_ID,
  };

  try {
    const iamToken = await getIAMToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    const response = await fetch(`${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${iamToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Granite API error: ${response.status}`);
    }

    const data: GraniteResponse = await response.json();
    const generatedText = data.results[0]?.generated_text;

    if (!generatedText) {
      throw new Error('No generated text in Granite response');
    }

    // Clean up the text (remove extra whitespace, ensure proper formatting)
    return generatedText.trim();

  } catch (error) {
    log.error('Granite text generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Create fallback critical fixes when Granite fails
 */
function createFallbackCriticalFixes(slideCount: number): CriticalFix[] {
  return [
    {
      rank: 1,
      dimension: 'tractionEvidence',
      fix: 'Add specific revenue numbers or user growth metrics with timeframes',
      estimatedScoreImpact: 10,
      slideToFix: Math.min(slideCount, 5),
    },
    {
      rank: 2,
      dimension: 'marketSize',
      fix: 'Include TAM/SAM/SOM breakdown with data sources',
      estimatedScoreImpact: 7,
      slideToFix: Math.min(slideCount, 4),
    },
    {
      rank: 3,
      dimension: 'askClarity',
      fix: 'Specify exact funding amount and use of funds breakdown',
      estimatedScoreImpact: 5,
      slideToFix: slideCount,
    },
  ];
}

/**
 * Create fallback investor summary when Granite fails
 */
function createFallbackInvestorSummary(): string {
  return 'The deck presents an interesting opportunity, but I need more information to make an investment decision. Specifically, I need to see concrete traction metrics and a clearer path to revenue. The team background and competitive positioning also require more detail before I can assess execution risk.';
}
export function createNeutralRubricScores(reason: string): any {
  return {
    problemClarity: { score: 5, rationale: `Unable to score: ${reason}` },
    solutionFit: { score: 5, rationale: `Unable to score: ${reason}` },
    marketSize: { score: 5, rationale: `Unable to score: ${reason}` },
    tractionEvidence: { score: 5, rationale: `Unable to score: ${reason}` },
    businessModel: { score: 5, rationale: `Unable to score: ${reason}` },
    competitiveMoat: { score: 5, rationale: `Unable to score: ${reason}` },
    teamStrength: { score: 5, rationale: `Unable to score: ${reason}` },
    askClarity: { score: 5, rationale: `Unable to score: ${reason}` },
    narrativeFlow: { score: 5, rationale: `Unable to score: ${reason}` },
    investorReadiness: { score: 5, rationale: `Unable to score: ${reason}` },
  };
}

// Made with Bob
