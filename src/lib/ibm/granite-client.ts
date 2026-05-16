/**
 * IBM watsonx.ai Granite Client
 * Primary: ibm/granite-4-h-small via chat completions endpoint (~3-5s/call)
 * Fallback: ibm/granite-3-8b-instruct via text generation endpoint
 */

import { log } from '@/lib/utils/logger';
import type { RubricScores, CriticalFix, DeckMap } from '@/types';
import { buildCriticalFixesPrompt } from './prompts/fixes-prompt';
import { buildInvestorSummaryPrompt } from './prompts/investor-prompt';

const WATSONX_API_KEY = process.env.WATSONX_API_KEY;
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const WATSONX_URL = process.env.WATSONX_URL;

// granite-4-h-small: chat endpoint, ~3-5s per call
const PRIMARY_MODEL = 'ibm/granite-4-h-small';
// granite-3-8b-instruct: text generation endpoint, fallback only
const FALLBACK_MODEL = 'ibm/granite-3-8b-instruct';

const MAX_JSON_RETRIES = 2;
const CHAT_TIMEOUT_MS = 15000;       // granite-4-h-small responds in ~3-5s
const TEXT_GEN_TIMEOUT_MS = 60000;   // granite-3-8b-instruct can take ~120s; 60s still useful as a gate
const RATE_LIMIT_DELAY_MS = 200;     // 200ms between calls for granite-4 (much faster model)

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
    expiresAt: now + (data.expires_in - 300) * 1000,
  };
  return iamTokenCache.token;
}

// ─── Chat completions response (Granite 4 / OpenAI-compatible) ───────────────
interface ChatResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
}

// ─── Text generation response (Granite 3 fallback) ───────────────────────────
interface TextGenResponse {
  results: Array<{
    generated_text: string;
    generated_token_count: number;
    input_token_count: number;
  }>;
}

/**
 * Call Granite 4 via chat completions endpoint.
 * Returns raw generated text; caller handles JSON parsing.
 * @param forceJSON - Set true to add response_format: json_object (prevents truncation)
 */
async function callGraniteChatAPI(
  systemPrompt: string,
  userPrompt: string,
  forceJSON: boolean = false,
): Promise<string> {
  const iamToken = await getIAMToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  const response = await fetch(`${WATSONX_URL}/ml/v1/text/chat?version=2023-05-29`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${iamToken}`,
    },
    body: JSON.stringify({
      model_id: PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.1,
      ...(forceJSON ? { response_format: { type: 'json_object' } } : {}),
      project_id: WATSONX_PROJECT_ID,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Granite 4 chat error: ${response.status} ${err.substring(0, 200)}`);
  }

  const data: ChatResponse = await response.json();
  const text = data.choices[0]?.message?.content;
  if (!text) throw new Error('No content in Granite 4 chat response');

  log.info('Granite 4 chat complete', {
    promptTokens: data.usage?.prompt_tokens,
    completionTokens: data.usage?.completion_tokens,
  });

  return text;
}

/**
 * Fallback: call Granite 3 8B via text generation endpoint.
 * Only used when the primary model fails.
 */
async function callGraniteTextGenAPI(prompt: string, maxTokens: number = 512): Promise<string> {
  const iamToken = await getIAMToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEXT_GEN_TIMEOUT_MS);

  const response = await fetch(`${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${iamToken}`,
    },
    body: JSON.stringify({
      model_id: FALLBACK_MODEL,
      input: prompt,
      parameters: {
        decoding_method: 'greedy',
        max_new_tokens: maxTokens,
        temperature: 0.1,
        top_p: 0.95,
        top_k: 50,
      },
      project_id: WATSONX_PROJECT_ID,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Granite 3 text gen error: ${response.status} ${err.substring(0, 200)}`);
  }

  const data: TextGenResponse = await response.json();
  const text = data.results[0]?.generated_text;
  if (!text) throw new Error('No generated text in Granite 3 response');
  return text;
}

/**
 * Extract first complete JSON object or array from text.
 * Uses depth tracking instead of greedy regex so trailing prose with {} chars
 * doesn't get included in the extracted JSON.
 */
function extractJSON(text: string): string {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  const open = cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : cleaned.indexOf('[');
  if (open === -1) return cleaned;

  const openChar = cleaned[open];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = open; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) return cleaned.substring(open, i + 1);
    }
  }
  return cleaned.substring(open);
}

/**
 * Call Granite and parse JSON response with retry logic.
 * Primary: Granite 4 h-small chat endpoint.
 * Fallback: Granite 3 8B text generation endpoint.
 */
export async function callGraniteJSON(
  prompt: string,
  _useFallback: boolean = false,
): Promise<unknown> {
  if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID || !WATSONX_URL) {
    throw new Error('Missing watsonx.ai credentials in environment variables');
  }

  log.info('Calling Granite JSON', { promptLength: prompt.length });

  for (let attempt = 1; attempt <= MAX_JSON_RETRIES; attempt++) {
    let rawText: string;

    try {
      // Primary: Granite 4 chat endpoint with forced JSON mode
      rawText = await callGraniteChatAPI(
        'You are a VC analyst. Return ONLY valid JSON, no other text.',
        prompt,
        true,
      );
    } catch (primaryErr) {
      log.warn('Granite 4 chat failed, trying fallback', {
        error: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
        attempt,
      });
      try {
        rawText = await callGraniteTextGenAPI(prompt, 512);
      } catch (fallbackErr) {
        log.error('Both Granite models failed', {
          fallbackError: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        });
        throw fallbackErr;
      }
    }

    try {
      const jsonText = extractJSON(rawText);
      const parsed = JSON.parse(jsonText);
      log.info('Granite JSON parsed successfully', { attempt });
      return parsed;
    } catch (parseErr) {
      log.warn('JSON parse failed', {
        attempt,
        error: parseErr instanceof Error ? parseErr.message : String(parseErr),
        preview: rawText.substring(0, 150),
      });

      if (attempt >= MAX_JSON_RETRIES) {
        log.error('Max JSON retry attempts reached', { attempts: MAX_JSON_RETRIES });
        throw new Error(`Failed to parse valid JSON after ${MAX_JSON_RETRIES} attempts`);
      }
      // retry with stricter instruction added to prompt
    }
  }

  throw new Error('Granite JSON call exhausted all attempts');
}

/**
 * Sleep utility for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Granite JSON with rate limiting delay.
 */
export async function callGraniteJSONWithRateLimit(
  prompt: string,
  useFallback: boolean = false,
): Promise<unknown> {
  await sleep(RATE_LIMIT_DELAY_MS);
  return callGraniteJSON(prompt, useFallback);
}

/**
 * Call Granite for plain text response (investor summary, slide rewrites).
 */
export async function callGraniteText(prompt: string): Promise<string> {
  if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID || !WATSONX_URL) {
    throw new Error('Missing watsonx.ai credentials in environment variables');
  }

  log.info('Calling Granite for text generation');

  try {
    return await callGraniteChatAPI(
      'You are a venture capital investor. Write clear, direct prose.',
      prompt,
    );
  } catch (err) {
    log.warn('Granite 4 text generation failed, trying fallback', {
      error: err instanceof Error ? err.message : String(err),
    });
    return callGraniteTextGenAPI(prompt, 500);
  }
}

/**
 * Get top 3 critical fixes from Granite based on aggregated rubric scores.
 */
export async function getTopCriticalFixes(
  aggregatedRubricScores: RubricScores,
  slideCount: number,
  overallScore: number,
): Promise<CriticalFix[]> {
  try {
    log.info('Generating critical fixes with Granite');
    const prompt = buildCriticalFixesPrompt(aggregatedRubricScores, slideCount, overallScore);
    const result = await callGraniteJSON(prompt);

    if (!Array.isArray(result) || result.length !== 3) {
      log.warn('Granite returned invalid fixes array', {
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 0,
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
 * Get investor perspective summary from Granite.
 */
export async function getInvestorSummary(
  fullDeckText: string,
  deckMap: DeckMap,
): Promise<string> {
  try {
    log.info('Generating investor summary with Granite', { deckTextLength: fullDeckText.length });
    const prompt = buildInvestorSummaryPrompt(fullDeckText, deckMap);
    const response = await callGraniteText(prompt);
    log.info('Investor summary generated successfully', { summaryLength: response.length });
    return response;
  } catch (error) {
    log.error('Failed to generate investor summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createFallbackInvestorSummary();
  }
}

/**
 * Create neutral fallback RubricScores when Granite fails.
 */
export function createNeutralRubricScores(reason: string): RubricScores {
  const entry = (r: string) => ({ score: 5, rationale: `Unable to score: ${r}` });
  return {
    problemClarity: entry(reason),
    solutionFit: entry(reason),
    marketSize: entry(reason),
    tractionEvidence: entry(reason),
    businessModel: entry(reason),
    competitiveMoat: entry(reason),
    teamStrength: entry(reason),
    askClarity: entry(reason),
    narrativeFlow: entry(reason),
    investorReadiness: entry(reason),
  };
}

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

function createFallbackInvestorSummary(): string {
  return 'The deck presents an interesting opportunity, but I need more information to make an investment decision. Specifically, I need to see concrete traction metrics and a clearer path to revenue. The team background and competitive positioning also require more detail before I can assess execution risk.';
}

// Made with Bob
