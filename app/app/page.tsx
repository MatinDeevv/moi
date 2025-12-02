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
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium transition-all text-sm
              ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
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
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-slate-100">Task Details</h2>
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${selectedTask.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                  ${selectedTask.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                  ${selectedTask.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                  ${selectedTask.status === 'running' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                `}>
                  {selectedTask.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-200 text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">ID</label>
                  <p className="font-mono text-sm text-slate-300 mt-1">{selectedTask.id}</p>
                </div>

                {selectedTask.title && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Title</label>
                    <p className="text-lg text-slate-100 mt-1 font-medium">{selectedTask.title}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</label>
                    <p className="text-slate-200 mt-1">{selectedTask.type || 'general'}</p>
                  </div>
                  {selectedTask.outputRaw?.raw?.model && (
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Model</label>
                      <p className="text-slate-200 mt-1 font-mono text-sm">{selectedTask.outputRaw.raw.model}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Section */}
              {selectedTask.payload && (selectedTask.payload.prompt || selectedTask.payload.system_prompt) && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                  <label className="text-sm font-bold text-blue-400 flex items-center space-x-2">
                    <span>💬</span>
                    <span>Prompt</span>
                  </label>

                  {selectedTask.payload.system_prompt && (
                    <div className="bg-slate-900 border border-slate-700 rounded p-3">
                      <div className="text-xs text-slate-500 mb-2">System:</div>
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                        {selectedTask.payload.system_prompt}
                      </pre>
                    </div>
                  )}

                  {selectedTask.payload.prompt && (
                    <div className="bg-slate-900 border border-slate-700 rounded p-3">
                      <div className="text-xs text-slate-500 mb-2">User:</div>
                      <pre className="text-sm text-slate-100 whitespace-pre-wrap">
                        {selectedTask.payload.prompt}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* LLM Output Section */}
              {selectedTask.outputText && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
                  <label className="text-sm font-bold text-green-400 flex items-center space-x-2">
                    <span>✨</span>
                    <span>LLM Output</span>
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
                      {selectedTask.outputText}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error Section */}
              {selectedTask.errorMessage && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-4">
                  <label className="text-sm font-bold text-red-400 flex items-center space-x-2 mb-2">
                    <span>❌</span>
                    <span>Error</span>
                  </label>
                  <p className="text-red-300 font-medium">{selectedTask.errorMessage}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Created</label>
                  <p className="text-slate-300 text-sm mt-1">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Updated</label>
                  <p className="text-slate-300 text-sm mt-1">{new Date(selectedTask.updatedAt).toLocaleString()}</p>
                </div>
                {selectedTask.lastRunAt && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Run</label>
                      <p className="text-slate-300 text-sm mt-1">{new Date(selectedTask.lastRunAt).toLocaleString()}</p>
                    </div>
                    {selectedTask.runnerStatus && (
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Runner Status</label>
                        <p className="text-slate-300 text-sm mt-1">{selectedTask.runnerStatus}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Tags */}
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTask.tags.map((tag, i) => (
                      <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Response Toggle */}
              {selectedTask.outputRaw && (
                <details className="border-t border-slate-800 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-2">
                    <span>🔧</span>
                    <span>Show Raw Runner Response</span>
                  </summary>
                  <pre className="bg-slate-950 border border-slate-800 p-4 rounded-lg mt-3 overflow-x-auto text-xs text-slate-400 max-h-64 overflow-y-auto">
                    {JSON.stringify(selectedTask.outputRaw, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

