/**
 * Database initialization for Vercel serverless environment
 * Creates tables if they don't exist
 */

import prisma from './prisma'

let initialized = false

export async function initializeDatabase() {
  if (initialized) return

  console.log('[DB Init] Initializing database...')

  try {
    // Test connection and create tables if needed
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Task" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "type" TEXT DEFAULT 'general',
        "payload" TEXT,
        "tags" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "lastRunAt" DATETIME,
        "runnerStatus" TEXT
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "taskId" TEXT,
        "eventType" TEXT NOT NULL,
        "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "data" TEXT,
        FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE
      )
    `)

    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Task_createdAt_idx" ON "Task"("createdAt")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Event_taskId_idx" ON "Event"("taskId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Event_eventType_idx" ON "Event"("eventType")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Event_timestamp_idx" ON "Event"("timestamp")`)

    initialized = true
    console.log('[DB Init] Database initialized successfully')
  } catch (error: any) {
    console.error('[DB Init] Error:', error.message)
    // If tables already exist, that's fine
    if (error.message.includes('already exists')) {
      initialized = true
      console.log('[DB Init] Tables already exist')
    } else {
      throw error
    }
  }
}

