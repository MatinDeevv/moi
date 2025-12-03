# Database Setup Guide - Global PostgreSQL for Vercel

## Overview

This project now uses **PostgreSQL** instead of SQLite for global database access across all deployments and users.

---

## ✅ Step 1: Choose a Database Provider

Pick one of these **free** PostgreSQL providers:

### Option A: Neon (Recommended)
- **Free Tier:** 0.5 GB storage, unlimited compute hours
- **Setup:** https://neon.tech
- **Auto-scaling:** Scales to zero when not in use

### Option B: Supabase
- **Free Tier:** 500 MB database, 50 MB file storage
- **Setup:** https://supabase.com
- **Bonus:** Built-in auth, storage, and realtime

### Option C: Railway
- **Free Tier:** $5/month credit (500 hours)
- **Setup:** https://railway.app
- **Easy:** One-click PostgreSQL deployment

### Option D: PlanetScale (MySQL compatible)
- **Free Tier:** 5 GB storage, 1 billion reads/month
- **Setup:** https://planetscale.com
- **Note:** Uses MySQL, need to change schema slightly

---

## ✅ Step 2: Create Database

### Using Neon (Recommended):

1. Go to https://console.neon.tech
2. Click **"New Project"**
3. Name: `project-me-db`
4. Region: Choose closest to you (or us-east-1 for Vercel)
5. Click **"Create Project"**

6. **Copy the connection string:**
   ```
   postgres://username:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb
   ```

---

## ✅ Step 3: Configure Vercel Environment Variables

### In Vercel Dashboard:

1. Go to your project: https://vercel.com/dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | Production, Preview, Development |
| `DIRECT_URL` | Same as DATABASE_URL | Production, Preview, Development |

**Important:** 
- Add `?sslmode=require` at the end of the URL
- Add to **all three environments** (Production, Preview, Development)

### Example:
```env
DATABASE_URL="postgresql://myuser:mypass@ep-cool-name.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://myuser:mypass@ep-cool-name.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

---

## ✅ Step 4: Update Local .env File

Create/update `app/.env` (local development):

```env
# Database
DATABASE_URL="postgresql://myuser:mypass@ep-cool-name.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Optional: Runner (if testing locally)
RUNNER_BASE_URL="http://localhost:4000"
RUNNER_TOKEN=""
```

**Never commit `.env` to git!** (It's already in `.gitignore`)

---

## ✅ Step 5: Run Migrations

### First Time Setup:

```bash
cd app
npx prisma migrate dev --name init
```

This will:
- Create all tables in your PostgreSQL database
- Generate Prisma Client
- Apply the schema

### Future Schema Changes:

After editing `schema.prisma`:

```bash
cd app
npx prisma migrate dev --name describe_your_change
```

### Deploy Migrations to Production:

Vercel will automatically run migrations on deployment via the build script.

If you need to run manually:

```bash
npx prisma migrate deploy
```

---

## ✅ Step 6: Verify Database

### View Database:

```bash
cd app
npx prisma studio
```

Opens a web UI at `http://localhost:5555` to browse your database.

### Test Connection:

```bash
cd app
npx prisma db pull
```

Should show: "Introspected X models"

---

## 🎯 New Schema Features

### Multi-User Support:
- **User** model for authentication
- **Session** model for login sessions
- Tasks can be user-specific or global

### Enhanced Tasks:
- Native **JSON** fields (no more string parsing!)
- Native **array** type for tags
- Priority and public/private flags
- Execution time tracking

### LLM Sessions:
- **LLMSession** model for conversations
- **LLMMessage** model for chat history
- Rolling summaries for context management

### Sandbox Tracking:
- **SandboxFile** model tracks all files
- Soft delete support
- Per-user sandboxes

### Audit Logs:
- **AuditLog** model for compliance
- Tracks all important actions
- IP and user agent logging

---

## 🔄 Migration from SQLite

If you have existing data in SQLite:

### Option 1: Manual Export/Import

```bash
# Export from SQLite
cd app
npx prisma db pull
npx prisma generate

# Then manually migrate data via scripts
```

### Option 2: Fresh Start (Recommended)

Just start fresh with PostgreSQL. Old data in SQLite is only local anyway.

---

## 📊 Database Schema Overview

```
User (multi-user support)
├── Tasks (user-specific or global)
│   └── Events (task execution logs)
├── Settings (per-user preferences)
├── Sessions (auth tokens)
└── AuditLogs (action tracking)

LLMSession (conversations)
└── LLMMessages (chat history)

SandboxFile (file tracking)
```

---

## 🚀 Benefits of PostgreSQL

### vs SQLite:

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Global Access** | ❌ File-based, deployment-specific | ✅ Cloud-hosted, shared |
| **Multi-User** | ❌ Not designed for it | ✅ Native support |
| **JSON Fields** | ⚠️ Limited support | ✅ Native JSONB |
| **Arrays** | ❌ Must store as strings | ✅ Native arrays |
| **Transactions** | ⚠️ File locks | ✅ ACID compliant |
| **Scalability** | ❌ Single file | ✅ Unlimited |
| **Backup** | ❌ Manual | ✅ Automatic |

---

## 🛡️ Security Best Practices

### Environment Variables:
- ✅ Store in Vercel Dashboard, not code
- ✅ Use different DB for dev/prod
- ✅ Rotate database passwords regularly

### Connection Pooling:
- Neon/Supabase handle this automatically
- Use `?pgbouncer=true` if needed

### SSL:
- Always use `?sslmode=require`
- Never connect without SSL in production

---

## 🧪 Testing

### Local Development:

1. Start local dev server:
   ```bash
   cd app
   npm run dev
   ```

2. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

3. Create test data, run tasks, verify everything works

### Production:

1. Deploy to Vercel (auto-runs migrations)
2. Check Vercel logs for migration success
3. Test creating tasks from deployed site
4. Verify data persists across deployments

---

## 📝 Common Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a migration
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DANGER: deletes all data)
npx prisma migrate reset

# Open database browser
npx prisma studio

# Seed database (if seed.ts exists)
npx prisma db seed
```

---

## 🐛 Troubleshooting

### "Environment variable not found: DATABASE_URL"

**Fix:** Add `DATABASE_URL` to Vercel environment variables.

### "SSL connection required"

**Fix:** Add `?sslmode=require` to your connection string.

### "Can't reach database server"

**Fix:** 
- Check if database is running (Neon/Supabase dashboard)
- Verify connection string is correct
- Check firewall/network settings

### "Prisma Client not generated"

**Fix:**
```bash
cd app
npx prisma generate
```

---

## 🎉 You're Done!

Once you complete all steps:

✅ Database accessible from all Vercel deployments  
✅ Data persists across redeploys  
✅ Multi-user support ready  
✅ Automatic backups via cloud provider  
✅ Free tier (no credit card for Neon/Supabase)  

**Your app now has a production-grade global database!** 🚀

