'use client';

import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';
import CreateTaskForm from '../components/CreateTaskForm';
import RunTaskButton from '../components/RunTaskButton';
import EventList from '../components/EventList';
import { Task } from '../lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'create' | 'events'>('tasks');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'tasks' as const, label: '📋 Tasks', icon: '📋' },
    { id: 'create' as const, label: '➕ Create Task', icon: '➕' },
    { id: 'events' as const, label: '📊 Events', icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md p-1 flex gap-1">
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
      <div className="bg-white rounded-lg shadow-md p-6">
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
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">ID</label>
                  <p className="font-mono text-sm text-gray-800">{selectedTask.id}</p>
                </div>

                {selectedTask.title && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Title</label>
                    <p className="text-gray-800">{selectedTask.title}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Type</label>
                    <p className="text-gray-800">{selectedTask.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Status</label>
                    <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-medium
                      ${selectedTask.status === 'done' ? 'bg-green-100 text-green-800' : ''}
                      ${selectedTask.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                      ${selectedTask.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${selectedTask.status === 'running' ? 'bg-blue-100 text-blue-800' : ''}
                    `}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTask.tags.map((tag, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Created</label>
                    <p className="text-gray-800">{new Date(selectedTask.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Updated</label>
                    <p className="text-gray-800">{new Date(selectedTask.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Payload</label>
                  <pre className="bg-gray-50 p-4 rounded mt-1 overflow-x-auto text-sm">
                    {JSON.stringify(selectedTask.payload, null, 2)}
                  </pre>
                </div>

                {selectedTask.result && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Result</label>
                    <pre className="bg-green-50 p-4 rounded mt-1 overflow-x-auto text-sm">
                      {JSON.stringify(selectedTask.result, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedTask.error && (
                  <div>
                    <label className="text-sm font-semibold text-red-600">Error</label>
                    <pre className="bg-red-50 p-4 rounded mt-1 overflow-x-auto text-sm text-red-800">
                      {selectedTask.error}
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

