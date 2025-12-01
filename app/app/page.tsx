'use client';

import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import CreateTaskForm from './components/CreateTaskForm';
import RunTaskButton from './components/RunTaskButton';
import EventList from './components/EventList';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import { Task } from './lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'events' | 'diagnostics'>('tasks');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'tasks' as const, label: '📋 Tasks', icon: '📋' },
    { id: 'create' as const, label: '➕ Create Task', icon: '➕' },
    { id: 'events' as const, label: '📊 Events', icon: '📊' },
    { id: 'diagnostics' as const, label: '🔧 Diagnostics', icon: '🔧' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-slate-800 rounded-lg shadow-lg p-1 flex gap-1 border border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-6 py-3 rounded-md font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }
            `}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Run Next Task Button - Always visible */}
      <RunTaskButton onTaskRun={handleRefresh} />

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
        {activeTab === 'tasks' && (
          <TaskList
            refreshTrigger={refreshTrigger}
            onTaskSelect={setSelectedTask}
          />
        )}

        {activeTab === 'create' && (
          <CreateTaskForm
            onTaskCreated={() => {
              handleRefresh();
              setActiveTab('tasks');
            }}
          />
        )}

        {activeTab === 'events' && (
          <EventList refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsPanel />
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-100">Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-400">ID</label>
                  <p className="font-mono text-sm text-slate-200">{selectedTask.id}</p>
                </div>

                {selectedTask.title && (
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Title</label>
                    <p className="text-slate-100">{selectedTask.title}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Type</label>
                    <p className="text-slate-200">{selectedTask.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Status</label>
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-medium ml-2
                      ${selectedTask.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-800' : ''}
                      ${selectedTask.status === 'failed' ? 'bg-red-900/30 text-red-400 border border-red-800' : ''}
                      ${selectedTask.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' : ''}
                      ${selectedTask.status === 'running' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : ''}
                    `}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTask.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-sm border border-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Created</label>
                    <p className="text-slate-200">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Updated</label>
                    <p className="text-slate-200">{new Date(selectedTask.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-400">Payload</label>
                  <pre className="bg-slate-950 p-4 rounded mt-1 overflow-x-auto text-sm text-slate-300 border border-slate-700">
                    {JSON.stringify(selectedTask.payload, null, 2)}
                  </pre>
                </div>

                {selectedTask.runnerStatus && (
                  <div>
                    <label className="text-sm font-semibold text-slate-400">Runner Status</label>
                    <pre className="bg-slate-950 p-4 rounded mt-1 overflow-x-auto text-sm text-slate-300 border border-slate-700">
                      {selectedTask.runnerStatus}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

