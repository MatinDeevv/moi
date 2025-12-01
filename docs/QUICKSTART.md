# Project ME v0 - Quick Start Guide

## Prerequisites

1. **Python 3.10+** installed
2. **LM Studio** installed and running with a model loaded
3. Virtual environment recommended

## Step-by-Step Setup

### 1. Install Dependencies

```powershell
# If not already in virtual environment
# python -m venv .venv
# .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 2. Start LM Studio

1. Launch LM Studio application
2. Load a compatible model (e.g., any chat model like Llama, Mistral, etc.)
3. Click "Start Server" in the Developer tab
4. Verify it's running at `http://localhost:1234` (default)
5. Note: You can test with `curl http://localhost:1234/v1/models` in a terminal

### 3. Run Project ME

```powershell
python main.py
```

You should see:
```
============================================================
 PROJECT ME v0 - Local Automation & Orchestration
============================================================
 Stack: Python + LM Studio (local LLM)
 Mode: User-in-the-loop (single-step execution)
============================================================

Main Menu:
  1. Create a new task
  2. Run next pending task
  3. View recent tasks
  4. View recent events
  5. List available tools
  0. Exit
```

## First Test - Shell Command

Let's run a simple test to verify everything works:

1. Run `python main.py`
2. Choose `1` (Create a new task)
3. Choose `1` (shell task)
4. Enter command: `Get-Date`
5. Press Enter for working directory (use current)
6. You'll see: "✓ Shell task created with ID: ..."
7. Choose `2` (Run next pending task)
8. Choose `y` to confirm
9. You should see the current date/time output!

## Second Test - LLM Query

Test the LM Studio integration:

1. From main menu, choose `1` (Create a new task)
2. Choose `2` (generic_llm)
3. Enter prompt: `What is 2+2? Answer in one sentence.`
4. Press Enter for default system prompt
5. Choose `2` (Run next pending task)
6. Choose `y` to confirm
7. You should see the LLM's response!

## Third Test - Filesystem

Read the README file:

1. From main menu, choose `1` (Create a new task)
2. Choose `3` (filesystem)
3. Choose `1` (read operation)
4. Enter file path: `README.md`
5. Choose `2` (Run next pending task)
6. Choose `y` to confirm
7. You should see the contents of README.md!

## Troubleshooting

### "LM Studio request failed"

**Problem:** Cannot connect to LM Studio
**Solution:**
- Ensure LM Studio is running
- Check the server is started (green button in Developer tab)
- Verify endpoint: `http://localhost:1234/v1`
- Test with: `curl http://localhost:1234/v1/models`

### "No module named 'requests'"

**Problem:** Dependencies not installed
**Solution:**
- Run `pip install -r requirements.txt`
- Ensure you're in the virtual environment if you created one

### Task appears to hang

**Problem:** LLM is slow or timeout
**Solution:**
- LM Studio can be slow depending on your hardware and model size
- Wait up to 2 minutes for response
- Try a smaller/faster model in LM Studio
- Check `logs/events.jsonl` for detailed progress

## Viewing Logs

All activity is logged to `logs/` directory:

```powershell
# View tasks
Get-Content logs/tasks.jsonl

# View events (last 20 lines)
Get-Content logs/events.jsonl -Tail 20

# Or from the main menu:
# Option 3: View recent tasks
# Option 4: View recent events
```

## Next Steps

Once you've verified the basics work:

1. Try creating multiple tasks and running them in sequence
2. Experiment with code analysis (create a simple Python file first)
3. Use filesystem operations to automate file management
4. Check the logs to understand how events are tracked

## Common Use Cases

### Automate repetitive shell commands
Create shell tasks for commands you run frequently

### Code review assistance
Use code_analysis tasks to get LLM insights on your code

### File management
Use filesystem tasks to read/write/organize files

### Information lookup
Use generic_llm tasks to query your local LLM for information

## Safety Reminder

- Project ME v0 executes commands YOU create
- Always review tasks before confirming execution
- All actions are logged to `logs/`
- No autonomous operation - you control every step

Happy automating! 🚀

