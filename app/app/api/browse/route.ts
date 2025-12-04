/**
 * API Route: /api/browse
 * System file browser - proxies to runner /browse endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/browse?path=...&recursive=...&pattern=...
 * Browse any directory on the runner's system
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path') || '';
  const recursive = searchParams.get('recursive') === 'true';
  const pattern = searchParams.get('pattern') || '';

  console.log(`[API/browse] GET /api/browse path=${path} recursive=${recursive} pattern=${pattern}`);

  try {
    const settings = await getSettings();
    const runnerUrl = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerUrl) {
      console.log('[API/browse] Runner URL not configured');
      return NextResponse.json(
        { ok: false, error: 'Runner URL not configured. Set it in Settings.' },
        { status: 500 }
      );
    }

    // Build query string
    const params = new URLSearchParams();
    if (path) params.set('path', path);
    if (recursive) params.set('recursive', 'true');
    if (pattern) params.set('pattern', pattern);

    const url = `${runnerUrl}/browse?${params.toString()}`;
    console.log(`[API/browse] Calling ${url}`);

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
      console.error('[API/browse] Invalid JSON from runner:', text.slice(0, 200));
      return NextResponse.json(
        { ok: false, error: 'Runner returned invalid JSON' },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('[API/browse] Error:', error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

