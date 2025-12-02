# Project ME - Quick Start Checklist

## ✅ Pre-Flight Checklist

Before using Sandbox or Shell features, make sure:

### 1. Runner is Running

Open a terminal and start the runner:

```bash
cd C:\Users\matin\moi
python runner.py
```

**Expected output:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:4000
```

**Test it works:**
Open browser to: `http://localhost:4000/health`

Should see:
```json
{
  "ok": true,
  "runner": "online"
}
```

---

### 2. Expose Runner via ngrok

In a **second terminal**:

```bash
ngrok http 4000
```

**Copy the HTTPS URL** from ngrok output:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:4000
            ^^^^^^^^^^^^^^^^^^^^^^^^
            Copy this URL
```

---

### 3. Configure Settings in Web UI

1. Go to your deployed Project ME site (or `localhost:3000` if running locally)
2. Click **Settings** tab in the top navigation
3. Paste your ngrok URL into **Runner URL** field
   - Example: `https://abc123.ngrok.io`
   - **Do NOT include trailing slash**
4. (Optional) Set a **Runner Token** if you want auth
5. Click **Test** button - should say "Runner online"
6. Click **Save**

**Screenshot of what Settings should look like:**
```
Runner URL:    https://abc123.ngrok.io
Runner Token:  [optional]
               
               [Test]  [Save]
               
Status: ✅ Runner online
```

---

### 4. Verify Sandbox Works

1. Click **Sandbox** tab
2. Should see: `README.md` file
3. Click it → content loads
4. Try creating a new file → works!

**If you see errors:**

❌ **"Runner URL not configured"**
→ Go to Settings tab and configure runner URL (step 3)

❌ **"Runner returned invalid JSON"**
→ Make sure runner is running (`python runner.py`)
→ Check ngrok is forwarding to port 4000

❌ **"Connection refused"**
→ Runner isn't running - start it with `python runner.py`

---

### 5. Test Shell (Dev Mode Only)

1. Toggle to **Dev** mode (top right)
2. Click **Shell** tab
3. Type: `dir` (Windows) or `ls` (Linux/Mac)
4. Press Enter
5. Should see files in sandbox directory

---

## 🔧 Troubleshooting

### Error: "Runner returned invalid JSON"

**Cause:** Runner endpoint didn't return proper JSON

**Fix:**
1. Make sure you're running the latest `runner.py`:
   ```bash
   git pull origin main
   python runner.py
   ```

2. Test the endpoint directly:
   ```bash
   curl http://localhost:4000/sandbox/list
   ```
   
   Should return valid JSON like:
   ```json
   {"ok":true,"entries":[{"name":"README.md","type":"file"}]}
   ```

---

### Error: "Runner URL not configured"

**Cause:** You haven't set the runner URL in Settings yet

**Fix:**
1. Go to Settings tab
2. Paste your ngrok URL
3. Click Test, then Save

---

### Error: "Failed to load resource: 500"

**Cause:** API route can't reach runner

**Fix:**
1. Check runner is running: `python runner.py`
2. Check ngrok is running: `ngrok http 4000`
3. Verify ngrok URL is correct in Settings
4. Click Test in Settings to verify connection

---

## 📋 Daily Workflow

Every time you want to use Project ME:

1. **Start runner:** `python runner.py` (Terminal 1)
2. **Start ngrok:** `ngrok http 4000` (Terminal 2)
3. **Copy ngrok URL** (it changes every time)
4. **Update Settings** in web UI with new URL
5. **Start using** Sandbox/Shell/Tasks

---

## 🎯 Quick Test

Run this to verify everything works:

### Terminal 1:
```bash
cd C:\Users\matin\moi
python runner.py
```

### Terminal 2:
```bash
ngrok http 4000
```

### Browser:
1. Visit `http://localhost:4000/health` → Should work
2. Copy ngrok URL from Terminal 2
3. Go to your Project ME site → Settings tab
4. Paste ngrok URL → Test → Save
5. Go to Sandbox tab → Should see README.md

✅ **If all these work, you're ready!**

---

## 💡 Pro Tips

- **Keep terminals open** - Don't close runner or ngrok
- **Bookmark ngrok dashboard** - `http://localhost:4040` to see requests
- **Use paid ngrok** - Get a static domain (no more URL changes!)
- **Add runner token** - For extra security, set `RUNNER_TOKEN` env var
- **Check logs** - Runner prints useful debug info

---

## 🚀 Ready!

Once you complete the checklist:
- ✅ Sandbox tab works
- ✅ Shell tab works (Dev mode)
- ✅ Tasks can run via runner
- ✅ Settings persist across sessions

**Happy automating!** 🎉

