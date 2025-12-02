/**
 * API Route: /api/shell/run
 * Executes shell commands on the runner machine
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shell/run
 * Body: { command: string, cwd?: string }
 */
export async function POST(request: NextRequest) {
  console.log(`[API/shell/run] POST /api/shell/run`);

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

    const { command, cwd } = body;

    if (!command) {
      return NextResponse.json(
        { ok: false, error: 'Missing command parameter' },
        { status: 400 }
      );
    }

    console.log(`[API/shell/run] command="${command}", cwd="${cwd || 'default'}"`);

    const settings = await getSettings();
    const runnerBase = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerBase) {
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    const runnerToken = settings.runnerToken || process.env.RUNNER_TOKEN || null;
    const runnerUrl = `${runnerBase}/shell`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (runnerToken) {
      headers['x-runner-token'] = runnerToken;
    }

    const response = await fetch(runnerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ command, cwd }),
      signal: AbortSignal.timeout(30000), // 30 second timeout for commands
    });

    const text = await response.text();

    let runnerJson;
    try {
      runnerJson = JSON.parse(text);
    } catch (parseError) {
      console.error(`[API/shell/run] Runner returned non-JSON: ${text.slice(0, 200)}`);
      return NextResponse.json(
        { ok: false, error: 'Runner returned invalid JSON', output: text },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errorMsg = runnerJson.error || `Runner failed with status ${response.status}`;
      console.error(`[API/shell/run] Runner error:`, errorMsg);
      return NextResponse.json(
        { ok: false, error: errorMsg, output: runnerJson.output || '' },
        { status: 502 }
      );
    }

    console.log(`[API/shell/run] Success: exitCode=${runnerJson.exitCode}`);

    return NextResponse.json(runnerJson);

  } catch (error: any) {
    console.error('[API/shell/run] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Internal server error', output: '' },
      { status: 500 }
    );
  }
}

