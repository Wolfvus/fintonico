# Fintonico Deployment Guide

This guide walks you through deploying Fintonico to production with Vercel and Supabase.

---

## Prerequisites

- GitHub account (already have - repo at `Wolfvus/fintonico`)
- Vercel account (free tier works)
- Supabase project (ID: `xvcmnpezakcmwffcnhmw`)
- Google Cloud Console account (for OAuth)

---

## Step 1: Vercel Setup

### 1.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Authorize Vercel to access your repositories

### 1.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Find `Wolfvus/fintonico` and click **"Import"**

### 1.3 Configure Build Settings
Vercel should auto-detect Vite, but verify:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 1.4 Add Environment Variables
In the Vercel project settings, add these environment variables:

```
VITE_SUPABASE_URL=https://xvcmnpezakcmwffcnhmw.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**To get your Supabase Anon Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`xvcmnpezakcmwffcnhmw`)
3. Go to **Settings** → **API**
4. Copy the `anon` `public` key (NOT the service_role key)

### 1.5 Deploy
1. Click **"Deploy"**
2. Wait for the build to complete
3. Note your deployment URL (e.g., `fintonico.vercel.app`)

---

## Step 2: Google OAuth Setup

### 2.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown → **"New Project"**
3. Name it `Fintonico` and create

### 2.2 Enable OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **"External"** user type
3. Fill in the required fields:
   - App name: `Fintonico`
   - User support email: Your email
   - Developer contact email: Your email
4. Click **"Save and Continue"**
5. Skip scopes (defaults are fine)
6. Add test users if needed (for testing before verification)
7. Complete the wizard

### 2.3 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Name it `Fintonico Web`
5. Add **Authorized JavaScript origins**:
   ```
   https://fintonico.vercel.app
   http://localhost:5173
   ```
   (Replace `fintonico.vercel.app` with your actual Vercel URL)

6. Add **Authorized redirect URIs**:
   ```
   https://xvcmnpezakcmwffcnhmw.supabase.co/auth/v1/callback
   ```

7. Click **"Create"**
8. **Copy the Client ID and Client Secret** (you'll need these next)

### 2.4 Configure Supabase Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Toggle **"Enable Google provider"** ON
6. Paste your:
   - **Client ID** from Google Cloud
   - **Client Secret** from Google Cloud
7. Click **"Save"**

---

## Step 3: Supabase Configuration

### 3.1 Set Site URL
1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel deployment URL:
   ```
   https://fintonico.vercel.app
   ```

### 3.2 Add Redirect URLs
In the same section, add to **Redirect URLs**:
```
https://fintonico.vercel.app/**
http://localhost:5173/**
```

### 3.3 Verify Migrations
Ensure all migrations have been applied:
1. Go to **Database** → **Migrations**
2. Verify these migrations are applied:
   - `001_base_schema.sql`
   - `002_phase1_schema.sql`
   - `003_admin_schema.sql`
   - `004_app_schema_sync.sql`

If not, run from your local machine:
```bash
npx supabase db push --project-ref xvcmnpezakcmwffcnhmw
```

---

## Step 4: Local Development Setup

### 4.1 Create .env.local file
Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://xvcmnpezakcmwffcnhmw.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4.2 Test Locally
```bash
npm run dev
```

Visit `http://localhost:5173` and try:
1. Google Sign In
2. Creating expenses/income
3. Data migration from localStorage

---

## Step 5: Testing Checklist

### Authentication
- [ ] Google Sign In works
- [ ] Google Sign Out works
- [ ] Session persists on refresh
- [ ] Password reset email sends (if using email auth)

### Data Operations
- [ ] Create expense → appears in list
- [ ] Edit expense → changes persist
- [ ] Delete expense → removed from list
- [ ] Same for Income, Accounts, Ledger Accounts

### Data Migration
- [ ] Settings → Cloud Sync shows local data counts
- [ ] Migration uploads all data to Supabase
- [ ] Data appears after migration
- [ ] "Clear local data" removes localStorage

### Admin Panel (if super_admin)
- [ ] Admin tab visible
- [ ] Can view user list
- [ ] Can view user financial data
- [ ] System config loads

### Multi-Device Sync
- [ ] Log in on another device/browser
- [ ] Data syncs across devices

---

## Troubleshooting

### "Invalid redirect URI" error
- Verify the redirect URI in Google Cloud Console matches exactly:
  `https://xvcmnpezakcmwffcnhmw.supabase.co/auth/v1/callback`

### "Google Sign In popup closes immediately"
- Check browser console for errors
- Ensure Google provider is enabled in Supabase
- Verify Client ID/Secret are correct

### "Data not loading"
- Check browser console for Supabase errors
- Verify environment variables are set in Vercel
- Check RLS policies allow the user to read their data

### "Migration fails"
- Ensure you're logged in (not in dev mode)
- Check Supabase Dashboard → Logs for errors
- Verify tables exist with correct schema

---

## Environment Variables Reference

| Variable | Where to Get | Description |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public anon key |

---

## Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard/project/xvcmnpezakcmwffcnhmw)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

**Last Updated:** 2025-01-24
