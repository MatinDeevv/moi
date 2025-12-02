# Settings-Driven Runner Configuration - Implementation Summary

## Overview

The Project ME Next.js app now supports **Settings-driven runner configuration**, allowing you to update the runner URL and token from the web UI without redeployment. This is perfect for daily ngrok URL changes.

---

## 1. Database Layer (Prisma)

### Settings Model
**Location:** `app/prisma/schema.prisma`

```prisma
model Settings {
  id          Int      @id @default(1)
  runnerUrl   String?
  runnerToken String?
  updatedAt   DateTime @updatedAt
}
```

**Key design:**
- Single row design (id = 1) - simple and effective
- Both fields nullable - allows incremental configuration
- Auto-updating `updatedAt` timestamp

### DB Helper Functions
**Location:** `app/lib/db.ts`

#### `getSettings(): Promise<Settings>`
- Loads the Settings row (id = 1)
- If not found, creates a default row with null values
- Logs masked token status: `runnerToken=***set***` or `null`

#### `updateSettings(partial): Promise<Settings>`
- Updates only provided fields
- Uses Prisma `upsert` to handle missing row gracefully
- Logs changes with masked token values

---

## 2. API Routes

### GET/PUT `/api/settings/runner`
**Location:** `app/app/api/settings/runner/route.ts`

#### GET Behavior:
- Loads settings via `getSettings()`
- Returns JSON: `{ ok: true, data: { runnerUrl, runnerToken: "***" | null, updatedAt } }`
- **Token is masked** - never sends actual token to client

#### PUT Behavior:
- Accepts: `{ runnerUrl?: string | null, runnerToken?: string | null }`
- Validates runnerUrl must start with `http://` or `https://`
- Updates settings via `updateSettings(partial)`
- Returns same masked response as GET

#### Error Handling:
- 400 for invalid JSON or validation failures
- 500 for internal errors
- All errors logged with full stack traces

### GET `/api/settings/runner/test`
**Location:** `app/app/api/settings/runner/test/route.ts`

#### Behavior:
- Loads settings and determines runner URL (settings.runnerUrl || env.RUNNER_BASE_URL)
- Calls `${runnerUrl}/health` with 5-second timeout
- Returns `{ ok: true, data: { reachable: true, runnerInfo } }` on success
- Returns `{ ok: false, error: "..." }` on failure (502 status)

---

## 3. Updated Run-Task API

**Location:** `app/app/api/tasks/[id]/run/route.ts`

### Key Changes:

#### Runner URL Resolution (Priority Order):
1. `settings.runnerUrl` (from Settings UI)
2. `process.env.RUNNER_BASE_URL` (fallback)
3. Error if neither is set: `"Runner is not configured. Set runner URL in Settings."`

#### Runner Token Handling:
- Token = `settings.runnerToken || process.env.RUNNER_TOKEN || null`
- If non-null, adds header: `x-runner-token: <token>`

#### Request to Runner:
```typescript
POST ${runnerBase}/run-task
Headers: {
  "Content-Type": "application/json",
  "x-runner-token": <token if present>
}
Body: {
  taskId, title, description, type, payload, createdAt, metadata
}
```

#### Response Handling:
- Reads raw text first, then attempts JSON parse
- On parse failure: logs error, returns 502 with `"Runner returned invalid JSON"`
- Checks `runnerJson.ok` and `response.ok`
- Maps runner status to task status: `completed`, `running`, `failed`
- Updates task with `lastRunAt`, `runnerStatus`, `status`
- Creates events for `task_run_started`, `task_run_completed`, `task_run_failed`

#### Always Returns JSON:
- Success: `{ ok: true, data: { task, runner } }`
- Error: `{ ok: false, error: "..." }` (with appropriate HTTP status)

---

## 4. Settings UI

**Location:** `app/app/settings/page.tsx`

### Features:

#### Form Fields:
1. **Runner URL** (text input)
   - Placeholder: `https://your-ngrok-url.ngrok.io`
   - Validation help text shown

2. **Runner Token** (password input)
   - Shows placeholder if token already set: `"Token is set (leave empty to keep)"`
   - Only sends new token if user types something
   - Never displays actual token value

#### Buttons:
1. **💾 Save Settings**
   - Calls `PUT /api/settings/runner`
   - Shows success/error messages
   - Clears token field after save

2. **🔌 Test Runner**
   - Calls `GET /api/settings/runner/test`
   - Shows green "✅ Runner online" or red "❌ Runner unreachable"
   - Disabled if no URL configured

3. **🔄 Reload**
   - Refreshes settings from server

#### User Experience:
- Dark mode consistent with rest of app
- Clear success/error feedback
- Token privacy maintained (masked display)
- Last updated timestamp shown
- Helpful info panel explaining how it works

### Navigation:
Added to main app tabs in `app/app/page.tsx`:
- **⚙️ Settings** tab alongside Tasks, Create, Events, Diagnostics

---

## 5. Daily Workflow (ngrok URL changes)

### Old Way (Environment Variable):
1. ngrok URL changes
2. Update `RUNNER_BASE_URL` in Vercel dashboard
3. Redeploy or wait for next deployment
4. 😤 Frustration

### New Way (Settings UI):
1. ngrok URL changes
2. Open web app → Settings tab
3. Paste new ngrok URL
4. Click "Test Runner" to verify
5. Click "Save"
6. ✅ Done! No redeploy needed

---

## 6. Error Surfacing

### When Runner is Misconfigured:

#### No URL Set:
- Run task API returns: `"Runner is not configured. Set runner URL in Settings."`
- Shows clear error in UI
- Settings page displays red warning if test fails

#### Runner Unreachable:
- Test button shows: `"❌ Failed: Failed to reach runner: <error>"`
- Run task API returns: `"Runner execution failed: <error>"`
- Task status set to `failed`
- Event logged: `task_run_failed` with error details

#### Invalid JSON Response:
- API returns: `"Runner returned invalid JSON"`
- Full response logged server-side
- Task marked as `failed`

### Error Logging:
All errors logged with:
- `[API/settings/runner]` prefix for settings operations
- `[API/run-task]` prefix for task execution
- Full stack traces on server
- Client-side console errors with context

---

## 7. Backwards Compatibility

### Environment Variable Fallback:
- `RUNNER_BASE_URL` still works if Settings.runnerUrl is not set
- `RUNNER_TOKEN` still works as fallback
- **Settings always takes priority** when both exist

### Migration Path:
1. Deploy these changes
2. Prisma migration creates Settings table
3. Old env-based setup continues working
4. When ready, set URL in Settings UI
5. Env vars become fallback

---

## 8. Security Notes

### Token Handling:
- Token **never sent to client** (always masked as `"***"`)
- Token stored in database (ensure DB is secure)
- Token transmitted over HTTPS to runner
- Header: `x-runner-token` (standard bearer-style auth)

### Validation:
- Runner URL must start with `http://` or `https://`
- JSON parsing wrapped in try/catch
- All DB operations wrapped in try/catch
- Comprehensive error logging

---

## 9. Testing Checklist

### Before First Use:
1. Run Prisma migration: `npx prisma migrate dev`
2. Or run: `npx prisma generate && npx prisma db push`
3. Verify Settings table created in database

### Testing the Flow:
1. Open app → Settings tab
2. Enter ngrok URL (e.g., `https://abc123.ngrok.io`)
3. (Optional) Enter token if runner requires it
4. Click "Test Runner" - should show green success
5. Click "Save Settings"
6. Go to Tasks tab
7. Create a test task
8. Click "Run Task" button
9. Task should execute via runner
10. Check task status updates to `completed` or `failed`

### Verifying Logs:
**Server logs should show:**
```
[DB] getSettings
[DB] Settings loaded: runnerUrl=***set***, runnerToken=***set***
[API/run-task] POST /api/tasks/[id]/run
[API/run-task] Using runner URL: https://abc123.ngrok.io
[API/run-task] Calling runner at https://abc123.ngrok.io/run-task
[API/run-task] Runner success for task abc123, status=completed
```

---

## 10. Files Modified/Created

### Modified:
- `app/prisma/schema.prisma` - Added Settings model
- `app/lib/db.ts` - Added getSettings, updateSettings
- `app/app/api/tasks/[id]/run/route.ts` - Uses Settings for runner config
- `app/app/page.tsx` - Added Settings tab

### Created:
- `app/app/api/settings/runner/route.ts` - Settings API (GET/PUT)
- `app/app/api/settings/runner/test/route.ts` - Runner test endpoint
- `app/app/settings/page.tsx` - Settings UI component

---

## 11. Next Steps (Optional Enhancements)

1. **Multi-environment support:** Add production/staging runner URLs
2. **Runner health monitoring:** Periodic background checks
3. **Audit log:** Track who changed settings and when
4. **Token encryption:** Encrypt token at rest in database
5. **API key rotation:** Support multiple tokens with expiration

---

**Status:** ✅ Complete and ready to use

You can now paste your daily ngrok URL into the Settings page without touching environment variables or redeploying! 🎉

