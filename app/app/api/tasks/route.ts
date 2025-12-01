/**
 * API Route: /api/tasks
 * Handles GET (list tasks) and POST (create task)
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadTasks, saveTasks, addEvent, type Task } from '@/lib/martinDb';

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
    const status = searchParams.get('status');
    const type = searchParams.get('task_type') || searchParams.get('type');
    const tag = searchParams.get('tag');

    console.log('[API/tasks] Query params:', { limit, status, type, tag });

    let tasks = await loadTasks();
    console.log(`[API/tasks] Loaded ${tasks.length} tasks from DB`);

    // Apply filters
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (type) {
      tasks = tasks.filter(t => t.type === type);
    }
    if (tag && tasks.length > 0) {
      tasks = tasks.filter(t => t.tags?.includes(tag));
    }

    // Apply limit and sort by newest first
    tasks = tasks.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);

    console.log(`[API/tasks] Returning ${tasks.length} tasks after filters`);

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

    const tasks = await loadTasks();
    console.log(`[API/tasks] Current task count: ${tasks.length}`);

    // Create new task
    const now = new Date().toISOString();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: body.title.trim(),
      description: body.description || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      type: body.type || 'general',
      payload: body.payload || {},
      tags: body.tags || [],
    };

    tasks.push(newTask);
    await saveTasks(tasks);

    console.log(`[API/tasks] Created task: ${newTask.id} - "${newTask.title}"`);
    console.log(`[API/tasks] New task count: ${tasks.length}`);

    // Add event
    await addEvent({
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

