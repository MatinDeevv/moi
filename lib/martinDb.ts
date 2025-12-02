/**
 * MartinDB - Simple JSON-based database for Tasks and Events
 * SERVER-SIDE ONLY - Do not import this in client components
 */

import fs from 'fs/promises';
import path from 'path';

// Types
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
}

export interface Event {
  id: string;
  taskId?: string;
  eventType: string;
  timestamp: string;
  data: any;
}

// File paths
const DATA_DIR = path.join(process.cwd(), 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    console.log('[MartinDB] Creating data directory');
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Read JSON file with error handling
 */
async function readJsonFile<T>(filePath: string, defaultValue: T[]): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    console.log(`[MartinDB] Successfully read ${path.basename(filePath)} (${parsed.length} items)`);
    return parsed;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`[MartinDB] File not found: ${path.basename(filePath)}, creating with empty array`);
      await ensureDataDir();
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    console.error(`[MartinDB] Error reading ${path.basename(filePath)}:`, error.message);
    console.error(`[MartinDB] Resetting to empty array due to error`);
    return defaultValue;
  }
}

/**
 * Write JSON file with error handling
 */
async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[MartinDB] Successfully wrote ${path.basename(filePath)} (${data.length} items)`);
  } catch (error: any) {
    console.error(`[MartinDB] Error writing ${path.basename(filePath)}:`, error.message);
    throw error;
  }
}

/**
 * Load all tasks
 */
export async function loadTasks(): Promise<Task[]> {
  console.log('[MartinDB] Reading tasks.json');
  return readJsonFile<Task>(TASKS_FILE, []);
}

/**
 * Save all tasks
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  console.log(`[MartinDB] Writing tasks.json (${tasks.length} tasks)`);
  await writeJsonFile(TASKS_FILE, tasks);
}

/**
 * Load all events
 */
export async function loadEvents(): Promise<Event[]> {
  console.log('[MartinDB] Reading events.json');
  return readJsonFile<Event>(EVENTS_FILE, []);
}

/**
 * Save all events
 */
export async function saveEvents(events: Event[]): Promise<void> {
  console.log(`[MartinDB] Writing events.json (${events.length} events)`);
  await writeJsonFile(EVENTS_FILE, events);
}

/**
 * Add a new event (helper)
 */
export async function addEvent(event: Omit<Event, 'id' | 'timestamp'>): Promise<Event> {
  const events = await loadEvents();
  const newEvent: Event = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  events.push(newEvent);
  await saveEvents(events);
  console.log(`[MartinDB] Added event: ${newEvent.eventType} (id: ${newEvent.id})`);
  return newEvent;
}

