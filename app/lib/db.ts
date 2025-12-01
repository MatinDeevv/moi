/**
 * Database Service using Prisma
 * Replaces the old martinDb.ts with proper database operations
 */

import prisma from './prisma'

export interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  type?: string | null
  payload?: any
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date | null
  runnerStatus?: string | null
}

export interface Event {
  id: string
  taskId?: string | null
  eventType: string
  timestamp: Date
  data?: any
}

/**
 * Task Operations
 */

export async function getTasks(filters?: {
  status?: string
  type?: string
  tag?: string
  limit?: number
}) {
  console.log('[DB] Getting tasks with filters:', filters)

  const where: any = {}

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.type) {
    where.type = filters.type
  }

  if (filters?.tag) {
    where.tags = {
      contains: filters.tag
    }
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  })

  console.log(`[DB] Found ${tasks.length} tasks`)

  return tasks.map(task => ({
    ...task,
    payload: task.payload ? JSON.parse(task.payload) : undefined,
    tags: task.tags ? JSON.parse(task.tags) : [],
    description: task.description || undefined,
    type: task.type || undefined,
    lastRunAt: task.lastRunAt || undefined,
    runnerStatus: task.runnerStatus || undefined,
  }))
}

export async function getTaskById(id: string) {
  console.log(`[DB] Getting task by ID: ${id}`)

  const task = await prisma.task.findUnique({
    where: { id },
  })

  if (!task) {
    console.log(`[DB] Task not found: ${id}`)
    return null
  }

  console.log(`[DB] Found task: ${task.title}`)

  return {
    ...task,
    payload: task.payload ? JSON.parse(task.payload) : undefined,
    tags: task.tags ? JSON.parse(task.tags) : [],
    description: task.description || undefined,
    type: task.type || undefined,
    lastRunAt: task.lastRunAt || undefined,
    runnerStatus: task.runnerStatus || undefined,
  }
}

export async function createTask(data: {
  title: string
  description?: string
  type?: string
  payload?: any
  tags?: string[]
}) {
  console.log(`[DB] Creating task: ${data.title}`)

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      type: data.type || 'general',
      status: 'pending',
      payload: data.payload ? JSON.stringify(data.payload) : undefined,
      tags: data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : undefined,
    },
  })

  console.log(`[DB] Task created: ${task.id}`)

  return {
    ...task,
    payload: task.payload ? JSON.parse(task.payload) : undefined,
    tags: task.tags ? JSON.parse(task.tags) : [],
    description: task.description || undefined,
    type: task.type || undefined,
    lastRunAt: task.lastRunAt || undefined,
    runnerStatus: task.runnerStatus || undefined,
  }
}

export async function updateTask(id: string, data: Partial<Task>) {
  console.log(`[DB] Updating task: ${id}`)

  const updateData: any = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.status !== undefined) updateData.status = data.status
  if (data.type !== undefined) updateData.type = data.type
  if (data.payload !== undefined) updateData.payload = JSON.stringify(data.payload)
  if (data.tags !== undefined) updateData.tags = data.tags.length > 0 ? JSON.stringify(data.tags) : null
  if (data.lastRunAt !== undefined) updateData.lastRunAt = data.lastRunAt
  if (data.runnerStatus !== undefined) updateData.runnerStatus = data.runnerStatus

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  })

  console.log(`[DB] Task updated: ${task.id}`)

  return {
    ...task,
    payload: task.payload ? JSON.parse(task.payload) : undefined,
    tags: task.tags ? JSON.parse(task.tags) : [],
    description: task.description || undefined,
    type: task.type || undefined,
    lastRunAt: task.lastRunAt || undefined,
    runnerStatus: task.runnerStatus || undefined,
  }
}

export async function deleteTask(id: string) {
  console.log(`[DB] Deleting task: ${id}`)

  await prisma.task.delete({
    where: { id },
  })

  console.log(`[DB] Task deleted: ${id}`)

  return { id }
}

/**
 * Event Operations
 */

export async function getEvents(filters?: {
  taskId?: string
  eventType?: string
  limit?: number
}) {
  console.log('[DB] Getting events with filters:', filters)

  const where: any = {}

  if (filters?.taskId) {
    where.taskId = filters.taskId
  }

  if (filters?.eventType) {
    where.eventType = filters.eventType
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 200,
  })

  console.log(`[DB] Found ${events.length} events`)

  return events.map(event => ({
    ...event,
    data: event.data ? JSON.parse(event.data) : undefined,
    taskId: event.taskId || undefined,
  }))
}

export async function createEvent(data: {
  taskId?: string
  eventType: string
  data?: any
}) {
  console.log(`[DB] Creating event: ${data.eventType}`)

  const event = await prisma.event.create({
    data: {
      taskId: data.taskId,
      eventType: data.eventType,
      data: data.data ? JSON.stringify(data.data) : undefined,
    },
  })

  console.log(`[DB] Event created: ${event.id}`)

  return {
    ...event,
    data: event.data ? JSON.parse(event.data) : undefined,
    taskId: event.taskId || undefined,
  }
}

/**
 * Health Check
 */

export async function getDatabaseHealth() {
  try {
    const tasksCount = await prisma.task.count()
    const eventsCount = await prisma.event.count()

    return {
      healthy: true,
      tasksCount,
      eventsCount,
      error: null,
    }
  } catch (error: any) {
    console.error('[DB] Health check failed:', error)
    return {
      healthy: false,
      tasksCount: 0,
      eventsCount: 0,
      error: error.message,
    }
  }
}

