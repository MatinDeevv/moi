/**
 * API Route: /api/browse/read
 * Read any file from runner's system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/browse/read?path=...
 * Read a file from anywhere on the runner's system
 */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '';

  console.log(`[API/browse/read] GET /api/browse/read path=${path}`);

  if (!path) {
    return NextResponse.json(
      { ok: false, error: 'Path is required' },
      { status: 400 }
    );
  }

  try {
    const settings = await getSettings();
    const runnerUrl = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerUrl) {
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    const url = `${runnerUrl}/browse/read?path=${encodeURIComponent(path)}`;
    console.log(`[API/browse/read] Calling ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'ProjectME/1.0',
      },
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      console.error('[API/browse/read] Invalid JSON from runner:', text.slice(0, 200));
      return NextResponse.json(
        { ok: false, error: 'Runner returned invalid JSON' },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('[API/browse/read] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

