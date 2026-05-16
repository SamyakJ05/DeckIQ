/**
 * POST /api/rewrite
 * Rewrite a single slide based on a critical fix instruction
 * 
 * Request body:
 * {
 *   slideNumber: number,
 *   slideType: SlideType,
 *   originalText: string,
 *   fixInstruction: string,
 *   nluSnapshot?: { sentiment: string, problematicTones: string[] }
 * }
 * 
 * Response:
 * {
 *   rewrittenText: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SlideType } from '@/types';
import { buildRewritePrompt } from '@/lib/ibm/prompts/rewrite-prompt';
import { callGraniteText } from '@/lib/ibm/granite-client';
import { log } from '@/lib/utils/logger';

interface RewriteRequest {
  slideNumber: number;
  slideType: SlideType;
  originalText: string;
  fixInstruction: string;
  nluSnapshot?: {
    sentiment: string;
    problematicTones: string[];
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as RewriteRequest;

    // Validate required fields
    if (!body.slideNumber || !body.slideType || !body.originalText || !body.fixInstruction) {
      return NextResponse.json(
        { error: 'Missing required fields: slideNumber, slideType, originalText, fixInstruction' },
        { status: 400 }
      );
    }

    log.info('Rewrite request received', {
      slideNumber: body.slideNumber,
      slideType: body.slideType,
      originalLength: body.originalText.length,
    });

    // Build the rewrite prompt
    const prompt = buildRewritePrompt(
      body.slideNumber,
      body.slideType,
      body.originalText,
      body.fixInstruction,
      body.nluSnapshot
    );

    // Call Granite to generate rewritten text
    let rewrittenText: string;
    try {
      rewrittenText = await callGraniteText(prompt);
      
      // Clean up any meta-commentary that might have slipped through
      rewrittenText = rewrittenText
        .replace(/^(Here's the rewritten version|Rewritten slide|Here is the|The rewritten).*?:\s*/i, '')
        .trim();
      
      log.info('Rewrite successful', {
        slideNumber: body.slideNumber,
        rewrittenLength: rewrittenText.length,
      });
    } catch (error) {
      log.error('Granite rewrite failed', {
        slideNumber: body.slideNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Return fallback message on Granite failure
      return NextResponse.json(
        {
          error: 'Granite API unavailable',
          message: 'Unable to generate rewrite at this time. Please try again later.',
          fallback: body.originalText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { rewrittenText },
      { status: 200 }
    );
  } catch (error) {
    log.error('Rewrite endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { error: 'Failed to process rewrite request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Made with Bob