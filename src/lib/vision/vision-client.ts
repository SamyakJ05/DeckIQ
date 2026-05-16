/**
 * IBM watsonx.ai Granite Vision Client
 * Analyzes slide images to extract visual context (charts, graphs, tables, images)
 * Uses multimodal vision models to understand visual content beyond text
 */

import axios from 'axios';
import type { VisualSlideContext } from '@/types';
import { log } from '../utils/logger';

const WATSONX_URL = process.env.WATSONX_URL!;
const WATSONX_API_KEY = process.env.WATSONX_API_KEY!;
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID!;

// Vision model — use whichever is available on your watsonx.ai project
// Options: 'meta-llama/llama-3-2-11b-vision-instruct', 'meta-llama/llama-3-2-90b-vision-instruct'
const VISION_MODEL = process.env.VISION_MODEL || 'meta-llama/llama-3-2-11b-vision-instruct';

// Cache IAM token to avoid repeated auth calls
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get IBM Cloud IAM token with caching
 */
async function getIAMToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && cachedToken.expiresAt > now + 300000) {
    return cachedToken.token;
  }

  log.info('Fetching new IAM token for watsonx.ai vision API');
  
  const tokenRes = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: WATSONX_API_KEY,
    }),
    { 
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    }
  );

  const token = tokenRes.data.access_token;
  const expiresIn = tokenRes.data.expires_in || 3600; // Default 1 hour
  
  cachedToken = {
    token,
    expiresAt: now + (expiresIn * 1000),
  };

  return token;
}

/**
 * Analyze a slide image using IBM Granite Vision to extract visual context
 * 
 * @param base64Image - Base64-encoded PNG image of the slide
 * @param slideType - Estimated slide type (helps guide analysis)
 * @param slideNumber - Slide number for logging
 * @returns Visual context extracted from the image
 */
export async function analyzeSlideVisually(
  base64Image: string,
  slideType: string,
  slideNumber: number
): Promise<VisualSlideContext> {
  if (!base64Image) {
    log.warn(`No image provided for slide ${slideNumber}, returning empty visual context`);
    return emptyVisualContext();
  }

  log.info(`Analyzing slide ${slideNumber} visually (type: ${slideType})`);

  try {
    const iamToken = await getIAMToken();
    const prompt = buildVisionPrompt(slideType, slideNumber);

    const response = await axios.post(
      `${WATSONX_URL}/ml/v1/text/chat?version=2024-05-31`,
      {
        model_id: VISION_MODEL,
        project_id: WATSONX_PROJECT_ID,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        parameters: {
          max_new_tokens: 600,
          temperature: 0.1,
          top_p: 0.95,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${iamToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30s timeout for vision analysis
      }
    );

    const raw = response.data.choices?.[0]?.message?.content ?? '';
    
    if (!raw) {
      log.warn(`Empty response from vision API for slide ${slideNumber}`);
      return emptyVisualContext();
    }

    const parsed = parseVisualContext(raw);
    log.info(`Vision analysis complete for slide ${slideNumber}: charts=${parsed.hasCharts}, images=${parsed.hasImages}, tables=${parsed.hasTables}`);
    
    return parsed;
  } catch (error) {
    log.error(`Vision analysis failed for slide ${slideNumber}: ${error instanceof Error ? error.message : String(error)}`);
    return emptyVisualContext();
  }
}

/**
 * Build the vision analysis prompt tailored to slide type
 */
function buildVisionPrompt(slideType: string, slideNumber: number): string {
  return `You are analyzing slide ${slideNumber} of a startup pitch deck. Slide type: ${slideType}.

Examine this slide image carefully and extract ALL visual information. Be specific and precise.

Return your analysis in this exact format:

HAS_CHARTS: [yes/no]
HAS_IMAGES: [yes/no]  
HAS_TABLES: [yes/no]

CHART_DATA:
[If charts exist: describe chart type, extract all visible numbers, labels, axes values, percentages, growth rates, and trends. E.g. "Bar chart: Q1=$48K MRR, Q2=$72K MRR, Q3=$91K MRR showing 89% growth. Y-axis: Revenue in USD. X-axis: Quarters."]
[If no charts: NONE]

IMAGE_DESCRIPTIONS:
[Describe all images, logos, photos, icons visible. E.g. "Company logo top-left. Photo of two founders in office. Partner logos: Salesforce, HubSpot, AWS."]
[If no images: NONE]

TABLE_DATA:
[If tables exist: extract all rows and columns with their values. E.g. "Pricing table: Starter $99/mo (5 users), Growth $299/mo (25 users), Enterprise custom."]
[If no tables: NONE]

LAYOUT_SUMMARY:
[One sentence describing the overall visual structure and key message conveyed visually.]

Be thorough. Extract every number, percentage, and data point visible in charts and tables.`;
}

/**
 * Parse the vision model's structured response into VisualSlideContext
 */
function parseVisualContext(raw: string): VisualSlideContext {
  const get = (key: string): string => {
    const match = raw.match(new RegExp(`${key}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i'));
    return match ? match[1].trim() : '';
  };

  const chartData = get('CHART_DATA');
  const imageDescriptions = get('IMAGE_DESCRIPTIONS');
  const tableData = get('TABLE_DATA');
  const layoutDescription = get('LAYOUT_SUMMARY');

  return {
    hasCharts: /HAS_CHARTS:\s*yes/i.test(raw),
    hasImages: /HAS_IMAGES:\s*yes/i.test(raw),
    hasTables: /HAS_TABLES:\s*yes/i.test(raw),
    chartData: chartData === 'NONE' ? '' : chartData,
    imageDescriptions: imageDescriptions === 'NONE' ? '' : imageDescriptions,
    tableData: tableData === 'NONE' ? '' : tableData,
    layoutDescription,
    rawVisualText: raw,
  };
}

/**
 * Return empty visual context for slides without images or on error
 */
function emptyVisualContext(): VisualSlideContext {
  return {
    hasCharts: false,
    hasImages: false,
    hasTables: false,
    chartData: '',
    imageDescriptions: '',
    tableData: '',
    layoutDescription: '',
    rawVisualText: '',
  };
}

// Made with Bob
