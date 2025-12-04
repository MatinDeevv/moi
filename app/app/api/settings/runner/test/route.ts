/**
 * API Route: /api/settings/runner/test
 * Tests connectivity to the configured runner
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/runner/test
 * Tests if the runner is reachable
 */
export async function GET(request: NextRequest) {
  console.log('[API/settings/runner/test] GET /api/settings/runner/test');

  try {
    const settings = await getSettings();

    const runnerUrl = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerUrl) {
      console.log('[API/settings/runner/test] No runner URL configured');
      return NextResponse.json(
        { ok: false, error: 'Runner URL is not configured' },
        { status: 400 }
      );
    }

    console.log(`[API/settings/runner/test] Testing runner at: ${runnerUrl}`);

    // Test runner health endpoint
    try {
      const testUrl = `${runnerUrl}/health`;
      console.log(`[API/settings/runner/test] Calling ${testUrl}`);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ProjectME/1.0',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      console.log(`[API/settings/runner/test] Response status: ${response.status}`);

      if (!response.ok) {
        const text = await response.text();
        console.error(`[API/settings/runner/test] Runner returned error: ${response.status}`);
        return NextResponse.json({
          ok: false,
          error: `Runner returned status ${response.status}: ${text.slice(0, 200)}`
        }, { status: 502 });
      }

      const data = await response.json();
      console.log('[API/settings/runner/test] Runner is reachable');

      return NextResponse.json({
        ok: true,
        data: {
          reachable: true,
          runnerUrl,
          runnerInfo: data
        }
      });

    } catch (fetchError: any) {
      console.error('[API/settings/runner/test] Failed to reach runner:', fetchError.message);
      return NextResponse.json({
        ok: false,
        error: `Failed to reach runner: ${fetchError.message}`
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error('[API/settings/runner/test] Unexpected error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

