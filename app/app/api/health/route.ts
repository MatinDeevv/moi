/**
 * API Route: /api/health
 * Health check and diagnostics endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadTasks, loadEvents } from '@/lib/martinDb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Returns system health and configuration status
 */
export async function GET(request: NextRequest) {
  console.log('[API/health] GET /api/health');

  try {
    const runnerConfigured = !!process.env.RUNNER_BASE_URL;
    const runnerUrl = runnerConfigured ? process.env.RUNNER_BASE_URL : null;

    // Try to load data to verify DB health
    let tasksCount = 0;
    let eventsCount = 0;
    let dbHealthy = true;
    let dbError = null;

    try {
      const tasks = await loadTasks();
      const events = await loadEvents();
      tasksCount = tasks.length;
      eventsCount = events.length;
    } catch (err: any) {
      dbHealthy = false;
      dbError = err.message;
      console.error('[API/health] DB health check failed:', err.message);
    }

    const health = {
      ok: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        healthy: dbHealthy,
        tasksCount,
        eventsCount,
        error: dbError
      },
      runner: {
        configured: runnerConfigured,
        baseUrl: runnerUrl,
        note: runnerConfigured
          ? 'Runner is configured and ready'
          : 'Set RUNNER_BASE_URL env variable to enable remote execution'
      },
      api: {
        routes: [
          'GET /api/health',
          'GET /api/tasks',
          'POST /api/tasks',
          'GET /api/tasks/[id]',
          'PATCH /api/tasks/[id]',
          'DELETE /api/tasks/[id]',
          'POST /api/tasks/[id]/run',
          'GET /api/events'
        ]
      }
    };

    console.log('[API/health] Health check:', JSON.stringify(health, null, 2));

    return NextResponse.json(health);

  } catch (error: any) {
    console.error('[API/health] Error:', error.message);
    console.error(error.stack);

    return NextResponse.json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

