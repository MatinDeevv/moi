// API URL configuration
// In production (Vercel): uses /api which routes to Python backend
// In development: uses localhost:8000 or env var
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'
    : 'http://localhost:8000');

export interface Task {
  id: string;
  title: string | null;
  type: string;
  status: string;
  payload: any;
  tags: string[];
  created_at: string;
  updated_at: string;
  result?: any;
  error?: string;
}

export interface Event {
  task_id: string | null;
  event_type: string;
  timestamp: string;
  data: any;
}

export interface CreateTaskPayload {
  title?: string;
  type: string;
  payload: any;
  tags?: string[];
}

export interface TasksResponse {
  tasks: Task[];
  count: number;
}

export interface EventsResponse {
  events: Event[];
  count: number;
}

export interface RunTaskResponse {
  success: boolean;
  task_id: string | null;
  task?: Task;
  result?: any;
  error?: string;
}

// Health check
export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

// Get tasks
export async function getTasks(params?: {
  limit?: number;
  status?: string;
  task_type?: string;
  tag?: string;
}): Promise<TasksResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.task_type) queryParams.append('task_type', params.task_type);
  if (params?.tag) queryParams.append('tag', params.tag);

  const response = await fetch(`${API_BASE_URL}/tasks?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

// Get single task
export async function getTask(taskId: string): Promise<{ task: Task; events: Event[] }> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
  if (!response.ok) throw new Error('Failed to fetch task');
  return response.json();
}

// Create task
export async function createTask(payload: CreateTaskPayload): Promise<{ success: boolean; task: Task }> {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create task');
  }

  return response.json();
}

// Run next task
export async function runNextTask(): Promise<RunTaskResponse> {
  const response = await fetch(`${API_BASE_URL}/tasks/run-next`, {
    method: 'POST',
  });

  if (!response.ok) throw new Error('Failed to run task');
  return response.json();
}

// Get events
export async function getEvents(params?: {
  limit?: number;
  task_id?: string;
  event_type?: string;
}): Promise<EventsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.task_id) queryParams.append('task_id', params.task_id);
  if (params?.event_type) queryParams.append('event_type', params.event_type);

  const response = await fetch(`${API_BASE_URL}/events?${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

// Get session
export async function getSession(sessionId: string, limit?: number): Promise<{
  session_id: string;
  messages: any[];
  summary: string | null;
  message_count: number;
}> {
  const queryParams = limit ? `?limit=${limit}` : '';
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}${queryParams}`);
  if (!response.ok) throw new Error('Failed to fetch session');
  return response.json();
}

// List sessions
export async function listSessions(): Promise<{ sessions: string[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/sessions`);
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
}

