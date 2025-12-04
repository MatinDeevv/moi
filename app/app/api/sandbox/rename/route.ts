/**
 * API Route: /api/sandbox/rename
 * Renames a file or directory in sandbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sandbox/rename
 * Body: { from: string, to: string }
 */
export async function POST(request: NextRequest) {
  console.log(`[API/sandbox/rename] POST /api/sandbox/rename`);

  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { from, to } = body;

    if (!from || !to) {
      return NextResponse.json(
        { ok: false, error: 'Missing from or to parameter' },
        { status: 400 }
      );
    }

    console.log(`[API/sandbox/rename] from=${from}, to=${to}`);

    const settings = await getSettings();
    const runnerBase = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerBase) {
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    const runnerToken = settings.runnerToken || process.env.RUNNER_TOKEN || null;
    const runnerUrl = `${runnerBase}/sandbox/rename`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'ProjectME/1.0',
    };
    if (runnerToken) {
      headers['x-runner-token'] = runnerToken;
    }

    const response = await fetch(runnerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ from, to }),
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

    console.log(`[API/sandbox/rename] Success: renamed ${from} to ${to}`);

    return NextResponse.json(runnerJson);

  } catch (error: any) {
    console.error('[API/sandbox/rename] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

