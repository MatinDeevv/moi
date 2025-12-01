# Deploying Project ME Web UI to Vercel

## ⚠️ Important: Architecture Limitation

**The Web UI can be deployed to Vercel, but the Python FastAPI backend CANNOT.**

### Why?

- **Vercel** is designed for Node.js/Next.js applications
- **Python FastAPI** requires a Python runtime server (not available on Vercel)
- **Vercel serverless functions** only support Node.js, Go, Python (with limitations), and Ruby

## 🏗️ Deployment Options

### Option 1: Deploy Web UI Only to Vercel (Frontend)

**What this means:**
- ✅ Next.js UI hosted on Vercel (fast, global CDN)
- ❌ FastAPI backend runs elsewhere (your PC, VPS, Railway, etc.)

**Requirements:**
1. FastAPI backend must be deployed separately
2. Backend must have a public URL (e.g., `https://your-domain.com`)
3. CORS must be configured to allow Vercel domain

**Steps:**

#### 1. Deploy FastAPI Backend (Choose One)

**Option A: Railway (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from project root (not app folder)
cd C:\Users\matin\moi
railway init
railway up
```

**Option B: Render.com**
1. Push code to GitHub
2. Go to https://render.com
3. Create new "Web Service"
4. Connect GitHub repo
5. Build command: `pip install -r requirements.txt`
6. Start command: `python main.py --api`

**Option C: Your Own VPS**
```bash
# SSH to your VPS
ssh user@your-vps.com

# Clone repo
git clone https://github.com/MatinDeevv/moi.git
cd moi

# Install deps
pip install -r requirements.txt

# Run with systemd or PM2
pm2 start "python main.py --api" --name project-me-api
```

#### 2. Get Your Backend URL

After deploying, you'll get a URL like:
- Railway: `https://project-me-api.railway.app`
- Render: `https://project-me-api.onrender.com`
- VPS: `https://api.yourdomain.com`

#### 3. Update CORS in `api_server.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-vercel-app.vercel.app",  # Add your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4. Deploy Web UI to Vercel

**Via Vercel CLI:**
```bash
cd app
npm install -g vercel
vercel login
vercel
```

**Via Vercel Dashboard:**
1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Set root directory to: `app`
5. Add environment variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-url.com`
6. Deploy!

#### 5. Test

Visit your Vercel URL: `https://your-app.vercel.app`

---

### Option 2: Deploy Everything Locally (No Vercel)

**Best for:**
- Local development only
- Small personal projects
- No need for public access

**Steps:**
```bash
# Terminal 1: API
python main.py --api

# Terminal 2: Web UI
cd app
npm run dev

# Access at http://localhost:3000
```

---

### Option 3: Deploy Both to VPS (Self-Hosted)

**Best for:**
- Full control
- Privacy-focused projects
- Custom domain

**Steps:**

1. **Get a VPS** (DigitalOcean, Linode, Hetzner, etc.)

2. **Install dependencies:**
```bash
sudo apt update
sudo apt install python3 python3-pip nodejs npm nginx
```

3. **Clone and setup:**
```bash
git clone https://github.com/MatinDeevv/moi.git
cd moi

# Backend
pip install -r requirements.txt
pm2 start "python main.py --api" --name api

# Frontend
cd app
npm install
npm run build
pm2 start "npm start" --name web
```

4. **Configure nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
    }
}
```

5. **Get SSL certificate:**
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 Environment Variables for Vercel

In Vercel dashboard, set these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.com` | Your FastAPI backend URL |
| `NODE_ENV` | `production` | Production mode |

---

## 🐛 Troubleshooting Vercel Deployment

### Error: 500 FUNCTION_INVOCATION_FAILED

**Cause:** Next.js trying to access `localhost:8000` which doesn't exist on Vercel

**Fix:**
1. Make sure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables
2. Redeploy: `vercel --prod`

### Error: CORS policy blocking requests

**Cause:** Backend not allowing Vercel domain

**Fix:** Update `api_server.py`:
```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",  # Allow all Vercel apps
],
```

### Error: API requests timeout

**Cause:** Backend is sleeping (free tier on Render/Railway)

**Fix:**
- Upgrade to paid tier
- Use a VPS with constant uptime
- Implement health check pings

---

## 💡 Recommended Setup

**For Personal Use:**
```
Web UI:  Vercel (free tier)
Backend: Railway (free tier with $5 credit)
LLM:     Local (LM Studio on your PC)
```

**For Production:**
```
Web UI:  Vercel (Pro: $20/mo)
Backend: VPS (Hetzner: $5/mo)
LLM:     Hosted API (OpenAI, Anthropic)
```

**For Local Only:**
```
Web UI:  npm run dev (localhost:3000)
Backend: python main.py --api (localhost:8000)
LLM:     LM Studio (localhost:1234)
```

---

## 📝 Current Status

Based on the error you're seeing:

**Problem:** Vercel is trying to run the Next.js app, but it can't connect to the FastAPI backend because:
1. Backend is not deployed to a public URL
2. App is configured to use `localhost:8000` (only works locally)

**Solution:**
1. Deploy FastAPI to Railway/Render/VPS
2. Set `NEXT_PUBLIC_API_URL` in Vercel to your backend URL
3. Redeploy

**OR**

Skip Vercel and run everything locally:
```bash
start_api.bat  # Terminal 1
start_web.bat  # Terminal 2
```

---

## 🚀 Quick Fix for Your Current Error

If you just want to deploy to Vercel:

1. **Deploy backend to Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   cd C:\Users\matin\moi
   railway init
   railway up
   ```

2. **Get Railway URL:** (e.g., `https://project-me.up.railway.app`)

3. **Update Vercel env var:**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://project-me.up.railway.app`
   - Redeploy

4. **Done!** Visit your Vercel URL

---

## ❓ Still Having Issues?

**Check:**
1. Is `NEXT_PUBLIC_API_URL` set in Vercel?
2. Is your backend actually running and accessible?
3. Test backend: `curl https://your-backend.com/health`
4. Check Vercel logs: `vercel logs`
5. Check backend logs

**Need help?** Share:
- Vercel deployment URL
- Backend deployment URL
- Error logs from Vercel dashboard

---

**Last Updated:** December 1, 2025

