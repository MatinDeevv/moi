# Starting the Runner

## Quick Start

Open a terminal in `C:\Users\matin\moi` and run:

```bash
python runner.py
```

Or with uvicorn directly:

```bash
uvicorn runner:app --host 0.0.0.0 --port 4000 --reload
```

## What It Does

The runner now has **all endpoints** you need:

### 1. Task Execution
- `POST /run-task` - Runs tasks via LM Studio

### 2. Sandbox (File Management)
- `GET /sandbox/list?path=...` - List files
- `GET /sandbox/read?path=...` - Read file
- `POST /sandbox/write` - Write file
- `POST /sandbox/rename` - Rename file
- `POST /sandbox/delete` - Delete file

### 3. Shell Commands
- `POST /shell` - Execute commands

### 4. Health Check
- `GET /health` - Check if runner is online

## Sandbox Location

**All sandbox operations happen in:**
```
C:\Users\matin\moi\docs\sandbox
```

This is an isolated, safe workspace for:
- Creating/editing files via web UI
- Running shell commands
- Testing scripts

## Testing

1. **Start the runner:**
   ```bash
   python runner.py
   ```

2. **You should see:**
   ```
   INFO:     Started server process
   INFO:     Uvicorn running on http://0.0.0.0:4000
   ```

3. **Test health check:**
   Open browser: `http://localhost:4000/health`
   
   Should return:
   ```json
   {
     "ok": true,
     "runner": "online",
     "lm_endpoint": "http://127.0.0.1:1234/v1/chat/completions",
     "lm_model": "gpt-oss:20b"
   }
   ```

4. **Test sandbox list:**
   `http://localhost:4000/sandbox/list`
   
   Should return:
   ```json
   {
     "ok": true,
     "entries": [
       {"name": "README.md", "type": "file"}
     ]
   }
   ```

## Exposing via ngrok

To make the runner accessible from Vercel:

```bash
ngrok http 4000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and paste it into:
- Project ME Settings tab → Runner URL

## Environment Variables (Optional)

You can customize:

```bash
# LM Studio endpoint
export LM_ENDPOINT=http://127.0.0.1:1234/v1/chat/completions

# LM Studio model
export LM_MODEL=gpt-oss:20b

# Runner port
export RUNNER_PORT=4000

# Log level
export RUNNER_LOG_LEVEL=DEBUG
```

## Troubleshooting

**"Runner returned invalid JSON"**
- ✅ FIXED! All endpoints now return proper JSON

**"Runner URL not configured"**
- Go to Settings tab in web UI
- Set Runner URL to your ngrok URL
- Click Test to verify connection

**"Connection refused"**
- Make sure runner is running: `python runner.py`
- Check it's on port 4000
- Verify ngrok is forwarding to port 4000

**Sandbox files not appearing**
- Check that `C:\Users\matin\moi\docs\sandbox` exists
- Runner creates it automatically on startup
- Add test files manually to verify

## What's Fixed

✅ Sandbox path now points to `C:\Users\matin\moi\docs\sandbox`
✅ All endpoints return proper JSON (no more "invalid JSON" errors)
✅ Shell commands execute in sandbox directory
✅ Comprehensive error handling
✅ Proper logging for debugging

## Next Steps

1. Start the runner: `python runner.py`
2. Start ngrok: `ngrok http 4000`
3. Update Settings with ngrok URL
4. Test Sandbox tab - browse files!
5. Test Shell tab - run commands!

---

**Status: Ready to use!** 🚀

