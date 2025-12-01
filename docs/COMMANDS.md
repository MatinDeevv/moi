# Project ME v0 - Command Reference Card

## Quick Commands

### Start the System
```powershell
python main.py
```

### Run Tests
```powershell
# Full system test
python test_system.py

# Example usage (requires LM Studio)
python example_usage.py
```

### View Logs and Statistics
```powershell
# View statistics
python helpers.py stats

# View all logs
python helpers.py logs

# View only tasks
python helpers.py logs tasks

# View only events
python helpers.py logs events

# Clear all logs (careful!)
python helpers.py clear
```

### Direct File Access
```powershell
# View tasks
Get-Content logs/tasks.jsonl

# View last 20 events
Get-Content logs/events.jsonl -Tail 20

# Count total tasks
(Get-Content logs/tasks.jsonl | Measure-Object -Line).Lines

# Count total events
(Get-Content logs/events.jsonl | Measure-Object -Line).Lines
```

## Main Menu Options (when running main.py)

```
1 - Create a new task
    1.1 - Shell task (execute PowerShell command)
    1.2 - Generic LLM (ask question to local LLM)
    1.3 - Filesystem (read/write/list files)
    1.4 - Code analysis (analyze code with LLM)

2 - Run next pending task
    (Processes oldest pending task in FIFO order)

3 - View recent tasks
    (Shows last 10 tasks with status)

4 - View recent events
    (Shows last 20 events with details)

5 - List available tools
    (Shows all registered tool functions)

0 - Exit
```

## Task Type Quick Reference

### Shell Task
```python
{
    "type": "shell",
    "payload": {
        "command": "Get-ChildItem",
        "cwd": "C:\\path\\to\\dir"  # optional
    }
}
```

### Generic LLM Task
```python
{
    "type": "generic_llm",
    "payload": {
        "prompt": "What is 2+2?",
        "system_prompt": "You are helpful."  # optional
    }
}
```

### Filesystem Task (Read)
```python
{
    "type": "filesystem",
    "payload": {
        "operation": "read",
        "filepath": "C:\\path\\to\\file.txt"
    }
}
```

### Filesystem Task (Write)
```python
{
    "type": "filesystem",
    "payload": {
        "operation": "write",
        "filepath": "C:\\path\\to\\file.txt",
        "content": "Hello, world!"
    }
}
```

### Filesystem Task (List)
```python
{
    "type": "filesystem",
    "payload": {
        "operation": "list",
        "dirpath": "C:\\path\\to\\directory"
    }
}
```

### Code Analysis Task
```python
{
    "type": "code_analysis",
    "payload": {
        "filepath": "C:\\path\\to\\code.py",
        "question": "What does this code do?"  # optional
    }
}
```

## Programmatic Usage

### Create and Run Task
```python
from tasks import TaskStore
from agent import agent

store = TaskStore()

# Create task
task = store.create_task("shell", {"command": "Get-Date"})

# Run task
result = agent.process_task(task)
print(result)
```

### Query Tasks
```python
from tasks import TaskStore

store = TaskStore()

# Get all tasks
all_tasks = store.load_all_tasks()

# Get next pending task
next_task = store.get_next_pending_task()

# Get specific task
task = store.get_task_by_id("task-id-here")

# Get recent tasks
recent = store.get_recent_tasks(limit=10)
```

### Query Events
```python
from memory import memory

# Get all events
all_events = memory.load_all_events()

# Get events for specific task
task_events = memory.get_events_for_task("task-id")

# Get recent events
recent_events = memory.get_recent_events(limit=50)

# Format events as context
context = memory.format_events_for_context("task-id")
```

### Call Tools Directly
```python
from tools import get_tool

# Get a tool
shell_tool = get_tool("run_shell_command")

# Call it
result = shell_tool(command="Get-Date", task_id="optional-task-id")
print(result)
```

### Use LLM Client
```python
from llm_client import llm

# Simple chat
response = llm.chat(
    messages=[
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "What is 2+2?"}
    ]
)
print(response)

# Get structured plan
plan = llm.get_plan(
    system_prompt="You are a planner.",
    user_prompt="Plan a task to analyze code."
)
print(plan)
```

## Configuration Options (config.py)

```python
# LM Studio settings
LM_STUDIO_BASE_URL = "http://localhost:1234/v1"
LM_STUDIO_MODEL = "gpt-oss:20b"

# LLM parameters
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 2000
PLAN_TEMPERATURE = 0.3
PLAN_MAX_TOKENS = 1500

# Execution limits
SHELL_TIMEOUT_SECONDS = 300
MAX_TOOL_OUTPUT_LENGTH = 10000
```

## Troubleshooting Commands

### Check if LM Studio is running
```powershell
curl http://localhost:1234/v1/models
```

### Check Python version
```powershell
python --version
# Should be 3.10 or higher
```

### Check installed packages
```powershell
pip list | Select-String requests
```

### Verify file structure
```powershell
Get-ChildItem -Recurse -File | Select-Object FullName
```

### Check log file sizes
```powershell
Get-ChildItem logs | Select-Object Name, Length
```

## Common Workflows

### Execute Multiple Commands
```powershell
python main.py
# 1 → 1 → command1 → Enter → Enter
# 1 → 1 → command2 → Enter → Enter
# 1 → 1 → command3 → Enter → Enter
# 2 → y  (run first)
# 2 → y  (run second)
# 2 → y  (run third)
```

### Analyze a Code File
```powershell
python main.py
# 1 → 4 → path/to/code.py → "Explain this code" → Enter
# 2 → y
```

### Batch File Operations
```powershell
python main.py
# 1 → 3 → 4 → C:\some\dir → Enter (list directory)
# 1 → 3 → 1 → C:\some\file.txt → Enter (read file)
# 2 → y  (process list)
# 2 → y  (process read)
```

## Environment Setup

### First Time Setup
```powershell
# Clone/download project
cd C:\Users\matin\moi

# Create virtual environment (optional but recommended)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run tests
python test_system.py
```

### Daily Usage
```powershell
# Activate venv (if using)
.\.venv\Scripts\Activate.ps1

# Start LM Studio (if using LLM tasks)
# ... launch LM Studio app, load model, start server ...

# Run Project ME
python main.py
```

## File Locations

```
C:\Users\matin\moi\
├── logs\tasks.jsonl      ← All tasks
├── logs\events.jsonl     ← All events
├── config.py             ← Edit settings here
├── main.py               ← Run this to start
├── README.md             ← Full documentation
├── QUICKSTART.md         ← Getting started guide
└── IMPLEMENTATION_SUMMARY.md ← System overview
```

## Tips

- **Check logs frequently**: `python helpers.py logs events` shows what's happening
- **Start simple**: Test with shell commands before trying LLM tasks
- **Task IDs**: Copy task IDs from logs to track specific tasks
- **Timeouts**: Increase `SHELL_TIMEOUT_SECONDS` if needed
- **LLM models**: Smaller models = faster responses
- **Backup logs**: Copy `logs/` directory to preserve history

---

**Quick Start**: `python main.py` → Option 1 → Create task → Option 2 → Run it! 🚀

