# 🚀 QUICK START - Project ME v0.2

## ✅ Your app is ready! Here's how to run it:

### **1. Start Local Server**

```bash
cd C:\Users\matin\moi\app
npm run dev
```

### **2. Open Browser**

Go to: **http://localhost:3000**

### **3. You'll See:**
- 🌙 **Dark mode dashboard**
- 📋 **Tasks tab** (empty at first)
- ➕ **Create Task tab**
- 📊 **Events tab**
- 🔧 **Diagnostics tab** ← Check this first!

---

## 🎯 First Steps

### **1. Check Diagnostics** (Recommended)

1. Click "🔧 Diagnostics" tab
2. Look for green ✅ checkmarks:
   - ✅ Health Endpoint
   - ✅ Tasks API
   - ✅ Events API
   - ⚠️ Remote Runner (not configured yet - optional)
3. If all green → You're ready!

### **2. Create Your First Task**

1. Click "➕ Create Task" tab
2. Fill in:
   - **Title**: "My first task" (required)
   - **Type**: Select "generic_llm" or "shell"
   - **Payload**: Leave the example JSON or customize
   - **Tags**: Optional (e.g., "test, demo")
3. Click "Create Task"
4. ✅ You'll see "Task created successfully!"

### **3. View Your Task**

1. Click "📋 Tasks" tab
2. You'll see your task with:
   - Status badge (pending/running/completed/failed)
   - Created timestamp
   - Click "View Details" for full info

### **4. View Events**

1. Click "📊 Events" tab
2. You'll see `task_created` event

---

## 🏃 Run a Task (Optional - Needs Runner)

### **Without Runner**
Tasks will stay in "pending" status. This is fine for testing the UI!

### **With Runner** (Advanced)

#### **Option A: Skip for now**
Just test the UI. Tasks will remain pending.

#### **Option B: Set up runner**

1. **Create `.env.local` in `app/` folder:**
   ```env
   RUNNER_BASE_URL=https://your-ngrok-url.ngrok.io
   ```

2. **On your PC, create a simple runner** (Python example):
   ```python
   # runner.py
   from flask import Flask, request, jsonify
   
   app = Flask(__name__)
   
   @app.route('/run-task', methods=['POST'])
   def run_task():
       task = request.json
       print(f"Running task: {task['taskId']}")
       
       # Do your work here...
       
       return jsonify({
           "status": "completed",
           "result": {"message": "Task done!"}
       })
   
   if __name__ == '__main__':
       app.run(port=5000)
   ```

3. **Run it:**
   ```bash
   python runner.py
   ```

4. **Expose with ngrok:**
   ```bash
   ngrok http 5000
   ```

5. **Copy ngrok URL to `.env.local`**

6. **Restart dev server**

7. **Now click "▶ Run Next Task"** → It works!

---

## 🎨 What You Have

### **Working Features** ✅
- Dark mode UI throughout
- Create tasks via form
- View all tasks with filtering
- Task details modal
- Events log
- Diagnostics panel
- Heavy logging (check console F12)
- Error handling

### **Working API Routes** ✅
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/run` - Run task
- `GET /api/events` - List events
- `GET /api/health` - Health check

### **MartinDB Storage** ✅
- Tasks stored in `app/data/tasks.json`
- Events stored in `app/data/events.json`
- Auto-creates files if missing
- Survives server restarts (locally)
- Will reset on Vercel redeploy (expected)

---

## 🔍 Debugging

### **Check Browser Console** (F12)
- All client actions logged with prefixes
- `[Client]` - API calls
- `[TaskList]` - Task loading
- `[CreateTaskForm]` - Task creation

### **Check Server Terminal**
- All API requests logged
- `[MartinDB]` - Database ops
- `[API/tasks]` - Task endpoints
- `[API/events]` - Event endpoints
- `[Runner]` - Runner calls (if configured)

### **Check Diagnostics Tab**
- Quick health check
- Shows what's working (green ✅)
- Shows what's broken (red ❌)

---

## 🚀 Deploy to Vercel

When you're ready:

```bash
# Already pushed to GitHub
# Vercel will auto-detect and deploy
```

Then set `RUNNER_BASE_URL` in Vercel dashboard.

---

## ✅ You're Done!

Your app is:
- ✅ Built with no errors
- ✅ Running locally
- ✅ Dark mode enabled
- ✅ Fully functional
- ✅ Ready to use

**Enjoy your automation dashboard! 🎉**

---

**Need help?** Check:
- `IMPLEMENTATION_COMPLETE.md` - Full documentation
- `READY_FOR_DEPLOYMENT.md` - Deployment guide
- Browser console (F12) - Live logs
- Server terminal - API logs

