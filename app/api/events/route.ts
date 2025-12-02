/**
 * API Route: /api/events
 * Handles GET (list events)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * Query params: limit, task_id, event_type
 */
export async function GET(request: NextRequest) {
  console.log('[API/events] GET /api/events');

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '200');
    const taskId = searchParams.get('task_id') || undefined;
    const eventType = searchParams.get('event_type') || undefined;

    console.log('[API/events] Query params:', { limit, taskId, eventType });

    const events = await getEvents({ taskId, eventType, limit });

    console.log(`[API/events] Returning ${events.length} events`);

    return NextResponse.json({
      ok: true,
      data: {
        events,
        count: events.length
      }
    });

  } catch (error: any) {
    console.error('[API/events] GET error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

