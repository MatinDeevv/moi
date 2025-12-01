# Project ME v0.2

**Local Automation & Orchestration System**

A powerful, user-in-the-loop automation platform that runs entirely on your local machine, powered by Python and LM Studio.

---

## ✨ What is Project ME?

Project ME is a **local-first automation orchestrator** that combines:
- ✅ **Task Management** - Create, queue, and execute automation tasks
- ✅ **LLM Integration** - Local AI via LM Studio (no cloud APIs)
- ✅ **Multiple Interfaces** - CLI, REST API, and Web UI
- ✅ **Persistent Memory** - JSONL-based storage with full event logging
- ✅ **Session Support** - Conversational LLM sessions with rolling summaries
- ✅ **Tool Ecosystem** - Shell, filesystem, code analysis, and more

**New in v0.2:**
- 🚀 Full REST API (FastAPI)
- 🎨 Modern Web UI (Next.js + TailwindCSS)
- 💬 LLM session support with conversation history
- 📊 Enhanced event tracking and filtering

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (for Web UI only)
- LM Studio (for LLM features)

### Installation

```bash
# Clone the repo
git clone https://github.com/MatinDeevv/moi.git
cd moi

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Install Web UI dependencies
cd app
npm install
cd ..
```

### Running the System

**Option 1: CLI Mode**
```bash
python main.py
```

**Option 2: API Server**
```bash
python main.py --api
# Or: start_api.bat (Windows)
```

**Option 3: Full Stack (API + Web UI)**
```bash
# Terminal 1
start_api.bat

# Terminal 2
start_web.bat

# Open http://localhost:3000
```

📖 **Full Guide:** See [docs/COMPLETE_STARTUP_GUIDE.md](docs/COMPLETE_STARTUP_GUIDE.md)

---

## 🎯 Features

### Task Types
- **Shell** - Execute system commands
- **Generic LLM** - Ask questions to local AI
- **Filesystem** - Read/write/list files
- **Code Analysis** - Analyze code with LLM
- **LLM Session** - Multi-turn conversations with context

### Interfaces

| Feature | CLI | API | Web UI |
|---------|-----|-----|--------|
| Create Tasks | ✅ | ✅ | ✅ |
| Run Tasks | ✅ | ✅ | ✅ |
| View History | ✅ | ✅ | ✅ |
| Filters & Search | ✅ | ✅ | ✅ |
| Real-time Updates | ❌ | ❌ | 🔄 Manual |

### Architecture

```
┌─────────────┐
│   Web UI    │ ← Next.js (http://localhost:3000)
└──────┬──────┘
       │
┌──────▼──────┐
│  REST API   │ ← FastAPI (http://localhost:8000)
└──────┬──────┘
       │
┌──────▼──────────────────┐
│  Business Logic         │ ← Python modules
│  ├── TaskStore          │
│  ├── Agent (orchestrator)│
│  ├── Memory & Events    │
│  └── Tools (shell, fs)  │
└──────┬──────────────────┘
       │
┌──────▼──────┐
│ JSONL Files │ ← logs/tasks.jsonl, logs/events.jsonl
└─────────────┘
```

---

## 📁 Project Structure

```
moi/
├── main.py                 # CLI entrypoint + --api flag
├── api_server.py           # FastAPI server (NEW in v0.2)
├── requirements.txt        # Python dependencies
├── start_api.bat          # Quick-start API server
├── start_web.bat          # Quick-start Web UI
│
├── src/                   # Core business logic
│   ├── agent.py           # Task orchestrator
│   ├── tasks.py           # Task management
│   ├── memory.py          # Events & sessions
│   ├── llm_client.py      # LM Studio wrapper
│   ├── config.py          # Configuration
│   └── tools/             # Tool modules
│
├── logs/                  # Persistent storage (JSONL)
│   ├── tasks.jsonl
│   └── events.jsonl
│
├── docs/                  # Documentation
│   ├── COMPLETE_STARTUP_GUIDE.md
│   ├── API_WEB_UI_GUIDE.md
│   └── PHASE_v0.2_SUMMARY.md
│
└── app/                   # Next.js Web UI (NEW in v0.2)
    ├── app/
    │   ├── page.tsx       # Dashboard
    │   ├── layout.tsx     # Root layout
    │   └── components/    # UI components
    ├── lib/
    │   └── api.ts         # API client
    └── package.json
```

---

## 💡 Examples

### Example 1: Simple Shell Task (CLI)
```bash
python main.py
# Menu: 1 (Create task) → 1 (Shell)
# Command: dir
# Menu: 2 (Run next task)
```

### Example 2: LLM Session (CLI)
```bash
python main.py
# Menu: 9 (Create LLM session)
# Session ID: my-chat
# Message: "Hello, how are you?"
# Menu: 2 (Run task)
# Menu: 9 (Continue conversation)
```

### Example 3: Create Task via API
```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "shell",
    "payload": {"command": "echo Hello World"},
    "title": "Test task"
  }'
```

### Example 4: Web UI Workflow
1. Open http://localhost:3000
2. Click "➕ Create Task"
3. Select "Shell Command"
4. Fill in payload: `{"command": "dir"}`
5. Click "Create Task"
6. Click "▶ Run Next Task"
7. View results in real-time

---

## 🚀 Deployment

### Local Development (Recommended)
```bash
# CLI Mode
python main.py

# Full Stack Mode
start_api.bat  # Terminal 1
start_web.bat  # Terminal 2
```

### Production Deployment

**⚠️ Important:** The Next.js Web UI and Python FastAPI backend must be deployed separately.

**Option 1: Vercel (Web UI) + Railway (Backend)**
```bash
# 1. Deploy backend to Railway
npm install -g @railway/cli
railway login
railway init
railway up

# 2. Deploy frontend to Vercel
cd app
npm install -g vercel
vercel
# Set NEXT_PUBLIC_API_URL to your Railway URL
```

**Option 2: Self-Hosted (VPS)**
- Both frontend and backend on same server
- Use nginx for reverse proxy
- SSL with Let's Encrypt

📖 **Full Deployment Guide:** [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

---

## 🔧 Configuration

### LM Studio Setup (for LLM features)

1. Download LM Studio: https://lmstudio.ai/
2. Load a model (e.g., Llama 2, Mistral, etc.)
3. Start server (Server tab → Start)
4. Verify: http://localhost:1234/v1/models

Edit `src/config.py`:
```python
LLM_BASE_URL = "http://localhost:1234/v1"
LLM_MODEL_NAME = "local-model"
```

### API Port Configuration

Edit `api_server.py`:
```python
def start_server(host: str = "0.0.0.0", port: int = 8000):
    # Change port if needed
```

---

## 📚 Documentation

- **[Complete Startup Guide](docs/COMPLETE_STARTUP_GUIDE.md)** - Installation, setup, troubleshooting
- **[API & Web UI Guide](docs/API_WEB_UI_GUIDE.md)** - API endpoints, Web UI features
- **[Phase v0.2 Summary](docs/PHASE_v0.2_SUMMARY.md)** - What's new in v0.2
- **[Commands Reference](docs/COMMANDS.md)** - CLI commands
- **[Folder Structure](docs/FOLDER_STRUCTURE.md)** - Project organization

**API Documentation (Interactive):**
- Start API server: `python main.py --api`
- Visit: http://localhost:8000/docs

---

## 🐛 Troubleshooting

### Common Issues

**API won't start:**
```bash
pip install -r requirements.txt
python -c "import fastapi, uvicorn; print('OK')"
```

**Web UI can't connect:**
1. Ensure API is running: http://localhost:8000/health
2. Check browser console for errors
3. Verify CORS is enabled in `api_server.py`

**LLM tasks fail:**
1. Start LM Studio
2. Load a model
3. Start the server
4. Test: http://localhost:1234/v1/models

📖 **Full troubleshooting:** [docs/COMPLETE_STARTUP_GUIDE.md#troubleshooting](docs/COMPLETE_STARTUP_GUIDE.md#troubleshooting)

---

## 🛣️ Roadmap

### ✅ Completed (v0.2)
- [x] REST API layer (FastAPI)
- [x] Web UI (Next.js)
- [x] LLM sessions with rolling summaries
- [x] Enhanced task filtering
- [x] Detailed event tracking

### 🔜 Coming Soon (v0.3)
- [ ] Real-time WebSocket updates
- [ ] Task scheduling (cron-like)
- [ ] Session chat UI
- [ ] Authentication & multi-user
- [ ] Desktop automation tools (PyAutoGUI)

### 🔮 Future
- [ ] Plugin system
- [ ] Trading/backtesting modules
- [ ] Browser automation (Playwright)
- [ ] Computer vision tools (OCR, screenshot analysis)

---

## 🔒 Security Note

⚠️ **This is a LOCAL development tool.**

- **DO NOT** expose to the internet without authentication
- **DO NOT** run untrusted shell commands
- **DO** use firewall rules to restrict access
- **DO** consider using VPN (Tailscale) for remote access

---

## 🤝 Contributing

Contributions welcome! When adding features:
1. Follow existing patterns (thin API wrappers, business logic in `src/`)
2. Update documentation
3. Add examples
4. Test in CLI, API, and Web UI modes

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **LM Studio** - Local LLM inference
- **FastAPI** - Modern Python API framework
- **Next.js** - React framework
- **TailwindCSS** - Utility-first CSS

---

## 📞 Links

- **GitHub:** https://github.com/MatinDeevv/moi
- **Documentation:** [docs/](docs/)
- **Issues:** https://github.com/MatinDeevv/moi/issues

---

**Built with ❤️ for local-first automation**

**Version:** v0.2.0  
**Last Updated:** December 1, 2025

