/**
 * API Route: /api/events
 * Handles GET (list events)
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadEvents } from '@/lib/martinDb';

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
    const taskId = searchParams.get('task_id');
    const eventType = searchParams.get('event_type');

    console.log('[API/events] Query params:', { limit, taskId, eventType });

    let events = await loadEvents();
    console.log(`[API/events] Loaded ${events.length} events from DB`);

    // Apply filters
    if (taskId) {
      events = events.filter(e => e.taskId === taskId);
    }
    if (eventType) {
      events = events.filter(e => e.eventType === eventType);
    }

    // Sort by newest first and apply limit
    events = events.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);

    console.log(`[API/events] Returning ${events.length} events after filters`);

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

