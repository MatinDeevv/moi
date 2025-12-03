/**
 * Database Service - PostgreSQL Edition
 * Comprehensive database operations for Project ME with multi-user support
 */

import prisma from './prisma'

// ==================== TYPES ====================

export interface User {
  id: string
  email?: string | null
  name?: string | null
  username?: string | null
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date | null
}

export interface Task {
  id: string
  userId?: string | null
  title: string
  description?: string | null
  status: string
  type: string
  payload?: any
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  lastRunAt?: Date | null
  runnerStatus?: string | null
  outputText?: string | null
  outputRaw?: any
  errorMessage?: string | null
  priority?: number
  isPublic?: boolean
  executionTime?: number | null
}

export interface Event {
  id: string
  userId?: string | null
  taskId?: string | null
  eventType: string
  timestamp: Date
  data?: any
  level?: string
}

export interface Settings {
  id: string
  userId?: string | null
  runnerUrl?: string | null
  runnerToken?: string | null
  preferences?: any
  updatedAt: Date
  createdAt: Date
}

// ==================== USER OPERATIONS ====================

export async function createUser(data: {
  email?: string
  name?: string
  username?: string
  passwordHash?: string
}) {
  console.log('[DB] Creating user:', data.email || data.username)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      username: data.username,
      passwordHash: data.passwordHash,
    },
  })

  console.log('[DB] User created:', user.id)
  return user
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      settings: true,
    },
  })
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  })
}

export async function getUserByUsername(username: string) {
  return await prisma.user.findUnique({
    where: { username },
  })
}

// ==================== TASK OPERATIONS ====================

export async function getTasks(filters?: {
  userId?: string
  status?: string
  type?: string
  isPublic?: boolean
  limit?: number
  offset?: number
}) {
  console.log('[DB] Getting tasks with filters:', filters)

  const where: any = {}

  if (filters?.userId !== undefined) {
    where.userId = filters.userId
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.type) {
    where.type = filters.type
  }

  if (filters?.isPublic !== undefined) {
    where.isPublic = filters.isPublic
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  })

  console.log(`[DB] Found ${tasks.length} tasks`)
  return tasks
}

export async function getTaskById(id: string) {
  console.log('[DB] Getting task by ID:', id)

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      events: {
        orderBy: { timestamp: 'desc' },
        take: 50,
      },
    },
  })

  if (!task) {
    console.log('[DB] Task not found:', id)
    return null
  }

  console.log('[DB] Task found:', task.id)
  return task
}

export async function createTask(data: {
  userId?: string
  title: string
  description?: string
  type?: string
  payload?: any
  tags?: string[]
  priority?: number
  isPublic?: boolean
}) {
  console.log('[DB] Creating task:', data.title)

  const task = await prisma.task.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      type: data.type || 'general',
      payload: data.payload,
      tags: data.tags || [],
      priority: data.priority || 0,
      isPublic: data.isPublic || false,
      status: 'pending',
    },
  })

  console.log('[DB] Task created:', task.id)
  return task
}

export async function updateTask(id: string, data: Partial<Task>) {
  console.log('[DB] Updating task:', id)

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      type: data.type,
      payload: data.payload,
      tags: data.tags,
      lastRunAt: data.lastRunAt,
      runnerStatus: data.runnerStatus,
      outputText: data.outputText,
      outputRaw: data.outputRaw,
      errorMessage: data.errorMessage,
      priority: data.priority,
      isPublic: data.isPublic,
      executionTime: data.executionTime,
      updatedAt: new Date(),
    },
  })

  console.log('[DB] Task updated:', task.id)
  return task
}

export async function deleteTask(id: string) {
  console.log('[DB] Deleting task:', id)

  await prisma.task.delete({
    where: { id },
  })

  console.log('[DB] Task deleted:', id)
}

// ==================== EVENT OPERATIONS ====================

export async function getEvents(filters?: {
  userId?: string
  taskId?: string
  eventType?: string
  level?: string
  limit?: number
  offset?: number
}) {
  console.log('[DB] Getting events with filters:', filters)

  const where: any = {}

  if (filters?.userId) {
    where.userId = filters.userId
  }

  if (filters?.taskId) {
    where.taskId = filters.taskId
  }

  if (filters?.eventType) {
    where.eventType = filters.eventType
  }

  if (filters?.level) {
    where.level = filters.level
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  console.log(`[DB] Found ${events.length} events`)
  return events
}

export async function createEvent(data: {
  userId?: string
  taskId?: string
  eventType: string
  data?: any
  level?: string
}) {
  console.log('[DB] Creating event:', data.eventType)

  const event = await prisma.event.create({
    data: {
      userId: data.userId,
      taskId: data.taskId,
      eventType: data.eventType,
      data: data.data,
      level: data.level || 'info',
    },
  })

  console.log('[DB] Event created:', event.id)
  return event
}

// ==================== SETTINGS OPERATIONS ====================

export async function getSettings(userId?: string) {
  console.log('[DB] Getting settings for user:', userId || 'global')

  let settings = await prisma.settings.findUnique({
    where: { userId: userId ?? undefined },
  })

  // Create default settings if not exists
  if (!settings) {
    console.log('[DB] Settings not found, creating defaults')
    settings = await prisma.settings.create({
      data: {
        userId: userId,
        preferences: {},
      },
    })
  }

  console.log('[DB] Settings loaded:', settings.id)
  return settings
}

export async function updateSettings(
  userId: string | undefined,
  data: {
    runnerUrl?: string | null
    runnerToken?: string | null
    preferences?: any
  }
) {
  console.log('[DB] Updating settings for user:', userId || 'global')

  const settings = await prisma.settings.upsert({
    where: { userId: userId ?? undefined },
    update: {
      runnerUrl: data.runnerUrl,
      runnerToken: data.runnerToken,
      preferences: data.preferences,
      updatedAt: new Date(),
    },
    create: {
      userId: userId,
      runnerUrl: data.runnerUrl,
      runnerToken: data.runnerToken,
      preferences: data.preferences || {},
    },
  })

  console.log('[DB] Settings updated:', settings.id)
  return settings
}

// ==================== AUDIT LOG OPERATIONS ====================

export async function createAuditLog(data: {
  userId?: string
  action: string
  resource?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  console.log('[DB] Creating audit log:', data.action)

  const log = await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  })

  console.log('[DB] Audit log created:', log.id)
  return log
}

export async function getAuditLogs(filters?: {
  userId?: string
  action?: string
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (filters?.userId) {
    where.userId = filters.userId
  }

  if (filters?.action) {
    where.action = filters.action
  }

  return await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters?.limit || 100,
    skip: filters?.offset || 0,
  })
}

// ==================== LLM SESSION OPERATIONS ====================

export async function createLLMSession(data: {
  userId?: string
  sessionId: string
  title?: string
  systemPrompt?: string
  metadata?: any
}) {
  console.log('[DB] Creating LLM session:', data.sessionId)

  const session = await prisma.lLMSession.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      title: data.title,
      systemPrompt: data.systemPrompt,
      metadata: data.metadata,
    },
  })

  console.log('[DB] LLM session created:', session.id)
  return session
}

export async function getLLMSession(sessionId: string) {
  return await prisma.lLMSession.findUnique({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
      },
    },
  })
}

export async function addLLMMessage(data: {
  sessionId: string
  role: string
  content: string
  metadata?: any
}) {
  console.log('[DB] Adding LLM message to session:', data.sessionId)

  // Update session lastUsedAt
  await prisma.lLMSession.update({
    where: { sessionId: data.sessionId },
    data: { lastUsedAt: new Date() },
  })

  const message = await prisma.lLMMessage.create({
    data: {
      session: {
        connect: { sessionId: data.sessionId },
      },
      role: data.role,
      content: data.content,
      metadata: data.metadata,
    },
  })

  console.log('[DB] LLM message created:', message.id)
  return message
}

// ==================== SANDBOX FILE OPERATIONS ====================

export async function saveSandboxFile(data: {
  userId?: string
  path: string
  content: string
  mimeType?: string
}) {
  console.log('[DB] Saving sandbox file:', data.path)

  const file = await prisma.sandboxFile.upsert({
    where: {
      userId_path: {
        userId: data.userId || null,
        path: data.path,
      },
    },
    update: {
      content: data.content,
      size: Buffer.byteLength(data.content, 'utf8'),
      mimeType: data.mimeType,
      isDeleted: false,
      updatedAt: new Date(),
    },
    create: {
      userId: data.userId,
      path: data.path,
      content: data.content,
      size: Buffer.byteLength(data.content, 'utf8'),
      mimeType: data.mimeType,
    },
  })

  console.log('[DB] Sandbox file saved:', file.id)
  return file
}

export async function getSandboxFile(userId: string | undefined, path: string) {
  return await prisma.sandboxFile.findUnique({
    where: {
      userId_path: {
        userId: userId || null,
        path,
      },
    },
  })
}

export async function listSandboxFiles(userId?: string) {
  return await prisma.sandboxFile.findMany({
    where: {
      userId: userId,
      isDeleted: false,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function deleteSandboxFile(userId: string | undefined, path: string) {
  console.log('[DB] Deleting sandbox file:', path)

  await prisma.sandboxFile.update({
    where: {
      userId_path: {
        userId: userId || null,
        path,
      },
    },
    data: {
      isDeleted: true,
    },
  })

  console.log('[DB] Sandbox file marked as deleted:', path)
}

// ==================== UTILITY FUNCTIONS ====================

export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ok: true, database: 'connected' }
  } catch (error) {
    console.error('[DB] Health check failed:', error)
    return { ok: false, database: 'disconnected', error }
  }
}

export async function getDatabaseStats() {
  const [
    taskCount,
    eventCount,
    userCount,
    sessionCount,
  ] = await Promise.all([
    prisma.task.count(),
    prisma.event.count(),
    prisma.user.count(),
    prisma.lLMSession.count(),
  ])

  return {
    tasks: taskCount,
    events: eventCount,
    users: userCount,
    sessions: sessionCount,
  }
}

