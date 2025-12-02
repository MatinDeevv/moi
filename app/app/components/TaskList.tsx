'use client';

import { useState, useEffect } from 'react';
import { getTasks, Task } from '@/lib/api';

interface TaskListProps {
  refreshTrigger?: number;
  onTaskSelect?: (task: Task) => void;
}

export default function TaskList({ refreshTrigger = 0, onTaskSelect }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    limit: 50
  });

  useEffect(() => {
    loadTasks();
  }, [refreshTrigger, filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTasks({
        limit: filter.limit,
        status: filter.status || undefined,
        task_type: filter.type || undefined,
      });
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'pending':
        return 'bg-gray-800 text-gray-300 border border-gray-700';
      case 'running':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
        <p className="text-red-300">Error: {error}</p>
        <button
          onClick={loadTasks}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Tasks</h2>
        <button
          onClick={loadTasks}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900 p-4 rounded-lg border border-gray-800">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Type
          </label>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="shell">Shell</option>
            <option value="generic_llm">Generic LLM</option>
            <option value="filesystem">Filesystem</option>
            <option value="code_analysis">Code Analysis</option>
            <option value="llm_session">LLM Session</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Limit
          </label>
          <select
            value={filter.limit}
            onChange={(e) => setFilter({ ...filter, limit: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
      </div>

      {/* Task count */}
      <p className="text-sm text-gray-400">
        Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      </p>

      {/* Tasks table */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No tasks found. Create one to get started!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#0f172a] divide-y divide-gray-800">
ta base schem to be the same across deployments               {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-600">
                      {task.id.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {task.title || <span className="text-gray-500 italic">No title</span>}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 3 && (
                          <span className="text-xs text-gray-600">+{task.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{task.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(task.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onTaskSelect?.(task)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

