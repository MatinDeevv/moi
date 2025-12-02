'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMode } from '../contexts/ModeContext';

interface Task {
  id: string;
  title: string;
  status: string;
  lastRunAt?: string;
  outputText?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { isDevMode } = useMode();
  const [lastTask, setLastTask] = useState<Task | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/tasks?limit=5');
      const json = await res.json();

      if (json.ok && json.data) {
        const tasks = json.data;
        setRecentTasks(tasks);
        if (tasks.length > 0) {
          setLastTask(tasks[0]);
        }
      }
    } catch (err) {
      console.error('[Dashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your AI workstation at a glance</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/?tab=create"
          className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group"
        >
          <div className="text-3xl mb-2">➕</div>
          <h3 className="font-semibold text-gray-100 group-hover:text-indigo-400">New Task</h3>
          <p className="text-sm text-gray-500 mt-1">Create a task</p>
        </Link>

        <Link
          href="/sandbox"
          className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group"
        >
          <div className="text-3xl mb-2">📁</div>
          <h3 className="font-semibold text-gray-100 group-hover:text-indigo-400">Sandbox</h3>
          <p className="text-sm text-gray-500 mt-1">Browse files</p>
        </Link>

        {isDevMode && (
          <Link
            href="/shell"
            className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group"
          >
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-100 group-hover:text-indigo-400">Shell</h3>
            <p className="text-sm text-gray-500 mt-1">Run commands</p>
          </Link>
        )}

        <Link
          href="/settings"
          className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="font-semibold text-gray-100 group-hover:text-indigo-400">Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Configure</p>
        </Link>
      </div>

      {/* Last Task Signal */}
      {lastTask && (
        <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Current Signal / Last Task</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">{lastTask.title || `Task ${lastTask.id.slice(0, 8)}`}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lastTask.status)}`}>
                {lastTask.status}
              </span>
            </div>

            {lastTask.outputText && (
              <div className="bg-[#020617] border border-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 line-clamp-3">
                  {lastTask.outputText}
                </div>
              </div>
            )}

            {lastTask.lastRunAt && (
              <div className="text-xs text-gray-500">
                Last run: {new Date(lastTask.lastRunAt).toLocaleString()}
              </div>
            )}

            <Link
              href={`/?taskId=${lastTask.id}`}
              className="inline-block text-sm text-indigo-400 hover:text-indigo-300"
            >
              View details →
            </Link>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-100 mb-4">Recent Tasks</h2>

        {loading ? (
          <div className="text-gray-500 text-center py-4">Loading...</div>
        ) : recentTasks.length === 0 ? (
          <div className="text-gray-500 text-center py-4">No tasks yet</div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                href={`/?taskId=${task.id}`}
                className="block bg-[#020617] border border-gray-800 rounded-lg p-4 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-200">
                      {task.title || `Task ${task.id.slice(0, 8)}`}
                    </div>
                    {task.lastRunAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(task.lastRunAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

