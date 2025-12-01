# 🎯 Vercel Environment Variables - Visual Guide

## ⚠️ Critical Fix for Build Error

If you got this error:
```
The `vercel.json` schema validation failed with the following message: 
`env.NEXT_PUBLIC_API_URL` should be string
```

**Solution:** Environment variables MUST be set in the Vercel Dashboard, NOT in `vercel.json`.

---

## ✅ How to Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

Visit: https://vercel.com/dashboard

### Step 2: Select Your Project

Click on your project name from the list.

### Step 3: Open Settings

1. Click **Settings** in the top navigation
2. Click **Environment Variables** in the left sidebar

### Step 4: Add New Variable

Click the **Add New** button (or **Add Variable**)

### Step 5: Fill in the Details

```
┌─────────────────────────────────────────────┐
│ Key                                         │
│ ┌─────────────────────────────────────────┐ │
│ │ NEXT_PUBLIC_API_URL                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Value                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ https://your-backend.railway.app        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Environments                                │
│ ☑ Production                                │
│ ☑ Preview                                   │
│ ☑ Development                               │
│                                             │
│ [ Cancel ]              [ Save ]            │
└─────────────────────────────────────────────┘
```

**Important:**
- **Key:** Must be exactly `NEXT_PUBLIC_API_URL` (case-sensitive)
- **Value:** Your deployed backend URL (from Railway, Render, or VPS)
- **Environments:** Check ALL THREE boxes

### Step 6: Save

Click the **Save** button.

### Step 7: Redeploy

**Option A - Via Dashboard:**
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots **⋮** menu
4. Select **Redeploy**
5. Confirm the redeploy

**Option B - Via CLI:**
```bash
cd app
vercel --prod
```

**Option C - Push to Git:**
If your project is connected to GitHub, just push any commit:
```bash
git add .
git commit -m "Trigger redeploy"
git push
```

---

## 🧪 Verify It Worked

### Check Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check the build logs for:
   ```
   ✓ Environment variables loaded
   ✓ NEXT_PUBLIC_API_URL is set
   ```

### Check Runtime

1. Open your Vercel deployment URL
2. Open browser DevTools → Console
3. Type: `process.env.NEXT_PUBLIC_API_URL`
   - ❌ If undefined → Variable not set or needs redeploy
   - ✅ If shows URL → Working correctly!

### Test API Connection

1. Go to your deployed app
2. Try creating a task
3. Open DevTools → Network tab
4. Check that API requests go to your Railway URL (not localhost)

---

## 🐛 Common Issues

### Issue: "Environment variable not found"

**Cause:** Variable name is wrong or not set

**Fix:**
- Make sure it's exactly: `NEXT_PUBLIC_API_URL`
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Check all three environment checkboxes

### Issue: "Still getting localhost errors"

**Cause:** Didn't redeploy after adding variable

**Fix:**
- Redeploy from Deployments tab
- Or: `vercel --prod`

### Issue: "Variable shows as undefined in browser"

**Cause:** Variable name doesn't start with `NEXT_PUBLIC_`

**Fix:**
- Only variables prefixed with `NEXT_PUBLIC_` are exposed to browser
- Must be: `NEXT_PUBLIC_API_URL` (not just `API_URL`)

---

## 📝 What NOT to Do

❌ **Don't put env vars in `vercel.json`**
```json
// ❌ WRONG - This causes build errors
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://..."
  }
}
```

❌ **Don't hardcode in code**
```typescript
// ❌ WRONG - Won't work in production
const API_URL = "http://localhost:8000";
```

✅ **Do use environment variables**
```typescript
// ✅ CORRECT
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

✅ **Do set in Vercel Dashboard**
- Settings → Environment Variables → Add New

---

## 🎯 Quick Checklist

Before deploying to Vercel:

- [ ] Backend is deployed and accessible (Railway, Render, VPS)
- [ ] Backend URL copied (e.g., `https://xxx.railway.app`)
- [ ] Environment variable set in Vercel Dashboard
- [ ] Variable name is exactly: `NEXT_PUBLIC_API_URL`
- [ ] All three environments checked (Prod, Preview, Dev)
- [ ] Redeployed after adding variable
- [ ] Tested in browser DevTools

---

## 💡 Pro Tips

### Tip 1: Use Different URLs for Different Environments

```
Production:  https://api.yourdomain.com
Preview:     https://api-staging.yourdomain.com
Development: http://localhost:8000
```

Set different values for each environment in Vercel.

### Tip 2: Use Environment Variable Presets

Vercel allows you to create presets for common configurations.

### Tip 3: Check Variable in Build Logs

In Vercel build logs, search for `NEXT_PUBLIC_API_URL` to verify it's loaded.

---

## 🔗 Related Documentation

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## ✅ Your Fix is Ready!

I've already updated your code:
- ✅ `vercel.json` fixed (removed invalid env config)
- ✅ `app/lib/api.ts` reads `NEXT_PUBLIC_API_URL`
- ✅ `app/.env.local` for local development
- ✅ Documentation updated

**Now just:**
1. Set `NEXT_PUBLIC_API_URL` in Vercel Dashboard
2. Redeploy
3. Done!

---

**Last Updated:** December 1, 2025

