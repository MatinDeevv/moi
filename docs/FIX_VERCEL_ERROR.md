# 🚨 FIXING VERCEL 500 ERROR - Quick Guide

## The Problem

You're seeing this error:
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

**Root Cause:** The Next.js app on Vercel is trying to connect to `http://localhost:8000` which doesn't exist on Vercel's servers.

---

## ✅ Quick Fix (2 Options)

### Option A: Run Everything Locally (Easiest)

**Don't use Vercel at all. Run on your PC:**

```bash
# Terminal 1
start_api.bat

# Terminal 2
start_web.bat

# Open http://localhost:3000
```

**Done!** Everything works locally without deployment issues.

---

### Option B: Deploy to Production (More Steps)

**Deploy backend and frontend separately:**

#### Step 1: Deploy FastAPI Backend to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Go to project root
cd C:\Users\matin\moi

# Deploy
railway init
railway up
```

You'll get a URL like: `https://project-me-production.up.railway.app`

#### Step 2: Update Backend CORS

Edit `api_server.py` (around line 24):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",  # ADD THIS LINE
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend:
```bash
railway up
```

#### Step 3: Configure Vercel Environment Variable

**Important:** Environment variables in Vercel MUST be set in the dashboard, not in `vercel.json`.

**In Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://project-me-production.up.railway.app` (paste your Railway URL)
   - **Environments:** Check all three boxes (Production, Preview, Development)
6. Click **Save**

**Note:** Variables starting with `NEXT_PUBLIC_` are exposed to the browser and can be used in client-side code.

#### Step 4: Redeploy Vercel

After adding the environment variable, you MUST redeploy:

**Option A - Via Dashboard:**
1. Go to Deployments tab
2. Click the three dots (...) on latest deployment
3. Click "Redeploy"

**Option B - Via CLI:**
```bash
cd app
vercel --prod
```

**Done!** Your app should work now.

---

## 🧪 Testing

**Test Backend:**
```bash
curl https://your-railway-url.railway.app/health
# Should return: {"status":"ok","version":"0.2.0"}
```

**Test Frontend:**
1. Open your Vercel URL: `https://your-app.vercel.app`
2. Open browser DevTools → Network tab
3. Create a task
4. Check if API calls go to Railway URL (not localhost)

---

## 🐛 Still Broken?

**Check:**
1. ✅ Is `NEXT_PUBLIC_API_URL` set in Vercel? (must start with `NEXT_PUBLIC_`)
2. ✅ Is Railway backend running? (test `/health` endpoint)
3. ✅ Did you redeploy Vercel AFTER setting the env var?
4. ✅ Is CORS updated in `api_server.py`?

**View Logs:**
```bash
# Vercel logs
vercel logs

# Railway logs
railway logs
```

---

## 💡 Recommended Approach

**For learning/testing:**
→ Use **Option A** (run locally)

**For sharing with others:**
→ Use **Option B** (deploy to Railway + Vercel)

**For production:**
→ Use a VPS with both frontend and backend

---

## 📊 Cost Breakdown

**Option A (Local):**
- Cost: $0
- Setup time: 2 minutes
- Accessible: Only from your PC

**Option B (Railway + Vercel):**
- Cost: $0 (free tiers)
- Setup time: 15 minutes
- Accessible: Anywhere with internet
- Limits: Railway free tier has usage limits

**Option C (VPS):**
- Cost: ~$5/month
- Setup time: 1 hour
- Accessible: Anywhere
- Limits: None (you control everything)

---

## 🎯 What I Changed

I've already updated your code to fix this:

1. ✅ `app/lib/api.ts` - Now reads `NEXT_PUBLIC_API_URL` env var
2. ✅ `app/next.config.js` - Skips localhost rewrites in production
3. ✅ `app/.env.example` - Template for environment variables
4. ✅ `app/.env.local` - Local development config
5. ✅ `vercel.json` - Vercel deployment config
6. ✅ `railway.json` - Railway deployment config
7. ✅ `Procfile` - For Railway/Render/Heroku

**Your code is ready to deploy!** Just follow the steps above.

---

**Questions?** Check the full guide: [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)

