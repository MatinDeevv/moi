/**
 * API Route: /api/tasks
 * Handles GET (list tasks) and POST (create task)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, createEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks
 * Query params: limit, status, type, tag
 */
export async function GET(request: NextRequest) {
  console.log('[API/tasks] GET /api/tasks');

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('task_type') || searchParams.get('type') || undefined;
    const tag = searchParams.get('tag') || undefined;

    console.log('[API/tasks] Query params:', { limit, status, type, tag });

    const tasks = await getTasks({ status, type, tag, limit });

    console.log(`[API/tasks] Returning ${tasks.length} tasks`);

    return NextResponse.json({
      ok: true,
      data: {
        tasks,
        count: tasks.length
      }
    });

  } catch (error: any) {
    console.error('[API/tasks] GET error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  console.log('[API/tasks] POST /api/tasks');

  try {
    let body;
    try {
      body = await request.json();
      console.log('[API/tasks] Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[API/tasks] Failed to parse JSON body:', parseError);
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      console.error('[API/tasks] Missing required field: title');
      return NextResponse.json(
        { ok: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create new task
    const newTask = await createTask({
      title: body.title.trim(),
      description: body.description || undefined,
      type: body.type || 'general',
      payload: body.payload || {},
      tags: body.tags || [],
    });

    console.log(`[API/tasks] Created task: ${newTask.id} - "${newTask.title}"`);

    // Add event
    await createEvent({
      taskId: newTask.id,
      eventType: 'task_created',
      data: { title: newTask.title, status: newTask.status }
    });

    return NextResponse.json({
      ok: true,
      data: { task: newTask }
    });

  } catch (error: any) {
    console.error('[API/tasks] POST error:', error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

