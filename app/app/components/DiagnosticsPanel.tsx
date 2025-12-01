'use client';

import { useState, useEffect } from 'react';
import { checkHealth, getTasks, getEvents } from '../lib/api';

export default function DiagnosticsPanel() {
  const [health, setHealth] = useState<any>(null);
  const [tasksStatus, setTasksStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [eventsStatus, setEventsStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log('[Diagnostics] Running system diagnostics...');

    // Test health endpoint
    try {
      const h = await checkHealth();
      console.log('[Diagnostics] Health check:', h);
      setHealth(h);
    } catch (err: any) {
      console.error('[Diagnostics] Health check failed:', err);
      setHealth({ ok: false, error: err.message });
    }

    // Test tasks endpoint
    try {
      const tasks = await getTasks({ limit: 1 });
      console.log('[Diagnostics] Tasks check:', tasks);
      setTasksStatus('success');
    } catch (err: any) {
      console.error('[Diagnostics] Tasks check failed:', err);
      setTasksStatus('error');
      setErrorDetails((prev: Record<string, string>) => ({ ...prev, tasks: err.message }));
    }

    // Test events endpoint
    try {
      const events = await getEvents({ limit: 1 });
      console.log('[Diagnostics] Events check:', events);
      setEventsStatus('success');
    } catch (err: any) {
      console.error('[Diagnostics] Events check failed:', err);
      setEventsStatus('error');
      setErrorDetails((prev: Record<string, string>) => ({ ...prev, events: err.message }));
    }
  };

  const StatusIndicator = ({ status }: { status: 'loading' | 'success' | 'error' }) => {
    if (status === 'loading') return <span className="text-yellow-700">⏳ Testing...</span>;
    if (status === 'success') return <span className="text-green-700">✅ OK</span>;
    return <span className="text-red-700">❌ Failed</span>;
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">🔧 System Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          🔄 Re-run Tests
        </button>
      </div>

      <div className="space-y-3">
        {/* Health Check */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">Health Endpoint</p>
              <p className="text-sm text-gray-600 mt-1">GET /api/health</p>
            </div>
            <StatusIndicator status={health ? 'success' : 'loading'} />
          </div>
          {health && (
            <details className="mt-3">
              <summary className="text-sm text-blue-600 cursor-pointer">View Response</summary>
              <pre className="mt-2 bg-white p-3 rounded text-xs overflow-x-auto text-gray-900 border border-gray-200">
                {JSON.stringify(health, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Tasks API */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">Tasks API</p>
              <p className="text-sm text-gray-600 mt-1">GET /api/tasks</p>
            </div>
            <StatusIndicator status={tasksStatus} />
          </div>
          {errorDetails.tasks && (
            <p className="mt-2 text-sm text-red-700">{errorDetails.tasks}</p>
          )}
        </div>

        {/* Events API */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">Events API</p>
              <p className="text-sm text-gray-600 mt-1">GET /api/events</p>
            </div>
            <StatusIndicator status={eventsStatus} />
          </div>
          {errorDetails.events && (
            <p className="mt-2 text-sm text-red-700">{errorDetails.events}</p>
          )}
        </div>

        {/* Runner Configuration */}
        {health && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">Remote Runner</p>
                <p className="text-sm text-gray-600 mt-1">
                  {health.runner?.configured ? (
                    <>Configured: {health.runner?.baseUrl}</>
                  ) : (
                    'Not configured (set RUNNER_BASE_URL env var)'
                  )}
                </p>
              </div>
              {health.runner?.configured ? (
                <span className="text-green-700">✅ Configured</span>
              ) : (
                <span className="text-yellow-700">⚠️ Not Set</span>
              )}
            </div>
          </div>
        )}

        {/* Database Status */}
        {health?.database && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">MartinDB</p>
                <p className="text-sm text-gray-600 mt-1">
                  Tasks: {health.database.tasksCount} | Events: {health.database.eventsCount}
                </p>
              </div>
              {health.database.healthy ? (
                <span className="text-green-700">✅ Healthy</span>
              ) : (
                <span className="text-red-700">❌ Error</span>
              )}
            </div>
            {health.database.error && (
              <p className="mt-2 text-sm text-red-700">{health.database.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Check browser console (F12) for detailed logs from all API calls
        </p>
      </div>
    </div>
  );
}

