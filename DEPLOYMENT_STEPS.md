# 🚀 Deployment Steps - Shira Demo

## ✅ Completed Steps

1. ✅ Git initialized
2. ✅ All files committed
3. ✅ Supabase set up (Database + Storage)
4. ✅ 45 demo videos uploaded

## 📋 Next Steps

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `shira-demo`
3. Description: `Shira - Israeli micro-drama streaming platform demo`
4. Select: **Private**
5. **DO NOT** check "Initialize with README"
6. Click "Create repository"

### Step 2: Push to GitHub

After creating the repo, run these commands:

```bash
cd "D:\shira APP"
git remote add origin https://github.com/YOUR_USERNAME/shira-demo.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Deploy to Vercel

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `shira-demo` repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `landing`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

5. **Add Environment Variables:**

Click "Environment Variables" and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://vuverbxxstnpdslqwxxf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dmVyYnh4c3RucGRzbHF3eHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwMjE4NjQsImV4cCI6MjA0NTU5Nzg2NH0.K_rYXoAI7lGxdKh45vGEzVQvnTYQqXLYGU4uMPbNjJI
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_ENABLE_PWA=true
```

**Note:** Update `NEXT_PUBLIC_APP_URL` after deployment with your actual Vercel URL.

6. Click **Deploy**

### Step 4: Update App URL

After deployment:

1. Copy your Vercel URL (e.g., `https://shira-demo.vercel.app`)
2. Go to Vercel → Your Project → Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Redeploy

### Step 5: Test Demo

Visit your Vercel URL and test:

- ✅ Homepage loads with 3 series
- ✅ Click on a series → See episode list
- ✅ Play episode 1-10 → Video plays (FREE)
- ✅ Try episode 11-15 → Paywall appears (PREMIUM)
- ✅ Add to favorites → Works
- ✅ Watch history saves
- ✅ Share button works
- ✅ PWA install prompt appears (mobile)

## 🎯 Demo Credentials

**Demo Series:**
1. **חלומות עירוניים** (Urban Dreams) - 15 episodes
2. **אהבה וקפה** (Love & Coffee) - 15 episodes  
3. **חיי היי-טק** (Tech Life) - 15 episodes

**Free Episodes:** 1-10 (each series)
**Premium Episodes:** 11-15 (requires season pass)

## 💰 Cost Breakdown

- **Vercel:** Free tier
- **Supabase:** Free tier (500MB DB, 1GB Storage)
- **Total:** $0/month ✅

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console
3. Verify environment variables
4. Test Supabase connection

Ready to go live! 🚀
