/**
 * API Route: /api/tasks/[id]/run
 * Triggers a remote runner to execute this task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, createEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tasks/[id]/run
 * Trigger remote runner for this task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  console.log(`[Runner] POST /api/tasks/${taskId}/run`);

  try {
    // Load task
    const task = await getTaskById(taskId);

    if (!task) {
      console.log(`[Runner] Task not found: ${taskId}`);
      return NextResponse.json(
        { ok: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`[Runner] Found task: "${task.title}" (status: ${task.status})`);

    // Check for RUNNER_BASE_URL
    const runnerBaseUrl = process.env.RUNNER_BASE_URL;

    if (!runnerBaseUrl) {
      console.error('[Runner] ⚠️  RUNNER_BASE_URL is not configured!');
      console.error('[Runner] Set RUNNER_BASE_URL environment variable to enable remote execution');
      return NextResponse.json(
        {
          ok: false,
          error: 'Runner is not configured. Set RUNNER_BASE_URL environment variable.'
        },
        { status: 500 }
      );
    }

    console.log(`[Runner] Using RUNNER_BASE_URL: ${runnerBaseUrl}`);

    // Build payload for remote runner
    const runnerPayload = {
      taskId: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      payload: task.payload,
      createdAt: task.createdAt,
      metadata: {
        tags: task.tags,
        status: task.status
      }
    };

    console.log('[Runner] Calling remote runner with payload:', JSON.stringify(runnerPayload, null, 2));

    // Update task status to 'running'
    await updateTask(task.id, {
      ...task,
      status: 'running',
      lastRunAt: new Date(),
    });

    // Add event
    await createEvent({
      taskId: task.id,
      eventType: 'task_run_started',
      data: { runnerUrl: runnerBaseUrl }
    });

    // Call remote runner
    let runnerResponse;
    try {
      const runnerUrl = `${runnerBaseUrl}/run-task`;
      console.log(`[Runner] Fetching: ${runnerUrl}`);

      const response = await fetch(runnerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(runnerPayload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log(`[Runner] Response status: ${response.status}`);

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Runner] Remote runner returned error: ${response.status}`);
        console.error(`[Runner] Response body: ${text}`);
        throw new Error(`Runner returned ${response.status}: ${text}`);
      }

      runnerResponse = await response.json();
      console.log('[Runner] Runner response:', JSON.stringify(runnerResponse, null, 2));

      // Update task with runner response
      const finalTask = await updateTask(task.id, {
        ...task,
        runnerStatus: runnerResponse.status || 'completed',
        status: runnerResponse.error ? 'failed' : (runnerResponse.status === 'failed' ? 'failed' : 'completed'),
      });

      // Add success event
      await createEvent({
        taskId: task.id,
        eventType: 'task_run_completed',
        data: {
          runnerStatus: finalTask.runnerStatus,
          taskStatus: finalTask.status
        }
      });

      return NextResponse.json({
        ok: true,
        data: {
          task: finalTask,
          runnerResponse
        }
      });

    } catch (runnerError: any) {
      console.error('[Runner] Error calling remote runner:', runnerError.message);
      console.error(runnerError.stack);

      // Update task to failed
      const failedTask = await updateTask(task.id, {
        ...task,
        status: 'failed',
        runnerStatus: `error: ${runnerError.message}`,
      });

      // Add error event
      await createEvent({
        taskId: task.id,
        eventType: 'task_run_failed',
        data: { error: runnerError.message }
      });

      return NextResponse.json({
        ok: false,
        error: `Runner execution failed: ${runnerError.message}`,
        data: { task: failedTask }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`[Runner] Unexpected error for ${taskId}:`, error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

