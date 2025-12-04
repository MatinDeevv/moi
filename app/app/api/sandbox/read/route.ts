/**
 * API Route: /api/sandbox/read
 * Reads file content from sandbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sandbox/read?path=relative/path/to/file
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  console.log(`[API/sandbox/read] GET /api/sandbox/read?path=${path}`);

  try {
    const settings = await getSettings();
    const runnerBase = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerBase) {
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    const runnerToken = settings.runnerToken || process.env.RUNNER_TOKEN || null;
    const runnerUrl = `${runnerBase}/sandbox/read?path=${encodeURIComponent(path)}`;

    const headers: Record<string, string> = {
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'ProjectME/1.0',
    };
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
      return NextResponse.json(
        { ok: false, error: 'Runner returned invalid JSON' },
        { status: 502 }
      );
    }

    if (!response.ok || runnerJson.ok === false) {
      const errorMsg = runnerJson.error || `Runner failed with status ${response.status}`;
      return NextResponse.json(
        { ok: false, error: errorMsg },
        { status: 502 }
      );
    }

    console.log(`[API/sandbox/read] Success: read ${path}, length=${runnerJson.content?.length || 0}`);

    return NextResponse.json(runnerJson);

  } catch (error: any) {
    console.error('[API/sandbox/read] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

