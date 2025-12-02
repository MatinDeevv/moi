'use client';

import { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import CreateTaskForm from './components/CreateTaskForm';
import RunTaskButton from './components/RunTaskButton';
import EventList from './components/EventList';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import SettingsPage from './settings/page';
import { Task } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'events' | 'diagnostics' | 'settings'>('tasks');
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
    { id: 'settings' as const, label: '⚙️ Settings', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md p-1 flex gap-1 border border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-6 py-3 rounded-md font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
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
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
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

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white border border-gray-300 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Title and Status */}
                <div>
                  <label className="text-sm font-semibold text-gray-700">ID</label>
                  <p className="font-mono text-sm text-gray-900">{selectedTask.id}</p>
                </div>

                {selectedTask.title && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Title</label>
                    <p className="text-gray-900">{selectedTask.title}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Type</label>
                    <p className="text-gray-900">{selectedTask.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Status</label>
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-medium ml-2
                      ${selectedTask.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-300' : ''}
                      ${selectedTask.status === 'failed' ? 'bg-red-100 text-red-800 border border-red-300' : ''}
                      ${selectedTask.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : ''}
                      ${selectedTask.status === 'running' ? 'bg-blue-100 text-blue-800 border border-blue-300' : ''}
                    `}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                {/* LLM Output Section */}
                {selectedTask.outputText && (
                  <div className="border-t-2 border-blue-200 pt-4">
                    <label className="text-lg font-bold text-gray-900 mb-2 block">📄 LLM Output</label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono leading-relaxed">
                        {selectedTask.outputText}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Error Message Section */}
                {selectedTask.errorMessage && (
                  <div className="border-t-2 border-red-200 pt-4">
                    <label className="text-lg font-bold text-red-800 mb-2 block">❌ Error</label>
                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                      <p className="text-red-900 font-medium">{selectedTask.errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Metadata Section */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTask.tags.map((tag, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm border border-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Created</label>
                    <p className="text-gray-900">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Updated</label>
                    <p className="text-gray-900">{new Date(selectedTask.updatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedTask.lastRunAt && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Last Run</label>
                    <p className="text-gray-900">{new Date(selectedTask.lastRunAt).toLocaleString()}</p>
                  </div>
                )}

                {/* Raw Response Toggle */}
                {selectedTask.outputRaw && (
                  <details className="border-t border-gray-200 pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                      🔧 Show Raw Runner Response
                    </summary>
                    <pre className="bg-gray-50 p-4 rounded mt-2 overflow-x-auto text-xs text-gray-900 border border-gray-200 max-h-64 overflow-y-auto">
                      {JSON.stringify(selectedTask.outputRaw, null, 2)}
                    </pre>
                  </details>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Payload</label>
                  <pre className="bg-gray-50 p-4 rounded mt-1 overflow-x-auto text-sm text-gray-900 border border-gray-200">
                    {JSON.stringify(selectedTask.payload, null, 2)}
                  </pre>
                </div>

                {selectedTask.runnerStatus && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Runner Status</label>
                    <pre className="bg-gray-50 p-4 rounded mt-1 overflow-x-auto text-sm text-gray-900 border border-gray-200">
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

