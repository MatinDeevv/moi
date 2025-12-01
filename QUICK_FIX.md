# 🎯 Quick Reference: Vercel Deployment

## The 500 Error You're Seeing

**Error:** `500: INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED`

**Cause:** Next.js trying to reach `localhost:8000` on Vercel (doesn't exist)

**Fix:** Set environment variable to point to your deployed backend

---

## ⚡ Two Solutions

### 1️⃣ Local Only (No Vercel) - 2 Minutes

```bash
start_api.bat  # Terminal 1
start_web.bat  # Terminal 2
# Open http://localhost:3000
```

**Use this if:** You just want it to work on your PC

---

### 2️⃣ Deploy to Production - 15 Minutes

**Backend (Railway):**
```bash
npm install -g @railway/cli
railway login
cd C:\Users\matin\moi
railway init
railway up
```

**Frontend (Vercel):**
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`
4. Redeploy: `vercel --prod`

**Use this if:** You want to share with others

---

## 🔍 Verify It Works

**Local:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

**Production:**
```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok"}
```

---

## 📂 Files I Changed

- ✅ `app/lib/api.ts` - Reads env var
- ✅ `app/next.config.js` - No localhost in prod
- ✅ `app/.env.local` - Local config
- ✅ `vercel.json` - Vercel config
- ✅ `railway.json` - Railway config

**All changes are backward compatible!** Local dev still works the same.

---

## 💡 Pro Tip

**For learning/development:**
→ Use local setup (start_api.bat + start_web.bat)

**To share with friends:**
→ Deploy to Railway + Vercel

**For serious projects:**
→ Get a VPS ($5/month)

---

## 📚 Full Guides

- `docs/FIX_VERCEL_ERROR.md` - Step-by-step fix
- `docs/VERCEL_DEPLOYMENT.md` - Complete deployment guide
- `docs/COMPLETE_STARTUP_GUIDE.md` - Everything else

---

**Your code is fixed and ready! Choose your path above.** ✨

