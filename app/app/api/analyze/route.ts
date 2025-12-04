/**
 * API Route: /api/analyze
 * Code analysis - send files to LLM for analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/analyze
 * Send files to LLM for code analysis
 *
 * Body: {
 *   files: string[],      // Array of file paths
 *   prompt: string,       // What to analyze
 *   include_content: boolean  // Include file content (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  console.log('[API/analyze] POST /api/analyze');

  try {
    const body = await request.json();
    const { files, prompt, include_content = true } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Files array is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const settings = await getSettings();
    const runnerUrl = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerUrl) {
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    console.log(`[API/analyze] Analyzing ${files.length} files: ${files.join(', ')}`);

    const response = await fetch(`${runnerUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'ProjectME/1.0',
      },
      body: JSON.stringify({
        files,
        prompt,
        include_content
      }),
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      console.log(`[API/analyze] Analysis complete. Files analyzed: ${data.files_analyzed?.length || 0}`);
      return NextResponse.json(data);
    } catch {
      console.error('[API/analyze] Invalid JSON from runner:', text.slice(0, 200));
      return NextResponse.json(
        { ok: false, error: 'Runner returned invalid JSON' },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('[API/analyze] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

