/**
 * API Route: /api/tasks/[id]
 * Handles GET, PATCH, DELETE for individual tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadTasks, saveTasks, addEvent, type Task } from '@/lib/martinDb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  console.log(`[API/tasks] GET /api/tasks/${taskId}`);

  try {
    const tasks = await loadTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      console.log(`[API/tasks] Task not found: ${taskId}`);
      return NextResponse.json(
        { ok: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`[API/tasks] Found task: "${task.title}"`);

    return NextResponse.json({
      ok: true,
      data: { task }
    });

  } catch (error: any) {
    console.error(`[API/tasks] GET error for ${taskId}:`, error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  console.log(`[API/tasks] PATCH /api/tasks/${taskId}`);

  try {
    let body;
    try {
      body = await request.json();
      console.log(`[API/tasks] PATCH body:`, JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[API/tasks] Failed to parse JSON body:', parseError);
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const tasks = await loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      console.log(`[API/tasks] Task not found for update: ${taskId}`);
      return NextResponse.json(
        { ok: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const oldTask = tasks[taskIndex];
    const updatedTask: Task = {
      ...oldTask,
      ...body,
      id: taskId, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    await saveTasks(tasks);

    console.log(`[API/tasks] Updated task: ${taskId} - "${updatedTask.title}"`);
    console.log(`[API/tasks] Status change: ${oldTask.status} -> ${updatedTask.status}`);

    // Add event
    await addEvent({
      taskId: taskId,
      eventType: 'task_updated',
      data: {
        title: updatedTask.title,
        status: updatedTask.status,
        changes: Object.keys(body)
      }
    });

    return NextResponse.json({
      ok: true,
      data: { task: updatedTask }
    });

  } catch (error: any) {
    console.error(`[API/tasks] PATCH error for ${taskId}:`, error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  console.log(`[API/tasks] DELETE /api/tasks/${taskId}`);

  try {
    const tasks = await loadTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      console.log(`[API/tasks] Task not found for deletion: ${taskId}`);
      return NextResponse.json(
        { ok: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    await saveTasks(tasks);

    console.log(`[API/tasks] Deleted task: ${taskId} - "${deletedTask.title}"`);
    console.log(`[API/tasks] Remaining tasks: ${tasks.length}`);

    // Add event
    await addEvent({
      taskId: taskId,
      eventType: 'task_deleted',
      data: { title: deletedTask.title }
    });

    return NextResponse.json({
      ok: true,
      data: { deleted: true, taskId }
    });

  } catch (error: any) {
    console.error(`[API/tasks] DELETE error for ${taskId}:`, error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

