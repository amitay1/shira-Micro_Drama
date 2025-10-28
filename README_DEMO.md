# 🎬 Shira - Vertical Video Platform (Quick Demo)

> **סטטוס:** 🚀 **Demo Ready!** - פלטפורמת סטרימינג אנכית מלאה עם 3 סדרות demo

---

## 🎯 Quick Demo Live

**🌐 Demo URL:** *בהכנה* (יועלה ל-Vercel)  
**👤 Demo User:** demo@shira.app  
**💰 Cost:** $0/month (Free tier: Vercel + Supabase)

### ✅ What's Working Right Now

**Frontend (Next.js 14):**
- ✅ 3 demo series with 45 episodes
- ✅ Enhanced video player (11 keyboard shortcuts, 4 gestures)
- ✅ Watch history (auto-save every 5s)
- ✅ Favorites system (localStorage + backend sync)
- ✅ Payment system (Tranzila + GreenInvoice integration)
- ✅ PWA support (installable, offline-ready)
- ✅ Push notifications
- ✅ Social sharing with premium blocking
- ✅ Mobile-first responsive design (9:16 vertical video)

**Backend (Supabase):**
- ✅ PostgreSQL database with 6 tables
- ✅ 45 demo episodes seeded
- ✅ Storage buckets for videos & images
- ✅ Row Level Security (RLS) policies
- ✅ Real-time subscriptions ready

**Infrastructure:**
- ✅ Vercel (Frontend hosting)
- ✅ Supabase (Database + Storage + Auth)
- ✅ GitHub (Version control)

---

## 🚀 Quick Start for Developers

### Prerequisites
- Node.js 18+
- Git
- Supabase account
- Vercel account (optional, for deployment)

### Local Development

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd "shira APP"

# 2. Install dependencies
cd landing
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run development server
npm run dev
```

Visit: http://localhost:3001

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for full features)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 📁 Project Structure

```
D:\shira APP\
├── landing/                    # Next.js Frontend (MAIN APP)
│   ├── src/
│   │   ├── app/               # Next.js 14 App Router
│   │   ├── components/        # React components
│   │   ├── services/          # Business logic
│   │   ├── lib/               # Utilities & Supabase client
│   │   └── types/             # TypeScript types
│   ├── public/                # Static assets
│   ├── package.json
│   └── next.config.js
│
├── backend/                   # Express API (Optional - for payments)
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Tranzila, GreenInvoice
│   │   └── models/           # Database models
│   └── package.json
│
├── docs/                      # Documentation
│   ├── SUPABASE_SCHEMA.sql   # Database schema
│   ├── DEMO_SETUP_GUIDE.md   # Complete setup guide
│   └── QUICK_DEMO_PLAN.md    # 24-hour deployment plan
│
├── scripts/                   # Utility scripts
│   ├── download-demo-videos.py    # Download from Pexels
│   └── upload-to-supabase.py      # Upload to Supabase Storage
│
└── README.md                  # This file
```

---

## 🎨 Features Implemented

### Task 1: Payment System ✅
- **Tranzila Integration:** Credit card processing
- **GreenInvoice Integration:** Automatic invoice generation
- **Checkout flow:** Complete payment experience
- **Files:** `services/payment.ts`, `services/tranzila.js`, `services/greeninvoice.js`

### Task 2: Watch History ✅
- **Auto-save:** Every 5 seconds
- **Continue watching:** Resume from last position
- **History page:** View all watched episodes
- **Files:** `services/watchHistoryService.ts`, `app/history/page.tsx`

### Task 3: Enhanced Video Player ✅
- **11 Keyboard shortcuts:** Space, ←/→, ↑/↓, M, F, K, J, L, 0-9
- **4 Touch gestures:** Tap, double-tap, swipe, long-press
- **Auto-play next:** Seamless episode transitions
- **Files:** `components/EnhancedVideoPlayer.tsx`

### Task 4: Favorites System ✅
- **Add/Remove:** Toggle favorites
- **Sync:** localStorage + Supabase backend
- **Favorites page:** View all favorites
- **Files:** `services/favoritesService.ts`, `app/favorites/page.tsx`

### Task 5: PWA Support ✅
- **Installable:** Add to home screen
- **Offline support:** Service worker
- **Manifest:** Complete PWA manifest
- **Files:** `public/manifest.json`, `public/sw.js`

### Task 6: Push Notifications ✅
- **Permission management:** User opt-in
- **New episode alerts:** Automatic notifications
- **Continue watching reminders:** Smart reminders
- **Files:** `services/notificationService.ts`, `app/account/page.tsx`

### Task 7: Social Sharing ✅
- **Share button:** Native share API
- **Premium blocking:** Can't share premium content
- **Meta tags:** Rich social previews
- **Files:** `services/shareService.ts`, `components/ShareButton.tsx`

---

## 🗄️ Database Schema

### Tables (Supabase)

**series** - 3 demo series
- id, title, description, slug, poster_url, genres, etc.

**episodes** - 45 demo episodes (10 free + 5 premium per series)
- id, series_id, episode_number, video_url, duration, is_free, etc.

**users** - User accounts
- id, email, name, avatar_url, created_at

**favorites** - User favorites
- user_id, series_id, created_at

**watch_history** - Watch progress
- user_id, episode_id, last_position, completed, watched_at

**purchases** - Season pass purchases
- user_id, series_id, price, transaction_id, status

---

## 🎥 Demo Content

### Series 1: Urban Dreams (חלומות עירוניים)
- **Genre:** Drama, Romance
- **Episodes:** 15 (10 free + 5 premium)
- **Theme:** Modern city life in Tel Aviv
- **Duration:** ~3 minutes per episode

### Series 2: Love & Coffee (אהבה וקפה)
- **Genre:** Romantic Comedy
- **Episodes:** 15 (10 free + 5 premium)
- **Theme:** Café romance stories
- **Duration:** ~3 minutes per episode

### Series 3: Tech Life (חיי היי-טק)
- **Genre:** Comedy, Business
- **Episodes:** 15 (10 free + 5 premium)
- **Theme:** Israeli high-tech startup life
- **Duration:** ~3 minutes per episode

**Total:** 45 videos, ~135 minutes of content

---

## 💰 Pricing & Costs

### Demo Infrastructure (Current)
- **Vercel:** Free tier (100GB bandwidth/month)
- **Supabase:** Free tier (500MB database, 1GB storage)
- **Total:** **$0/month** 🎉

### Production Upgrade Options
- **Vercel Pro:** $20/month (Unlimited bandwidth)
- **Supabase Pro:** $25/month (8GB database, 100GB storage)
- **Cloudflare Stream:** $5/month (5,000 minutes)
- **Total Production:** $50/month

---

## 🚀 Deployment Guide

### Option 1: Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Connect Vercel:**
   - Go to vercel.com
   - Import GitHub repository
   - Set root directory: `landing`
   - Add environment variables
   - Deploy!

3. **Environment Variables in Vercel:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_APP_URL
   ```

### Option 2: Manual Deployment

See [DEMO_SETUP_GUIDE.md](./docs/DEMO_SETUP_GUIDE.md)

---

## 🧪 Testing Checklist

After deployment:

- [ ] Homepage loads with 3 series
- [ ] Video player works (first 10 episodes play)
- [ ] Episodes 11-15 show paywall
- [ ] Favorites add/remove works
- [ ] Watch history saves progress
- [ ] Share button works
- [ ] PWA install prompt appears
- [ ] Notifications permission works
- [ ] Mobile responsive (test on phone)

---

## 📚 Additional Documentation

- **[DEMO_SETUP_GUIDE.md](./docs/DEMO_SETUP_GUIDE.md)** - Complete setup walkthrough
- **[QUICK_DEMO_PLAN.md](./docs/QUICK_DEMO_PLAN.md)** - 24-hour deployment plan
- **[SUPABASE_SCHEMA.sql](./docs/SUPABASE_SCHEMA.sql)** - Database schema
- **[Backend README](./backend/README.md)** - Express API documentation

---

## 🐛 Known Limitations (Demo)

❌ **Not Working (Yet):**
- Real payment processing (Tranzila needs credentials)
- Real invoices (GreenInvoice needs credentials)
- Backend API (Express server not deployed)
- Email notifications (SendGrid not configured)
- Analytics (Google Analytics ID placeholder)

✅ **Working:**
- Everything else! 🎉
- Video playback
- User interface
- Data persistence
- All 7 implemented features

---

## 🔄 Replacing Demo Content

When you're ready for production:

1. **Upload real videos:**
   - Use Supabase Storage or Cloudflare Stream
   - Update `episodes` table with new URLs

2. **Update series metadata:**
   - Edit `series` table in Supabase
   - Upload real posters and thumbnails

3. **Add payment credentials:**
   - Get Tranzila account
   - Get GreenInvoice account
   - Update environment variables

4. **Deploy backend API:**
   - Deploy Express server to Railway/Render
   - Update `NEXT_PUBLIC_API_URL`

---

## 🤝 Support & Contact

**Issues?** Open an issue on GitHub  
**Questions?** Check the documentation  
**Updates?** Watch the repository

---

## 📄 License

Proprietary - All rights reserved

---

## 🎉 Credits

**Framework:** Next.js 14, React 18, TypeScript  
**UI:** Tailwind CSS, Lucide Icons  
**Database:** Supabase (PostgreSQL)  
**Video:** HTML5 Video, HLS.js  
**Deployment:** Vercel  
**Demo Videos:** Pexels (Free stock footage)

---

**Built with ❤️ for vertical video content creators**

*Last updated: October 2025*
