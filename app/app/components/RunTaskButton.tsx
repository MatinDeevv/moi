'use client';

import { useState } from 'react';
import { getTasks, runTask } from '@/lib/api';

interface RunTaskButtonProps {
  onTaskRun?: () => void;
}

export default function RunTaskButton({ onTaskRun }: RunTaskButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const handleRunTask = async () => {
    setLoading(true);
    setResult(null);
    setShowResult(false);

    try {
      console.log('[RunTaskButton] Finding next pending task...');

      // Get first pending task
      const tasksResponse = await getTasks({ status: 'pending', limit: 1 });

      if (!tasksResponse.tasks || tasksResponse.tasks.length === 0) {
        setResult({
          success: false,
          error: 'No pending tasks found'
        });
        setShowResult(true);
        return;
      }

      const task = tasksResponse.tasks[0];
      console.log(`[RunTaskButton] Running task: ${task.id}`);

      // Run the task
      const response = await runTask(task.id);
      console.log('[RunTaskButton] Task run result:', response);

      setResult({
        success: true,
        task: response.task,
        runnerResponse: response.runnerResponse
      });
      setShowResult(true);

      // Notify parent to refresh
      onTaskRun?.();

    } catch (err) {
      console.error('[RunTaskButton] Error:', err);
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to run task'
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ⚡ Quick Action: Run Next Pending Task
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Execute the next task in the pending queue
            </p>
          </div>
          <button
            onClick={handleRunTask}
            disabled={loading}
            className={`
              px-6 py-3 rounded-lg font-medium text-white transition-all shadow-md
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running...
              </span>
            ) : (
              '▶ Run Next Task'
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {showResult && result && (
        <div className={`
          border rounded-lg p-6 shadow-sm
          ${result.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
          }
        `}>
          <div className="flex justify-between items-start mb-4">
            <h4 className={`font-semibold text-lg ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✓ Task Executed Successfully' : '✗ Task Execution Failed'}
            </h4>
            <button
              onClick={() => setShowResult(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {result.task_id && (
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">Task ID: </span>
              <span className="font-mono text-sm text-gray-900">{result.task_id}</span>
            </div>
          )}

          {result.task && (
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type: </span>
                  <span className="text-gray-900">{result.task.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status: </span>
                  <span className={`
                    inline-block px-2 py-1 rounded text-xs font-medium
                    ${result.task.status === 'done' ? 'bg-green-100 text-green-800' : ''}
                    ${result.task.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {result.task.status}
                  </span>
                </div>
              </div>

              {result.task.title && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Title: </span>
                  <span className="text-gray-900">{result.task.title}</span>
                </div>
              )}
            </div>
          )}

          {result.error && (
            <div className="bg-gray-900 rounded p-3 border border-gray-800">
              <p className="text-sm font-medium text-red-400 mb-1">Error:</p>
              <pre className="text-sm text-red-300 whitespace-pre-wrap">{result.error}</pre>
            </div>
          )}

          {result.result && (
            <div className="bg-gray-900 rounded p-3 border border-gray-800">
              <p className="text-sm font-medium text-green-400 mb-2">Result:</p>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}

          {!result.success && !result.task_id && (
            <p className="text-sm text-gray-700">
              {result.error || 'No pending tasks found in the queue.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

