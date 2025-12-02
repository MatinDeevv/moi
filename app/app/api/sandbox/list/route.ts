/**
 * API Route: /api/sandbox/list
 * Lists files and directories in the sandbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sandbox/list?path=relative/path
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  console.log(`[API/sandbox/list] GET /api/sandbox/list?path=${path}`);

  try {
    // Load settings and get runner URL
    const settings = await getSettings();
    const runnerBase = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerBase) {
      console.error('[API/sandbox/list] Runner not configured');
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.', entries: [] },
        { status: 500 }
      );
    }

    // Get runner token
    const runnerToken = settings.runnerToken || process.env.RUNNER_TOKEN || null;

    // Call runner
    const runnerUrl = `${runnerBase}/sandbox/list?path=${encodeURIComponent(path)}`;
    console.log(`[API/sandbox/list] Calling: ${runnerUrl}`);

    const headers: Record<string, string> = {};
    if (runnerToken) {
      headers['x-runner-token'] = runnerToken;
    }

    const response = await fetch(runnerUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();

    let runnerJson;
    try {
      runnerJson = JSON.parse(text);
    } catch (parseError) {
      console.error(`[API/sandbox/list] Runner returned non-JSON: ${text.slice(0, 200)}`);
      return NextResponse.json(
        { ok: false, error: 'Runner returned invalid JSON' },
        { status: 502 }
      );
    }

    if (!response.ok || runnerJson.ok === false) {
      const errorMsg = runnerJson.error || `Runner failed with status ${response.status}`;
      console.error(`[API/sandbox/list] Runner error:`, errorMsg);
      return NextResponse.json(
        { ok: false, error: errorMsg },
        { status: 502 }
      );
    }

    console.log(`[API/sandbox/list] Success: ${runnerJson.entries?.length || 0} entries`);

    return NextResponse.json(runnerJson);

  } catch (error: any) {
    console.error('[API/sandbox/list] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

