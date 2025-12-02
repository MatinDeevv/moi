'use client';

import { useState } from 'react';
import { createTask } from '@/lib/api';

interface CreateTaskFormProps {
  onTaskCreated?: () => void;
}

const TASK_TYPES = [
  { value: 'shell', label: 'Shell Command', description: 'Execute a shell command' },
  { value: 'generic_llm', label: 'Generic LLM', description: 'Ask the LLM a question' },
  { value: 'filesystem', label: 'Filesystem', description: 'File operations (read/write/list)' },
  { value: 'code_analysis', label: 'Code Analysis', description: 'Analyze code with LLM' },
  { value: 'llm_session', label: 'LLM Session', description: 'Conversational LLM session' },
];

export default function CreateTaskForm({ onTaskCreated }: CreateTaskFormProps) {
  const [taskType, setTaskType] = useState('shell');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [payload, setPayload] = useState('{\n  \n}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate example payloads based on task type
  const getExamplePayload = (type: string) => {
    switch (type) {
      case 'shell':
        return '{\n  "command": "dir",\n  "cwd": "C:\\\\\\\\Users"\n}';
      case 'generic_llm':
        return '{\n  "prompt": "What is the capital of France?",\n  "system_prompt": "You are a helpful assistant."\n}';
      case 'filesystem':
        return '{\n  "operation": "read",\n  "filepath": "C:\\\\\\\\path\\\\\\\\to\\\\\\\\file.txt"\n}';
      case 'code_analysis':
        return '{\n  "filepath": "C:\\\\\\\\path\\\\\\\\to\\\\\\\\code.py",\n  "question": "What does this code do?"\n}';
      case 'llm_session':
        return '{\n  "session_id": "my-session-1",\n  "message": "Hello!",\n  "system": "You are a helpful assistant."\n}';
      default:
        return '{\n  \n}';
    }
  };

  const handleTypeChange = (newType: string) => {
    setTaskType(newType);
    setPayload(getExamplePayload(newType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('[CreateTaskForm] Submitting task:', { title, taskType, tags });

      // Validate title
      if (!title || title.trim().length === 0) {
        throw new Error('Title is required');
      }

      // Parse payload JSON
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (err) {
        console.error('[CreateTaskForm] Invalid JSON:', err);
        throw new Error('Invalid JSON in payload');
      }

      // Parse tags
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const result = await createTask({
        title: title.trim(),
        type: taskType,
        payload: parsedPayload,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      console.log('[CreateTaskForm] Task created:', result.task.id);
      setSuccess(true);

      // Reset form
      setTitle('');
      setTags('');
      setPayload(getExamplePayload(taskType));

      // Notify parent
      setTimeout(() => {
        onTaskCreated?.();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('[CreateTaskForm] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ Task created successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TASK_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`
                  text-left p-4 rounded-lg border-2 transition-all
                  ${taskType === type.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="A descriptive title for this task"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (optional, comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="urgent, automation, test"
          />
        </div>

        {/* Payload */}
        <div>
          <label htmlFor="payload" className="block text-sm font-medium text-gray-700 mb-2">
            Payload (JSON) *
          </label>
          <textarea
            id="payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder='{"key": "value"}'
          />
          <p className="mt-1 text-sm text-gray-500">
            Example payload loaded for {TASK_TYPES.find(t => t.value === taskType)?.label}
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors
              ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTitle('');
              setTags('');
              setPayload(getExamplePayload(taskType));
              setError(null);
              setSuccess(false);
            }}
            className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

