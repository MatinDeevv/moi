# Project ME - Complete Startup Guide

## 🚀 Quick Start (3 Options)

### Option 1: CLI Mode (Original)
```bash
python main.py
```
Use the interactive menu to create and run tasks.

### Option 2: API Server Only
```bash
python main.py --api
```
Or use the batch file:
```bash
start_api.bat
```
- API runs at: http://localhost:8000
- API docs at: http://localhost:8000/docs

### Option 3: Full Web UI (API + Frontend)

**Step 1 - Start API Server (Terminal 1):**
```bash
start_api.bat
```
Or manually:
```bash
python main.py --api
```

**Step 2 - Start Web UI (Terminal 2):**
```bash
start_web.bat
```
Or manually:
```bash
cd app
npm install  # first time only
npm run dev
```

**Step 3 - Open Browser:**
- Web UI: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## 📦 First-Time Setup

### 1. Install Python Dependencies
```bash
# Create virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies (for Web UI only)
```bash
cd app
npm install
cd ..
```

### 3. Verify Installation
```bash
# Test CLI
python main.py

# Test API
python main.py --api
# Then visit http://localhost:8000/health in browser

# Test Web UI (after starting API)
cd app
npm run dev
# Then visit http://localhost:3000 in browser
```

---

## 📁 Project Structure

```
moi/
├── main.py                    # CLI entrypoint (supports --api flag)
├── api_server.py              # FastAPI server
├── requirements.txt           # Python dependencies
├── start_api.bat              # Windows: Start API server
├── start_web.bat              # Windows: Start Web UI
│
├── src/                       # Core business logic
│   ├── agent.py               # Task orchestrator
│   ├── tasks.py               # Task management
│   ├── memory.py              # Event logging & sessions
│   ├── llm_client.py          # LM Studio wrapper
│   ├── config.py              # Configuration
│   └── tools/                 # Tool modules
│       ├── shell_tools.py
│       ├── fs_tools.py
│       └── __init__.py
│
├── logs/                      # Persistent storage
│   ├── tasks.jsonl            # All tasks
│   └── events.jsonl           # All events
│
├── docs/                      # Documentation
│   ├── API_WEB_UI_GUIDE.md
│   ├── QUICKSTART_v0.2.md
│   └── ...
│
└── app/                       # Next.js Web UI
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    ├── app/
    │   ├── page.tsx           # Main dashboard
    │   ├── layout.tsx         # Root layout
    │   └── components/
    │       ├── TaskList.tsx
    │       ├── CreateTaskForm.tsx
    │       ├── RunTaskButton.tsx
    │       └── EventList.tsx
    └── lib/
        └── api.ts             # API client
```

---

## 🎯 Common Workflows

### Workflow 1: Simple CLI Task Execution
```bash
python main.py
# Choose: 1 (Create task) → 1 (Shell) → Enter command
# Choose: 2 (Run next task) → y (confirm)
```

### Workflow 2: LLM Session (Conversational)
```bash
python main.py
# Choose: 9 (Create LLM session task)
# Enter session ID: "my-chat"
# Enter message: "Hello!"
# Choose: 2 (Run next task)
# Choose: 9 again to continue conversation
```

### Workflow 3: Web UI Task Management
1. Start API: `start_api.bat`
2. Start Web: `start_web.bat`
3. Open http://localhost:3000
4. Click "➕ Create Task" tab
5. Select task type, fill payload
6. Click "Create Task"
7. Go back to "📋 Tasks" tab
8. Click "▶ Run Next Task"

### Workflow 4: API-Only Automation
```python
import requests

# Create task
response = requests.post('http://localhost:8000/tasks', json={
    "type": "shell",
    "payload": {"command": "echo Hello"},
    "title": "Test task"
})
task_id = response.json()['task']['id']

# Run task
response = requests.post('http://localhost:8000/tasks/run-next')
result = response.json()
print(result)
```

---

## 🔧 Configuration

### LM Studio Setup (Required for LLM tasks)

1. Download and install LM Studio: https://lmstudio.ai/
2. Load a model (e.g., "TheBloke/Llama-2-7B-Chat-GGUF")
3. Start the server (Server tab → Start Server)
4. Default endpoint: `http://localhost:1234/v1`

**Configure in `src/config.py`:**
```python
LLM_BASE_URL = "http://localhost:1234/v1"
LLM_MODEL_NAME = "local-model"
```

### API Server Configuration

Edit `api_server.py` if needed:
```python
# Change port
def start_server(host: str = "0.0.0.0", port: int = 8000):
    # Change to port: int = 8080 for example
```

### Web UI Configuration

Edit `app/lib/api.ts`:
```typescript
// Change API URL
const API_BASE_URL = 'http://localhost:8000';
// Change to different port if needed
```

---

## 🐛 Troubleshooting

### Issue: "No module named 'fastapi'"
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: API server won't start (port in use)
**Solution:**
```bash
# Check what's using port 8000
netstat -ano | findstr :8000

# Kill the process or use a different port
uvicorn api_server:app --port 8001
```

### Issue: Web UI shows "Failed to fetch"
**Solution:**
1. Ensure API server is running: http://localhost:8000/health
2. Check browser console for CORS errors
3. Verify `app/lib/api.ts` has correct URL

### Issue: LLM tasks fail with connection error
**Solution:**
1. Start LM Studio
2. Load a model
3. Start the server (Server tab)
4. Verify endpoint at http://localhost:1234/v1/models

### Issue: Tasks not appearing in Web UI
**Solution:**
1. Click "🔄 Refresh" button
2. Check that `logs/tasks.jsonl` exists
3. Verify API can read the file: http://localhost:8000/tasks

### Issue: npm install fails
**Solution:**
```bash
cd app
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📊 Feature Matrix

| Feature | CLI | API | Web UI |
|---------|-----|-----|--------|
| Create shell tasks | ✅ | ✅ | ✅ |
| Create LLM tasks | ✅ | ✅ | ✅ |
| Run tasks | ✅ | ✅ | ✅ |
| View task details | ✅ | ✅ | ✅ |
| Filter tasks | ✅ | ✅ | ✅ |
| View events | ✅ | ✅ | ✅ |
| LLM sessions | ✅ | ✅ | ⚠️ (coming soon) |
| Real-time updates | ❌ | ❌ | ⚠️ (manual refresh) |

---

## 🎓 Examples

### Example 1: Shell Command Task
```json
{
  "type": "shell",
  "title": "List directory",
  "payload": {
    "command": "dir",
    "cwd": "C:\\Users"
  }
}
```

### Example 2: LLM Query Task
```json
{
  "type": "generic_llm",
  "title": "Ask about Python",
  "payload": {
    "prompt": "What is a decorator in Python?",
    "system_prompt": "You are a Python expert."
  }
}
```

### Example 3: File Read Task
```json
{
  "type": "filesystem",
  "title": "Read config",
  "payload": {
    "operation": "read",
    "filepath": "C:\\Users\\matin\\moi\\src\\config.py"
  }
}
```

### Example 4: Code Analysis Task
```json
{
  "type": "code_analysis",
  "title": "Review main.py",
  "payload": {
    "filepath": "C:\\Users\\matin\\moi\\main.py",
    "question": "What does this file do?"
  }
}
```

### Example 5: LLM Session Task
```json
{
  "type": "llm_session",
  "title": "Chat about project",
  "payload": {
    "session_id": "project-discussion",
    "message": "How can I improve the architecture?",
    "system": "You are a senior software architect."
  },
  "tags": ["session:project-discussion"]
}
```

---

## 🚦 System Status Check

Run this checklist to verify everything works:

**✅ Python Backend:**
```bash
python -c "import requests, fastapi, uvicorn; print('✓ All Python deps installed')"
python main.py  # Should show menu
python -c "import api_server; print('✓ API server imports successfully')"
```

**✅ API Server:**
```bash
# Start in background
python main.py --api
# In another terminal:
curl http://localhost:8000/health
# Should return: {"status":"ok","version":"0.2.0"}
```

**✅ Web UI:**
```bash
cd app
npm run build  # Should complete without errors
npm start      # Should start on port 3000
```

---

## 📝 Development Notes

### Adding a New Task Type

1. Update `src/agent.py` - Add handler in `process_task()`
2. Update `src/tasks.py` - No changes needed (type is just a string)
3. Update `main.py` - Add menu option in `create_task_interactive()`
4. Update `api_server.py` - Add to `valid_types` list
5. Update `app/components/CreateTaskForm.tsx` - Add to `TASK_TYPES`

### Adding a New Tool

1. Create `src/tools/my_tool.py`
2. Implement functions
3. Register in `src/tools/__init__.py`
4. Use in `src/agent.py` task handlers

### Database Migration (JSONL → SQLite)

If you want to migrate from JSONL to SQLite:
1. Create `src/database.py` with SQLAlchemy models
2. Update `TaskStore` to use SQLAlchemy instead of JSONL
3. Write migration script to import existing JSONL data
4. Update all imports

---

## 🔒 Security Considerations

⚠️ **This is a LOCAL development tool. DO NOT expose to the internet without:**

1. **Authentication** - Add API key or OAuth
2. **Input validation** - Sanitize all shell commands
3. **Rate limiting** - Prevent abuse
4. **HTTPS** - Use reverse proxy with SSL
5. **Firewall rules** - Restrict access to localhost only

**For local network access:**
```bash
# Use Tailscale or similar VPN
# Or set up nginx with basic auth:
# nginx.conf:
location /api {
    auth_basic "Project ME";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:8000;
}
```

---

## 📚 Additional Resources

- **Full API Documentation:** http://localhost:8000/docs (when server is running)
- **Phase Documentation:** See `docs/` folder
- **LM Studio Docs:** https://lmstudio.ai/docs
- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com/

---

## 🤝 Contributing

When adding features:
1. Follow existing patterns (thin API wrappers, no business logic in API)
2. Update this guide
3. Add examples
4. Test in CLI, API, and Web UI modes

---

## ✨ What's Next?

**Planned Features:**
- Real-time WebSocket updates
- Task scheduling (cron-like)
- Multi-user support with auth
- Session chat UI in Web
- Desktop automation tools (PyAutoGUI integration)
- Trading/backtesting modules

**Immediate TODOs:**
- [ ] Add unit tests
- [ ] Add logging configuration
- [ ] Improve error handling in Web UI
- [ ] Add task progress indicators
- [ ] Implement task cancellation
- [ ] Add export/import for tasks

---

**Version:** v0.2.0  
**Last Updated:** 2025-12-01  
**Status:** Production-ready for local use

