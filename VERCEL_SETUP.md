# Vercel Deployment Configuration

## Important: Root Directory Setting

Since the Next.js app is in the `app/` subdirectory, you need to configure Vercel to use it as the root directory.

### Steps to Configure in Vercel Dashboard:

1. Go to your Vercel project settings
2. Click on **Settings** → **General**
3. Scroll down to **Root Directory**
4. Click **Edit**
5. Enter: `app`
6. Click **Save**

### Alternative: Deploy from app/ directory

You can also push only the `app/` directory to a separate repository and deploy that directly.

## Current Structure

```
moi/                    # Repo root
├── app/               # Next.js application (USE THIS AS ROOT)
│   ├── package.json
│   ├── next.config.js
│   ├── app/
│   ├── lib/
│   └── ...
├── src/               # Python backend (ignored)
├── logs/              # Local logs (ignored)
└── vercel.json        # Empty - configure via dashboard
```

## Environment Variables (Optional)

If you want to use a remote runner:

1. Go to **Settings** → **Environment Variables**
2. Add: `RUNNER_BASE_URL` = your ngrok/public URL
3. Select all environments (Production, Preview, Development)
4. Click **Save**

## Build Settings (Should Auto-Detect)

Vercel should automatically detect:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

If not, set them manually in Settings → General → Build & Development Settings.

## Database

The app uses SQLite with Prisma, stored in `/tmp/dev.db` on Vercel's serverless functions. The database:
- Auto-initializes on first request
- Persists for the lifetime of the serverless function
- Resets when the function is recreated (expected behavior)
- No configuration needed

## Troubleshooting

### 404 NOT_FOUND Error
- **Cause:** Root directory not set to `app/`
- **Fix:** Follow steps above to set Root Directory to `app`

### Build Fails
- Check that Root Directory is set to `app/`
- Verify package.json exists in `app/`
- Check build logs for specific errors

### Database Errors
- Database auto-initializes - no action needed
- Check logs for specific Prisma errors
- Ensure `lib/initDb.ts` and `lib/db.ts` are committed

## After Configuration

Once Root Directory is set to `app/`:
1. Trigger a new deployment (push to main branch)
2. Vercel will build from `app/` directory
3. Routes will work correctly: `/`, `/api/tasks`, etc.
4. Database will auto-initialize on first API call

## Success Indicators

You'll know it's working when:
- ✅ Home page loads (not 404)
- ✅ `/api/health` returns JSON
- ✅ `/api/tasks` returns empty array
- ✅ You can create and view tasks
- ✅ Diagnostics panel shows all green checks

