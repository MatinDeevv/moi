# Project ME v0.2 - API & Web UI Layer

## Overview

Phase v0.2 now includes a full-stack web interface:
- **FastAPI backend** (`api_server.py`) - RESTful API wrapping existing business logic
- **Next.js frontend** (`app/`) - Modern web dashboard

Both layers work alongside the existing CLI without breaking backward compatibility.

---

## Quick Start Guide

### Option 1: CLI Mode (Original)

```bash
python main.py
```

Launches the interactive CLI menu as before.

### Option 2: API Server Mode (New)

```bash
python main.py --api
```

Starts FastAPI server on http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Option 3: Web UI Mode (New)

**Terminal 1 - Start API:**
```bash
python main.py --api
```

**Terminal 2 - Start Web UI:**
```bash
cd app
npm install  # first time only
npm run dev
```

Access dashboard at: http://localhost:3000

---

## API Endpoints

### Health
- `GET /health` → `{"status": "ok", "version": "0.2.0"}`

### Tasks
- `GET /tasks?limit=50&status=pending&task_type=shell&tag=urgent`
  - Returns: `{tasks: [...], count: N}`
- `GET /tasks/{task_id}`
  - Returns: `{task: {...}, events: [...]}`
- `POST /tasks`
  - Body: `{title?, type, payload, tags?}`
  - Returns: `{success: true, task: {...}}`
- `POST /tasks/run-next`
  - Returns: `{success: true, task_id, task, result}`

### Events
- `GET /events?limit=100&task_id=...&event_type=...`
  - Returns: `{events: [...], count: N}`

### Sessions (v0.2)
- `GET /sessions`
  - Returns: `{sessions: ["session-1", ...], count: N}`
- `GET /sessions/{session_id}?limit=10`
  - Returns: `{session_id, messages: [...], summary, message_count}`

---

## Architecture

```
┌─────────────────┐
│   Web Browser   │  http://localhost:3000
└────────┬────────┘
         │ HTTP (fetch)
         ▼
┌─────────────────┐
│   Next.js App   │  React, TypeScript, Tailwind
└────────┬────────┘
         │ HTTP/JSON
         ▼
┌─────────────────┐
│  FastAPI Server │  http://localhost:8000
└────────┬────────┘
         │ Direct imports
         ▼
┌─────────────────────────────────────────┐
│  Existing Business Logic                │
│  ├── tasks.py (TaskStore)               │
│  ├── agent.py (process_task)            │
│  ├── memory.py (events, sessions)       │
│  └── tools/ (shell, fs, etc.)           │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  JSONL Storage  │  logs/tasks.jsonl, logs/events.jsonl
└─────────────────┘
```

### Key Design Principles

1. **Zero Business Logic in API Layer**
   - `api_server.py` is thin wrappers only
   - All logic delegated to existing modules

2. **Backward Compatible**
   - CLI mode (`main.py`) unchanged
   - All JSONL files shared between CLI and API

3. **Stateless API**
   - No in-memory state
   - All state in JSONL files (same as CLI)

4. **CORS Enabled**
   - Allows Next.js (localhost:3000) to call API (localhost:8000)

---

## Web UI Features

### 1. Task Dashboard
- **List View**: Paginated table of all tasks
- **Filters**: Status, type, tag, limit
- **Details Modal**: Click any task to see full details + events
- **Status Badges**: Color-coded (pending=yellow, done=green, failed=red)

### 2. Create Task Form
- **Task Type Selector**: Visual buttons for each type
- **Example Payloads**: Auto-filled JSON examples
- **Validation**: Client-side JSON parsing
- **Tags Support**: Comma-separated input

### 3. Run Next Task
- **One-Click Execution**: Big green button
- **Real-time Feedback**: Shows result or error immediately
- **Auto-Refresh**: Task list updates after execution

### 4. Events Viewer
- **Timeline View**: All events chronologically
- **Filters**: Task ID, event type, limit
- **Expandable Data**: Click to see full event payload

---

## File Structure (New Files)

```
moi/
├── api_server.py              # FastAPI server (NEW)
├── main.py                    # Updated with --api flag
├── requirements.txt           # Updated with fastapi, uvicorn
└── app/                       # Next.js application (NEW)
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .gitignore
    ├── README.md
    ├── app/
    │   ├── layout.tsx         # Root layout
    │   ├── page.tsx           # Main dashboard
    │   ├── globals.css        # Tailwind styles
    │   └── components/
    │       ├── TaskList.tsx
    │       ├── CreateTaskForm.tsx
    │       ├── RunTaskButton.tsx
    │       └── EventList.tsx
    └── lib/
        └── api.ts             # API client functions
```

---

## Installation

### Python Backend (Updated)

```bash
pip install -r requirements.txt
```

New dependencies:
- `fastapi==0.104.1`
- `uvicorn==0.24.0`
- `pydantic==2.5.2`

### Next.js Frontend (New)

```bash
cd app
npm install
```

Dependencies:
- `next@14.0.4`
- `react@18.2.0`
- `typescript@5.3.3`
- `tailwindcss@3.3.6`

---

## Usage Examples

### Example 1: Create a Task via API

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "shell",
    "title": "List files",
    "payload": {"command": "dir"},
    "tags": ["test"]
  }'
```

### Example 2: Run Next Task via API

```bash
curl -X POST http://localhost:8000/tasks/run-next
```

### Example 3: Get All Events for a Task

```bash
curl http://localhost:8000/events?task_id=abc123
```

---

## Development Workflow

### Typical Workflow

1. **Start API server:**
   ```bash
   python main.py --api
   ```

2. **Start Next.js dev server (separate terminal):**
   ```bash
   cd app
   npm run dev
   ```

3. **Open browser:** http://localhost:3000

4. **Make changes:**
   - Python changes: API auto-reloads (uvicorn --reload)
   - Next.js changes: UI auto-reloads (webpack HMR)

### Testing the API

Interactive docs at: http://localhost:8000/docs (Swagger UI)

### Building for Production

**API:**
```bash
python main.py --api
# Or with custom settings:
# uvicorn api_server:app --host 0.0.0.0 --port 8000
```

**Web UI:**
```bash
cd app
npm run build
npm start
```

---

## Integration with Existing Features

### CLI and API Can Run Simultaneously

- CLI reads/writes to `logs/tasks.jsonl`
- API reads/writes to `logs/tasks.jsonl`
- Both use the same `TaskStore` class
- File locking handled by JSONL append-only writes

### LLM Sessions (v0.2)

- Session messages stored as events
- API exposes `/sessions` endpoints
- UI can display conversational history
- Future: Add session chat UI in Next.js

### Agent Execution

- `POST /tasks/run-next` calls `agent.process_task()`
- Same execution flow as CLI's "Run next task"
- All tool calls, LLM interactions logged to events

---

## Security Notes

⚠️ **This is a LOCAL-ONLY system:**

- API server binds to `0.0.0.0:8000` (all interfaces)
- No authentication/authorization
- No rate limiting
- **DO NOT expose to public internet**

For local network access only, consider:
- Firewall rules
- VPN/Tailscale
- Reverse proxy with auth (nginx, Caddy)

---

## Troubleshooting

### API server won't start

```bash
# Check if port 8000 is already in use
netstat -ano | findstr :8000

# Try a different port
uvicorn api_server:app --port 8001
```

### Web UI can't connect to API

1. Make sure API is running: http://localhost:8000/health
2. Check browser console for CORS errors
3. Verify Next.js is using correct API URL in `lib/api.ts`

### Tasks not showing in UI but exist in CLI

- Click "Refresh" button
- Check browser network tab for failed requests
- Verify `logs/tasks.jsonl` is readable

---

## Next Steps (Future Enhancements)

1. **WebSocket Support**
   - Real-time task updates
   - Live event streaming

2. **Session Chat UI**
   - Dedicated page for LLM sessions
   - Chat interface for back-and-forth conversations

3. **Authentication**
   - Simple token-based auth
   - Multi-user support

4. **Task Scheduling**
   - Cron-like task scheduling
   - Recurring task support

5. **Metrics Dashboard**
   - Task success/failure rates
   - Execution time charts
   - Event type distribution

---

## Summary

**What Changed:**
- Added `api_server.py` - FastAPI wrapper
- Added `app/` - Next.js web UI
- Modified `main.py` - Added `--api` flag
- Updated `requirements.txt` - Added FastAPI deps

**What Stayed the Same:**
- All business logic (tasks.py, agent.py, memory.py, tools/)
- JSONL storage format
- CLI functionality
- Task execution flow

**Migration Path:**
- Existing CLI users: No changes needed
- New web users: Install npm deps, run both servers
- API-only users: Just use `--api` flag, ignore Next.js

The system is now a hybrid CLI/API/Web application with full backward compatibility.

