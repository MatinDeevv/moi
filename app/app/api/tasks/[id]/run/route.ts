/**
 * API Route: /api/tasks/[id]/run
 * Triggers a remote runner to execute this task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, createEvent, getSettings } from '@/lib/db';

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
  console.log(`[API/run-task] POST /api/tasks/${taskId}/run`);

  try {
    // Load task
    const task = await getTaskById(taskId);

    if (!task) {
      console.log(`[API/run-task] Task not found: ${taskId}`);
      return NextResponse.json(
        { ok: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`[API/run-task] Found task: "${task.title}" (status: ${task.status})`);

    // Load settings and determine runner URL
    const settings = await getSettings();
    const runnerBase = settings.runnerUrl || process.env.RUNNER_BASE_URL;

    if (!runnerBase) {
      console.error('[API/run-task] ⚠️  Runner is not configured!');
      console.error('[API/run-task] Set runner URL in Settings or RUNNER_BASE_URL environment variable');
      return NextResponse.json(
        {
          ok: false,
          error: 'Runner is not configured. Set runner URL in Settings.'
        },
        { status: 500 }
      );
    }

    console.log(`[API/run-task] Using runner URL: ${runnerBase}`);

    // Determine runner token
    const runnerToken = settings.runnerToken || process.env.RUNNER_TOKEN || null;

    // Build payload for remote runner
    const runnerPayload = {
      taskId: task.id,
      title: task.title,
      description: task.description || '',
      type: task.type,
      payload: task.payload,
      createdAt: task.createdAt,
      metadata: {
        tags: task.tags,
        status: task.status
      }
    };

    console.log('[API/run-task] Calling runner with payload:', JSON.stringify(runnerPayload, null, 2));

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
      data: { runnerUrl: runnerBase }
    });

    // Call remote runner
    try {
      const runnerUrl = `${runnerBase}/run-task`;
      console.log(`[API/run-task] Calling runner at ${runnerUrl}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (runnerToken) {
        headers['x-runner-token'] = runnerToken;
        console.log('[API/run-task] Including runner token in request');
      }

      const response = await fetch(runnerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(runnerPayload),
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });

      console.log(`[API/run-task] Runner response status: ${response.status}`);

      // Read raw text first
      const text = await response.text();

      // Try to parse JSON
      let runnerJson;
      try {
        runnerJson = JSON.parse(text);
      } catch (parseError) {
        console.error(`[API/run-task] Runner returned non-JSON: ${text.slice(0, 500)}`);

        // Update task to failed
        await updateTask(task.id, {
          ...task,
          status: 'failed',
          runnerStatus: 'error: runner returned invalid JSON',
        });

        await createEvent({
          taskId: task.id,
          eventType: 'task_run_failed',
          data: { error: 'Runner returned invalid JSON' }
        });

        return NextResponse.json({
          ok: false,
          error: 'Runner returned invalid JSON'
        }, { status: 502 });
      }

      // Check if runner reported an error
      if (!response.ok || runnerJson.ok === false) {
        const errorMsg = runnerJson.error || `Runner failed with status ${response.status}`;
        console.error(`[API/run-task] Runner error:`, errorMsg);
        console.error(`[API/run-task] Runner response:`, runnerJson);

        // Update task to failed
        const failedTask = await updateTask(task.id, {
          ...task,
          status: 'failed',
          runnerStatus: `error: ${errorMsg}`,
        });

        await createEvent({
          taskId: task.id,
          eventType: 'task_run_failed',
          data: { error: errorMsg, runnerResponse: runnerJson }
        });

        return NextResponse.json({
          ok: false,
          error: errorMsg,
          data: { task: failedTask, runner: runnerJson }
        }, { status: 502 });
      }

      // Success - update task with runner response
      const finalStatus = runnerJson.status || 'completed';
      const finalTask = await updateTask(task.id, {
        ...task,
        lastRunAt: runnerJson.finishedAt ? new Date(runnerJson.finishedAt) : new Date(),
        runnerStatus: finalStatus,
        status: finalStatus,
      });

      console.log(`[API/run-task] Runner success for task ${taskId}, status=${finalStatus}`);

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
          runner: runnerJson
        }
      });

    } catch (runnerError: any) {
      console.error('[API/run-task] Error calling remote runner:', runnerError.message);
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
    console.error(`[API/run-task] Unexpected error for ${taskId}:`, error.message);
    console.error(error.stack);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

