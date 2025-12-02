// API URL configuration
// Always use relative /api routes (Next.js API routes, not Python)
const API_BASE_URL = '/api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runnerStatus?: string;
  type?: string;
  payload?: any;
  tags?: string[];
  outputText?: string;
  outputRaw?: any;
  errorMessage?: string;
}

export interface Event {
  id: string;
  taskId?: string;
  eventType: string;
  timestamp: string;
  data: any;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  type?: string;
  payload?: any;
  tags?: string[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to handle fetch with proper error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[Client] Fetching: ${options?.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, options);

    // Read the response body once
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data;
    let errorMessage = `HTTP ${response.status}`;

    // Read body once based on content type
    if (isJson) {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[Client] Failed to parse JSON response');
        throw new Error('Server returned invalid JSON');
      }
    } else {
      const text = await response.text();
      errorMessage = text || errorMessage;
      data = { ok: false, error: text };
    }

    // Check if response is OK
    if (!response.ok) {
      const finalError = data?.error || data?.message || errorMessage;
      console.error(`[Client] Request failed: ${finalError}`);
      throw new Error(finalError);
    }

    // Check API response format
    if (!data.ok && data.error) {
      console.error(`[Client] API error: ${data.error}`);
      throw new Error(data.error);
    }

    console.log(`[Client] Success: ${options?.method || 'GET'} ${url}`);
    return data.data as T;

  } catch (error: any) {
    console.error(`[Client] Error in fetchApi:`, error.message);
    throw error;
  }
}

// Health check
export async function checkHealth(): Promise<any> {
  return fetchApi('/health');
}

// Get tasks
export async function getTasks(params?: {
  limit?: number;
  status?: string;
  task_type?: string;
  tag?: string;
}): Promise<{ tasks: Task[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.task_type) queryParams.append('type', params.task_type);
  if (params?.tag) queryParams.append('tag', params.tag);

  const query = queryParams.toString();
  return fetchApi(`/tasks${query ? `?${query}` : ''}`);
}

// Get single task
export async function getTask(taskId: string): Promise<{ task: Task }> {
  return fetchApi(`/tasks/${taskId}`);
}

// Create task
export async function createTask(payload: CreateTaskPayload): Promise<{ task: Task }> {
  return fetchApi('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Update task
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<{ task: Task }> {
  return fetchApi(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

// Delete task
export async function deleteTask(taskId: string): Promise<{ deleted: boolean; taskId: string }> {
  return fetchApi(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

// Run a task
export async function runTask(taskId: string): Promise<{ task: Task; runnerResponse?: any }> {
  return fetchApi(`/tasks/${taskId}/run`, {
    method: 'POST',
  });
}

// Get events
export async function getEvents(params?: {
  limit?: number;
  task_id?: string;
  event_type?: string;
}): Promise<{ events: Event[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.task_id) queryParams.append('task_id', params.task_id);
  if (params?.event_type) queryParams.append('event_type', params.event_type);

  const query = queryParams.toString();
  return fetchApi(`/events${query ? `?${query}` : ''}`);
}

