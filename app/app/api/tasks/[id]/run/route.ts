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
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'ProjectME/1.0',
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

        // Detect if it's HTML (ngrok error page)
        const isHtml = text.trim().toLowerCase().startsWith('<!doctype html') ||
                       text.trim().toLowerCase().startsWith('<html');

        let errorMessage = 'Runner returned invalid JSON';
        if (isHtml) {
          errorMessage = 'Runner URL returned HTML page instead of API response. This usually means:\n' +
                        '• ngrok tunnel expired (restart ngrok and update Settings)\n' +
                        '• Runner is not running (start with: python runner.py)\n' +
                        '• Wrong URL in Settings (should be https://YOUR-ID.ngrok.io)';
        }

        // Update task to failed with the raw text as output
        await updateTask(task.id, {
          ...task,
          status: 'failed',
          runnerStatus: 'failed',
          errorMessage,
          outputText: null,
          outputRaw: text.length > 5000 ? { truncated: text.slice(0, 5000) } : { raw: text },
        });

        await createEvent({
          taskId: task.id,
          eventType: 'task_run_failed',
          data: { error: errorMessage }
        });

        return NextResponse.json({
          ok: false,
          error: errorMessage
        }, { status: 502 });
      }

      // Check if runner reported an error
      if (!response.ok || runnerJson.ok === false) {
        const errorMsg = runnerJson.error || `Runner failed with status ${response.status}`;
        console.error(`[API/run-task] Runner error:`, errorMsg);
        console.error(`[API/run-task] Runner response:`, runnerJson);

        // Update task to failed with error details
        const failedTask = await updateTask(task.id, {
          ...task,
          status: 'failed',
          runnerStatus: 'failed',
          errorMessage: errorMsg,
          outputText: null,
          outputRaw: runnerJson,
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

      // Success - extract LLM output from runner response
      const finalStatus = runnerJson.status || 'completed';

      // Extract LLM output text from various possible locations
      let outputText: string | null = null;

      // Try multiple common patterns for LLM output
      if (runnerJson.raw?.choices?.[0]?.message?.content) {
        // LM Studio /v1/chat/completions format
        outputText = runnerJson.raw.choices[0].message.content;
      } else if (runnerJson.output) {
        // Simple output field
        outputText = typeof runnerJson.output === 'string'
          ? runnerJson.output
          : JSON.stringify(runnerJson.output, null, 2);
      } else if (runnerJson.content) {
        // Alternative content field
        outputText = runnerJson.content;
      } else if (runnerJson.message) {
        // Message field
        outputText = runnerJson.message;
      } else if (runnerJson.result) {
        // Result field
        outputText = typeof runnerJson.result === 'string'
          ? runnerJson.result
          : JSON.stringify(runnerJson.result, null, 2);
      }

      console.log(`[API/run-task] Extracted outputText length=${outputText?.length || 0}`);

      const finalTask = await updateTask(task.id, {
        ...task,
        lastRunAt: runnerJson.finishedAt ? new Date(runnerJson.finishedAt) : new Date(),
        runnerStatus: finalStatus,
        status: finalStatus,
        outputText: outputText,
        outputRaw: runnerJson,
        errorMessage: null, // Clear any previous errors
      });

      console.log(`[API/run-task] Runner success for task ${taskId}, status=${finalStatus}`);

      // Add success event
      await createEvent({
        taskId: task.id,
        eventType: 'task_run_completed',
        data: {
          runnerStatus: finalTask.runnerStatus,
          taskStatus: finalTask.status,
          hasOutput: !!outputText
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

      // Update task to failed with error details
      const failedTask = await updateTask(task.id, {
        ...task,
        status: 'failed',
        runnerStatus: 'failed',
        errorMessage: `Runner execution failed: ${runnerError.message}`,
        outputText: null,
        outputRaw: null,
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

