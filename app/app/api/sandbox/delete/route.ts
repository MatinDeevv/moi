/**
 * API Route: /api/sandbox/delete
 * Deletes a file or directory in sandbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sandbox/delete
 * Body: { path: string }
 */
export async function POST(request: NextRequest) {
  console.log(`[API/sandbox/delete] POST /api/sandbox/delete`);

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

    const { path } = body;

    if (!path) {
      return NextResponse.json(
        { ok: false, error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    console.log(`[API/sandbox/delete] path=${path}`);

    const settings = await getSettings();
    const runnerBase = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerBase) {
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    const runnerToken = settings.runnerToken || process.env.RUNNER_TOKEN || null;
    const runnerUrl = `${runnerBase}/sandbox/delete`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (runnerToken) {
      headers['x-runner-token'] = runnerToken;
    }

    const response = await fetch(runnerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ path }),
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

    console.log(`[API/sandbox/delete] Success: deleted ${path}`);

    return NextResponse.json(runnerJson);

  } catch (error: any) {
    console.error('[API/sandbox/delete] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

