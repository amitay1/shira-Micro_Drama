# Shira Demo Setup Guide

## 🚀 Quick Demo Deployment

### Step 1: Run SQL Schema in Supabase (2 minutes)

1. Go to your Supabase Dashboard: https://vuverbxxstnpdslqwxxf.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **+ New Query**
4. Open `D:\shira APP\docs\SUPABASE_SCHEMA.sql`
5. Copy ALL content (600+ lines)
6. Paste into SQL Editor
7. Click **RUN** (or Ctrl+Enter)

**✅ This creates:**
- 6 tables (series, episodes, users, favorites, watch_history, purchases)
- 3 demo series with 45 episodes
- 1 demo user
- All indexes, triggers, and RLS policies

### Step 2: Create Storage Buckets (1 minute)

1. Click **Storage** in left sidebar
2. Click **Create a new bucket**
3. Name: `videos`
   - ✅ Check **Public bucket**
   - Click **Create bucket**
4. Click **Create a new bucket** again
5. Name: `images`
   - ✅ Check **Public bucket**
   - Click **Create bucket**

### Step 3: Verify Database (30 seconds)

Run this in SQL Editor:
```sql
SELECT 
  (SELECT COUNT(*) FROM series) as total_series,
  (SELECT COUNT(*) FROM episodes) as total_episodes,
  (SELECT COUNT(*) FROM users) as total_users;
```

**Expected results:**
- `total_series`: 3
- `total_episodes`: 45
- `total_users`: 1

---

## 📹 Download & Upload Demo Videos

### Option A: Automated Download from Pexels (Recommended)

1. **Get Pexels API Key (Free):**
   - Go to https://www.pexels.com/api/
   - Sign up for free
   - Copy your API key

2. **Install Python dependencies:**
   ```powershell
   cd "D:\shira APP\scripts"
   pip install -r requirements.txt
   ```

3. **Edit download script:**
   - Open `download-demo-videos.py`
   - Replace `YOUR_PEXELS_API_KEY` with your actual key

4. **Run download script:**
   ```powershell
   python download-demo-videos.py
   ```
   ⏱️ Takes ~30-45 minutes to download 45 videos

5. **Upload to Supabase:**
   ```powershell
   python upload-to-supabase.py
   ```
   ⏱️ Takes ~15-20 minutes to upload

### Option B: Manual Video Collection (Faster but more work)

1. **Find 45 vertical videos (9:16 format):**
   - Pexels: https://www.pexels.com/videos/ (filter: portrait)
   - Pixabay: https://pixabay.com/videos/ (filter: vertical)
   - Coverr: https://coverr.co/ (filter: portrait)

2. **Download 15 videos per series:**
   - **Urban Dreams**: city life, streets, night scenes (15 videos)
   - **Love & Coffee**: cafes, coffee, romantic scenes (15 videos)
   - **Tech Life**: offices, coding, meetings (15 videos)

3. **Save to structure:**
   ```
   D:\shira APP\public\demo-videos\
   ├── urban-dreams\
   │   ├── ep01.mp4
   │   ├── ep02.mp4
   │   └── ... (ep01-ep15)
   ├── love-and-coffee\
   │   ├── ep01.mp4
   │   └── ... (ep01-ep15)
   └── tech-life\
       ├── ep01.mp4
       └── ... (ep01-ep15)
   ```

4. **Upload manually to Supabase Storage:**
   - Go to Storage → videos bucket
   - Create folders: `urban-dreams`, `love-and-coffee`, `tech-life`
   - Upload 15 videos to each folder
   - Update database URLs with script or manually

---

## 🌐 Deploy to Vercel

### Step 1: Push to GitHub (if not already)

```powershell
cd "D:\shira APP"
git init
git add .
git commit -m "Initial commit - Shira demo ready"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Connect Vercel

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click **Add New** → **Project**
4. Select your `shira-app` repository
5. Framework: **Next.js** (auto-detected)
6. Root Directory: `landing`
7. Click **Environment Variables**

### Step 3: Add Environment Variables

Add these to Vercel:

```bash
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://vuverbxxstnpdslqwxxf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dmVyYnh4c3RucGRzbHF3eHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc0MTgsImV4cCI6MjA3NDc1MzQxOH0.rVpNTRDyKBLIGejf-R4i067pkue26rN0c37TXK4fwYY
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ENABLE_PWA=true
```

### Step 4: Deploy!

1. Click **Deploy**
2. Wait 2-3 minutes
3. Get your URL: `https://YOUR-PROJECT.vercel.app`

---

## ✅ Testing Checklist

After deployment, test:

- [ ] Homepage loads with 3 series
- [ ] Series page shows 15 episodes
- [ ] First 10 episodes play (free)
- [ ] Episodes 11-15 show paywall
- [ ] Favorites work (localStorage)
- [ ] Watch history saves progress
- [ ] Share button works
- [ ] PWA install prompt appears
- [ ] Notifications permission works
- [ ] Mobile responsive (9:16 video)

---

## 🎯 Demo Credentials

**User:** demo@shira.app  
**Password:** (No password needed - demo mode)

---

## 📊 What's Working

✅ **Complete Features:**
- Payment System (Tranzila + GreenInvoice) - *needs credentials*
- Watch History - auto-save every 5s
- Enhanced Video Player - 11 shortcuts, 4 gestures
- Favorites System - localStorage + backend sync
- PWA Support - installable, offline-ready
- Push Notifications - full service
- Social Sharing - with premium blocking

✅ **Database:**
- 3 series with metadata
- 45 episodes (10 free, 5 premium each)
- Users, favorites, watch history tables

✅ **Hosting:**
- Frontend: Vercel (free tier)
- Database: Supabase (free tier)
- Storage: Supabase (free tier)

**Total Cost: $0/month** 💰

---

## 🚧 What's NOT Working (Yet)

❌ **Real Payments:**
- Needs Tranzila Terminal ID + Password
- Needs GreenInvoice API Key + Secret
- Currently in "demo mode" - no actual charges

❌ **Backend API:**
- Express server not deployed yet
- Can deploy to Railway.app ($5/month)
- Or use Supabase Edge Functions (free)

❌ **Real Content:**
- Using demo/stock videos
- Replace with your actual content later

---

## 🔄 Replacing Demo Content (Later)

When you have real content:

1. **Upload real videos:**
   ```powershell
   # Upload to Supabase Storage
   python scripts/upload-real-videos.py
   ```

2. **Update database:**
   ```sql
   UPDATE series SET 
     title = 'Your Real Title',
     description = 'Your Real Description',
     poster_url = 'https://...',
     ...
   WHERE slug = 'series-slug';
   ```

3. **Add payment credentials:**
   - Get Tranzila account
   - Get GreenInvoice account
   - Add credentials to Vercel env vars
   - Redeploy

---

## 📞 Support

If you have issues:
1. Check Supabase logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments → Logs
3. Check browser console: F12 → Console

---

## 🎉 Success!

When everything works, you'll have:
- ✅ Live demo at https://YOUR-PROJECT.vercel.app
- ✅ 3 series with 45 episodes
- ✅ All features working
- ✅ Installable as PWA
- ✅ Share-ready URL
- ✅ $0/month cost

**Share the URL and get feedback! 🚀**
