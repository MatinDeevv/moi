# 🚨 TROUBLESHOOTING: "Runner returned invalid JSON"

## The Error

```
Runner returned invalid JSON
[API/run-task] Runner returned non-JSON: <!DOCTYPE html>...
```

**What this means:** Your ngrok URL is returning an HTML error page instead of connecting to your runner.

---

## ✅ Quick Fix (5 steps)

### Step 1: Check if runner is running

Open terminal and check:

```bash
curl http://localhost:4000/health
```

**Expected response:**
```json
{"ok":true,"runner":"online","lm_endpoint":"http://127.0.0.1:1234/v1/chat/completions"}
```

**If you get an error:**
```bash
cd C:\Users\matin\moi
python runner.py
```

Leave this terminal open!

---

### Step 2: Check if ngrok is running

Open a **SECOND terminal** and run:

```bash
ngrok http 4000
```

**You should see:**
```
Session Status                online
Forwarding                    https://abc123.ngrok.io -> http://localhost:4000
                              ^^^^^^^^^^^^^^^^^^^^^^^^
                              THIS is your ngrok URL - copy it!
```

**⚠️ IMPORTANT:** The URL **changes every time** you restart ngrok (free tier)

---

### Step 3: Test ngrok is working

Open browser to the ngrok URL + `/health`:

```
https://YOUR-ID.ngrok.io/health
```

**Should return:**
```json
{"ok":true,"runner":"online",...}
```

**If you see ngrok HTML page instead:**
- ❌ Wrong URL copied
- ❌ ngrok not running
- ❌ ngrok tunnel expired (restart ngrok)

---

### Step 4: Update Settings in Project ME

1. Go to your Project ME site
2. Click **Settings** tab
3. Paste the ngrok URL:
   - ✅ Correct: `https://abc123.ngrok.io`
   - ❌ Wrong: `https://abc123.ngrok.io/` (no trailing slash!)
   - ❌ Wrong: `http://abc123.ngrok.io` (must be HTTPS!)
4. Click **Test** button
5. Should say "✅ Runner online"
6. Click **Save**

---

### Step 5: Run your task

Now try running a task - should work!

---

## 🔍 Why This Happens

### Cause 1: ngrok tunnel expired

**Free ngrok tunnels expire** when you close ngrok or restart your computer.

**Solution:**
- Restart ngrok: `ngrok http 4000`
- Copy the **new URL**
- Update Settings with new URL

### Cause 2: Runner not running

The runner might have crashed or you closed the terminal.

**Solution:**
```bash
cd C:\Users\matin\moi
python runner.py
```

### Cause 3: Wrong URL in Settings

You might have copied the wrong URL or included extra characters.

**Check:**
- URL must start with `https://`
- URL must end with `.ngrok.io` (no path, no trailing slash)
- Example: `https://abc123.ngrok.io` ✅
- NOT: `https://abc123.ngrok.io/` ❌
- NOT: `http://abc123.ngrok.io` ❌

---

## 🎯 Pro Solution: Static ngrok URL

**Problem:** Free ngrok URLs change on every restart

**Solution:** Get a static domain

### Option 1: ngrok Paid Plan ($8/month)

```bash
ngrok http 4000 --domain=your-static-name.ngrok.app
```

Benefits:
- URL never changes
- Set it once in Settings, forget about it
- No need to update Settings every day

### Option 2: Use a different tunnel service

Alternatives:
- **localhost.run** (free, static-ish)
- **Cloudflare Tunnel** (free, more setup)
- **Tailscale** (free, private network)

---

## 🧪 Testing Your Setup

Run this diagnostic script:

```bash
cd C:\Users\matin\moi
diagnose.bat
```

It will check:
- ✓ Python installed
- ✓ runner.py exists
- ✓ Runner responding on port 4000
- ✓ Runner health check passes

---

## 📋 Daily Workflow (Until You Get Static URL)

**Every morning / whenever you want to use Project ME:**

1. **Terminal 1:**
   ```bash
   cd C:\Users\matin\moi
   python runner.py
   ```

2. **Terminal 2:**
   ```bash
   ngrok http 4000
   ```

3. **Copy ngrok URL** from Terminal 2

4. **Update Settings** in Project ME web UI

5. **Start using** Tasks/Sandbox/Shell

**Keep both terminals open** while using Project ME!

---

## 🎬 Video Tutorial

Can't figure it out? Here's the exact sequence:

1. Open Terminal 1 → `cd C:\Users\matin\moi` → `python runner.py`
2. See `Uvicorn running on http://0.0.0.0:4000` ✅
3. Open Terminal 2 → `ngrok http 4000`
4. See `Forwarding https://abc123.ngrok.io` ✅
5. Copy URL: `https://abc123.ngrok.io`
6. Open Project ME → Settings tab
7. Paste URL → Test → Save
8. Go to Tasks → Run a task
9. Works! ✅

---

## ❓ Still Not Working?

### Check ngrok dashboard

Open: `http://localhost:4040`

This shows:
- All requests going through ngrok
- If requests are reaching the runner
- Error responses

### Check runner logs

The terminal running `python runner.py` shows:
- Incoming requests
- Errors
- Which endpoints are being called

### Common mistakes

1. **Trailing slash in URL**
   - Wrong: `https://abc123.ngrok.io/`
   - Right: `https://abc123.ngrok.io`

2. **Using HTTP instead of HTTPS**
   - Wrong: `http://abc123.ngrok.io`
   - Right: `https://abc123.ngrok.io`

3. **Old/expired ngrok URL**
   - ngrok free tier changes URLs on restart
   - Must update Settings with new URL each time

4. **Runner not running**
   - Check Terminal 1 is still open
   - Should show `Uvicorn running...`

5. **ngrok not running**
   - Check Terminal 2 is still open
   - Should show `Forwarding https://...`

---

## 🎉 Success Checklist

- [ ] Terminal 1 running: `python runner.py`
- [ ] Terminal 2 running: `ngrok http 4000`
- [ ] Copied HTTPS URL from ngrok (no trailing slash)
- [ ] Pasted URL in Settings
- [ ] Clicked Test → shows "Runner online"
- [ ] Clicked Save
- [ ] Ran a task → works!

**If all checked, you're good to go!**

---

## 💡 Reminder

**The ngrok URL changes every time you restart ngrok (free tier)**

So if you:
- Restart your computer
- Close ngrok
- Lose internet connection

You need to:
1. Restart ngrok
2. Copy the new URL
3. Update Settings

**This is why a paid ngrok plan is worth it if you use this daily!**

