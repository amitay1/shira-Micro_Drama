# 📋 רשימת דברים חסרים - מה צריך כדי שהאפליקציה תעבוד באמת

## 🎯 סיכום מצב נוכחי

✅ **מה יש לנו**:
- Frontend מלא (Next.js) - Landing, Watch, Series, Payment
- 7 Tasks מושלמים: Payment, History, Player, Favorites, PWA, Notifications, Sharing
- Backend API structure
- Database models (Sequelize)
- Payment services (Tranzila, GreenInvoice)
- Video player components

❌ **מה חסר**:
- תוכן אמיתי (וידאו, סדרות, פרקים)
- הגדרות הפקה (API Keys, Credentials)
- תשתית וידאו (Storage, CDN, Streaming)
- Database עם נתונים
- Backend מלא ופעיל

---

## 📊 PART 1: תוכן ומידע שאני צריך ממך

### 1️⃣ תוכן וידאו (קריטי!)

#### A. הסדרות והפרקים
```
מה אני צריך לדעת:
├── כמה סדרות יש? (כרגע: 6)
├── כמה פרקים בכל סדרה? (כרגע: 139 סה"כ)
├── שמות הסדרות
├── תיאורים לכל סדרה
├── מספר עונות
└── ז'אנרים

שאלות:
❓ האם יש לך כבר תוכן וידאו מוכן?
❓ האם הוידאו מצולם אנכית (9:16)?
❓ באיזה רזולוציה?
❓ איפה הקבצים נמצאים כרגע?
```

#### B. קבצי וידאו
```
מה אני צריך:
├── 📁 קבצי וידאו (.mp4, .mov)
│   ├── רזולוציה: 1080x1920 (9:16) או יותר
│   ├── קצב bit: 5-10 Mbps מומלץ
│   └── אורך: 1-5 דקות לפרק?
│
├── 🖼️ תמונות Cover
│   ├── Poster לכל סדרה (1080x1920)
│   └── Thumbnail לכל פרק (1080x1920)
│
└── 📝 מטאדאטה
    ├── כותרות פרקים
    ├── תיאורים
    ├── תגיות
    └── תאריכי פרסום

פעולה נדרשת ממך:
□ להעלות קבצי וידאו למיקום זמני
□ לספק קישורים להורדה
□ או: לתת לי גישה לתיקיה משותפת (Google Drive/Dropbox)
```

#### C. מבנה תוכן
```
דוגמה למה שאני צריך:

Series 1: "שם הסדרה"
├── Season 1
│   ├── Episode 1: "כותרת פרק 1" (משך: 3:45)
│   ├── Episode 2: "כותרת פרק 2" (משך: 4:12)
│   └── ...
├── Season 2
│   └── ...
└── Info:
    ├── תיאור: "..."
    ├── ז'אנר: דרמה/קומדיה/רומנטיקה
    ├── שחקנים: "..."
    └── מחיר: 50 מטבעות או Season Pass 150₪

שאלה עבורך:
❓ תוכל לשלוח לי Excel/CSV עם המידע הזה?
```

---

### 2️⃣ פרטי תשלום ומסחור

#### A. Tranzila (אשראי ישראלי)
```
מה אני צריך ממך:
□ TRANZILA_TERMINAL_NAME: __________ (שם הטרמינל שלך)
□ TRANZILA_TERMINAL_PASSWORD: __________ (סיסמה)
□ TRANZILA_BASE_URL: https://direct.tranzila.com

איפה לקבל:
1. להירשם ב-Tranzila: https://www.tranzila.com
2. לפתוח חשבון עסקי
3. לקבל פרטי טרמינל
4. בסביבת Test: להשתמש בטרמינל הדמו שלהם

עלות: ~1.9% + 1₪ לעסקה
זמן אישור: 3-5 ימי עסקים
```

#### B. GreenInvoice (חשבוניות)
```
מה אני צריך ממך:
□ GREENINVOICE_API_KEY: __________
□ GREENINVOICE_API_SECRET: __________
□ GREENINVOICE_BUSINESS_ID: __________

איפה לקבל:
1. להירשם ב-GreenInvoice: https://www.greeninvoice.co.il
2. Settings → API
3. ליצור API Key חדש
4. לשמור את הפרטים

עלות: מ-99₪/חודש
חובה: לפי חוק (חשבונית למכירות ישראל)
```

#### C. מחירים ומטבעות
```
מה אני צריך שתחליט:
├── מחיר פרק בודד: _____ מטבעות (הצעה: 5-10)
├── Season Pass: _____ ₪ (הצעה: 49-99₪)
├── חבילות מטבעות:
│   ├── 50 מטבעות = _____ ₪ (הצעה: 19₪)
│   ├── 120 מטבעות = _____ ₪ (הצעה: 39₪)
│   ├── 250 מטבעות = _____ ₪ (הצעה: 69₪)
│   └── 500 מטבעות = _____ ₪ (הצעה: 119₪)
└── First 10 episodes FREE (קיים!)

שאלה:
❓ איזה מודל תמחור אתה רוצה?
```

---

### 3️⃣ תשתית וידאו וסטורג'

#### A. אחסון קבצים (Storage)
```
אופציות:

Option 1: AWS S3 (מומלץ!)
├── יתרונות: מהיר, זול, אמין
├── עלות: ~$0.023 לGB/חודש
├── CDN: CloudFront מובנה
└── צריך: AWS Account + Credit Card

מה צריך ממך:
□ AWS_ACCESS_KEY_ID
□ AWS_SECRET_ACCESS_KEY
□ AWS_S3_BUCKET_NAME
□ AWS_REGION (המלצה: eu-west-1 או us-east-1)

Option 2: Google Cloud Storage
├── יתרונות: דומה ל-S3, אינטגרציה טובה
├── עלות: דומה
└── צריך: Google Cloud Account

Option 3: Azure Storage (אופציה ישראלית)
├── יתרונות: יש DataCenter בישראל
├── עלות: קצת יותר יקר
└── צריך: Azure Account

Option 4: Cloudflare R2 (חדש!)
├── יתרונות: ללא עלויות Egress!
├── עלות: $0.015 לGB/חודש
└── צריך: Cloudflare Account

Option 5: Backblaze B2 (זול!)
├── יתרונות: מאוד זול
├── עלות: $0.005 לGB/חודש
└── צריך: Backblaze Account

המלצה שלי: AWS S3 + CloudFront
למה: הכי מהיר, אמין, ותמיכה טובה
עלות משוערת: 100GB וידאו = $2-5/חודש + bandwidth
```

#### B. Video Streaming (CDN)
```
כרגע הקוד משתמש ב-HLS:
├── Requires: .m3u8 playlist files
├── Requires: .ts segment files
└── Supports: Adaptive bitrate (240p-1080p)

אופציות:

Option 1: AWS CloudFront + S3
├── מה זה עושה: מגיש וידאו מהר מכל העולם
├── עלות: $0.085 לGB bandwidth (50TB ראשונים)
└── Setup: אוטומטי עם S3

Option 2: Cloudflare Stream (הכי קל!)
├── מה זה עושה: upload + encoding + streaming הכל ביחד
├── עלות: $5 ל-1,000 דקות אחסון + $1 ל-1,000 דקות צפייה
├── יתרונות: אפס configuration, עובד out-of-the-box
└── המלצה: מושלם להתחלה!

Option 3: Mux (Premium)
├── מה זה עושה: דומה ל-Cloudflare, יותר פיצ'רים
├── עלות: מתחיל ב-$20/חודש
└── יתרונות: Analytics מובנה, DRM

Option 4: Bunny.net (זול מאוד!)
├── מה זה עושה: CDN + Storage + Streaming
├── עלות: $0.01 לGB אחסון, $0.01 לGB bandwidth!
├── יתרונות: הזול ביותר, פשוט
└── המלצה: מצוין לתקציב נמוך

המלצה שלי להתחלה: Cloudflare Stream
למה: אפס טכני, פשוט upload, עובד מיד
```

#### C. Video Processing (Encoding)
```
צריך להמיר וידאו ל-HLS:

Option 1: FFmpeg (חינם, מקומי)
├── אני כבר כתבתי את הקוד
├── פשוט צריך להתקין FFmpeg
└── למה: חינם, מלא שליטה

Option 2: AWS MediaConvert (Cloud)
├── עלות: $0.015 לדקת וידאו
├── יתרונות: אוטומטי, מהיר, אמין
└── למה: אם יש הרבה וידאו

Option 3: Cloudflare Stream (מובנה)
├── עושה הכל אוטומטי
└── הכי קל!

המלצה:
- יש < 50 וידאו? → FFmpeg מקומי
- יש 50-200 וידאו? → Cloudflare Stream
- יש 200+ וידאו? → AWS MediaConvert
```

---

### 4️⃣ Database (בסיס נתונים)

#### A. PostgreSQL (עיקרי)
```
אופציות:

Option 1: Local (Development)
├── התקנה: https://www.postgresql.org/download/
├── עלות: חינם
└── טוב ל: פיתוח בלבד

Option 2: Neon.tech (מומלץ!)
├── PostgreSQL Serverless
├── עלות: חינם עד 0.5GB, אז $19/חודש
├── יתרונות: אפס setup, scaling אוטומטי
└── קישור: https://neon.tech

Option 3: Supabase (מומלץ מאוד!)
├── PostgreSQL + Auth + Storage הכל ביחד!
├── עלות: חינם עד 500MB, אז $25/חודש
├── יתרונות: includes real-time, auth, storage
└── קישור: https://supabase.com

Option 4: AWS RDS
├── Managed PostgreSQL
├── עלות: מתחיל ב-$15/חודש
└── יתרונות: אמין מאוד, גמיש

Option 5: Railway.app
├── PostgreSQL + Deploy ביחד
├── עלות: $5/חודש
└── יתרונות: מאוד קל

המלצה שלי: Supabase
למה: יש הכל (DB + Auth + Storage), חינם להתחלה, קל מאוד
```

#### B. Redis (Cache)
```
אופציות:

Option 1: Local (Development)
├── התקנה: https://redis.io/download
└── עלות: חינם

Option 2: Upstash (מומלץ!)
├── Serverless Redis
├── עלות: חינם עד 10,000 requests/day
├── קישור: https://upstash.com
└── יתרונות: אפס setup

Option 3: Redis Cloud
├── Managed Redis
├── עלות: חינם עד 30MB
└── קישור: https://redis.com

המלצה: Upstash (הכי קל!)
```

---

### 5️⃣ Backend Deployment (איפה לאחסן את השרת)

```
Backend צריך להיות פעיל 24/7:

Option 1: Vercel (הכי קל!)
├── עלות: חינם עד 100GB bandwidth
├── עובד עם: Next.js (יש לנו!)
├── יתרונות: אפס configuration, deploy בקליק
└── המלצה: מושלם להתחלה!

Option 2: Railway.app (מומלץ!)
├── עלות: $5/חודש
├── עובד עם: Node.js, PostgreSQL, Redis הכל
├── יתרונות: deploy בקליק, logs, monitoring
└── המלצה: הכי קל לbackend מלא

Option 3: Render.com
├── עלות: חינם או $7/חודש
├── יתרונות: דומה ל-Railway
└── המלצה: אלטרנטיבה טובה

Option 4: Fly.io
├── עלות: חינם עד 3 apps
├── יתרונות: Edge deployment (מהיר בעולם)
└── המלצה: אם רוצים ביצועים

Option 5: AWS/GCP/Azure (מתקדם)
├── עלות: משתנה, יקר יותר
├── יתרונות: שליטה מלאה
└── למי: אם יודעים DevOps

Option 6: VPS (Digital Ocean, Linode, Vultr)
├── עלות: $5-10/חודש
├── צריך: לדעת Linux, Docker
└── למי: אם רוצים שליטה

המלצת התחלה:
1. Frontend → Vercel (חינם!)
2. Backend → Railway ($5/חודש)
3. Database → Supabase (חינם!)
4. Videos → Cloudflare Stream ($5/חודש)

סה"כ: ~$10-15/חודש להתחלה!
```

---

## 🔑 PART 2: API Keys וסודות שאני צריך ממך

### Environment Variables מלא

```bash
# ============================================
# Frontend (.env.local)
# ============================================

# Basic
NEXT_PUBLIC_APP_NAME=Shira
NEXT_PUBLIC_APP_URL=https://shira.app  # הדומיין שלך
NEXT_PUBLIC_APP_ENV=production

# Backend
NEXT_PUBLIC_API_URL=https://api.shira.app/api/v1  # איפה Backend רץ

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Google Analytics
NEXT_PUBLIC_META_PIXEL_ID=  # Facebook Pixel (optional)
NEXT_PUBLIC_TIKTOK_PIXEL_ID=  # TikTok Pixel (optional)

# PWA
NEXT_PUBLIC_ENABLE_PWA=true

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=  # צריך ליצור!

# ============================================
# Backend (.env)
# ============================================

# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database - PostgreSQL (מ-Supabase למשל)
DB_HOST=db.xxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=__________ # הסיסמה מSupabase
DB_DIALECT=postgres

# Redis (מ-Upstash למשל)
REDIS_URL=redis://default:__________@us1-xxxx.upstash.io:6379

# JWT Secrets (ליצור מחרוזות אקראיות!)
JWT_SECRET=__________ # 64 תווים אקראיים
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=__________ # 64 תווים שונים
JWT_REFRESH_EXPIRY=30d

# Tranzila (מהם!)
TRANZILA_TERMINAL_NAME=__________
TRANZILA_TERMINAL_PASSWORD=__________
TRANZILA_BASE_URL=https://direct.tranzila.com

# GreenInvoice (מהם!)
GREENINVOICE_API_KEY=__________
GREENINVOICE_API_SECRET=__________
GREENINVOICE_BUSINESS_ID=__________
GREENINVOICE_BASE_URL=https://api.greeninvoice.co.il

# AWS S3 (לוידאו)
AWS_ACCESS_KEY_ID=__________
AWS_SECRET_ACCESS_KEY=__________
AWS_S3_BUCKET_NAME=shira-videos
AWS_REGION=eu-west-1
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net

# Cloudflare Stream (אלטרנטיבה)
CLOUDFLARE_ACCOUNT_ID=__________
CLOUDFLARE_API_TOKEN=__________

# URLs
FRONTEND_URL=https://shira.app
APP_URL=https://api.shira.app

# CORS
CORS_ORIGIN=https://shira.app
CORS_CREDENTIALS=true

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=__________ # 64 תווים אקראיים
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict

# Logging
LOG_LEVEL=info
```

---

## 🎬 PART 3: תהליך העבודה - מה אני צריך שתעשה

### שלב 1: פתיחת חשבונות (15-30 דקות)
```
□ Vercel: https://vercel.com (התחבר עם GitHub)
□ Supabase: https://supabase.com (התחבר עם GitHub)
□ Upstash: https://upstash.com (התחבר עם GitHub)
□ Cloudflare: https://cloudflare.com (יצירת חשבון)
□ Tranzila: https://tranzila.com (פנייה מסחרית)
□ GreenInvoice: https://greeninvoice.co.il (רישום)

סה"כ זמן: 30 דקות
עלות: $0 (הכל חינם או trial)
```

### שלב 2: הגדרת Database (10 דקות)
```
1. נכנס ל-Supabase
2. Create New Project
3. שם: "shira-production"
4. סיסמה: (שמור אותה!)
5. Region: Frankfurt או הכי קרוב
6. Copy connection string
7. שולח לי את:
   - Database URL
   - API Keys
```

### שלב 3: הגדרת Redis (5 דקות)
```
1. נכנס ל-Upstash
2. Create Database
3. שם: "shira-cache"
4. Region: EU-West
5. Copy: REDIS_URL
6. שולח לי
```

### שלב 4: הגדרת וידאו (15 דקות)
```
Option A: Cloudflare Stream (מומלץ!)
1. נכנס ל-Cloudflare
2. Stream → Get Started
3. Copy: Account ID, API Token
4. Upload 1 וידאו טסט
5. שולח לי את הפרטים

Option B: AWS S3
1. נכנס ל-AWS Console
2. S3 → Create Bucket
3. שם: "shira-videos"
4. Region: eu-west-1
5. IAM → Create User
6. Permissions: S3 Full Access
7. Copy: Access Key + Secret
8. שולח לי
```

### שלב 5: הגדרת תשלומים (ישארטוב שבוע)
```
Tranzila:
1. פנייה ב-https://tranzila.com/contactus
2. מילוי טופס
3. המתנה לאישור (3-5 ימים)
4. קבלת טרמינל

GreenInvoice:
1. רישום ב-https://www.greeninvoice.co.il
2. בחירת תוכנית (99₪/חודש)
3. הגדרת עסק
4. API → Create Key
5. שולח לי פרטים
```

### שלב 6: ארגון תוכן (בהתאם לכמות)
```
תכין Excel/Google Sheets עם:

├── Series (גיליון 1)
│   ├── id | title | description | genre | poster_url
│   └── 1 | "סדרה 1" | "תיאור..." | "דרמה" | "url..."
│
├── Episodes (גיליון 2)
│   ├── series_id | season | episode_number | title | duration | video_url
│   └── 1 | 1 | 1 | "פרק ראשון" | "03:45" | "url..."
│
└── Pricing (גיליון 3)
    ├── series_id | season_pass_price | coin_price_per_episode
    └── 1 | 99 | 5

אני אקח את זה ואטען לDB אוטומטית!
```

---

## 📦 PART 4: מה אני אעשה אחרי שתספק את זה

### אוטומציה שלי:

```typescript
// 1. אני אכין סקריפט Database Seeding
async function seedDatabase() {
  // יצירת כל הטבלאות
  await createTables();
  
  // טעינת סדרות מהExcel שלך
  await loadSeries(yourExcelFile);
  
  // טעינת פרקים
  await loadEpisodes(yourExcelFile);
  
  // הגדרת מחירים
  await setupPricing(yourPricingData);
  
  // משתמשי טסט
  await createTestUsers();
  
  console.log('✅ Database ready!');
}

// 2. אני אעלה וידאו דוגמה
async function uploadSampleVideos() {
  // אם זה Cloudflare Stream
  await uploadToCloudflare(yourVideoFiles);
  
  // אם זה S3
  await uploadToS3(yourVideoFiles);
  
  // המרה ל-HLS אם צריך
  await convertToHLS();
  
  console.log('✅ Videos ready!');
}

// 3. אני אעשה Deploy
async function deployApp() {
  // Frontend → Vercel
  await deployToVercel();
  
  // Backend → Railway
  await deployToRailway();
  
  // הגדרת Environment Variables
  await setEnvVars(yourCredentials);
  
  console.log('✅ App is LIVE!');
}

// 4. אני אבדוק שהכל עובד
async function testEverything() {
  await testAuth();        // התחברות
  await testVideoPlay();   // נגן וידאו
  await testPayment();     // תשלום (sandbox)
  await testFavorites();   // מועדפים
  await testHistory();     // היסטוריה
  await testSharing();     // שיתוף
  
  console.log('✅ All systems GO!');
}
```

---

## 🎯 סיכום: מה אני צריך ממך עכשיו

### Priority 1 (תשובות מהירות):
1. ✅ **כמה תוכן יש?** (כמה סדרות, כמה פרקים)
2. ✅ **איפה הוידאו?** (אצלך במחשב? בענן? עדיין לא צילמת?)
3. ✅ **איזה תקציב?** ($10/חודש? $50? $100?)
4. ✅ **מתי רוצה launch?** (שבוע? חודש? 3 חודשים?)

### Priority 2 (לעשות השבוע):
1. ⏳ פתיחת חשבונות (Vercel, Supabase, Upstash) - 30 דקות
2. ⏳ העלאת וידאו לזמני ל-Google Drive - שעה
3. ⏳ יצירת Excel עם רשימת תוכן - שעה
4. ⏳ פנייה ל-Tranzila ו-GreenInvoice - 30 דקות

### Priority 3 (לעשות בשבועיים הקרובים):
1. 📅 אישור Tranzila (3-5 ימים)
2. 📅 הגדרת GreenInvoice (יום אחד)
3. 📅 צילום/עריכת תוכן נוסף (אם צריך)

---

## 🤝 איך נעבוד ביחד

### מה אני אעשה:
```
✅ כתיבת כל הקוד
✅ הגדרת כל התשתית
✅ אינטגרציה עם שירותים
✅ טסטים
✅ Deploy
✅ תיעוד
✅ Bug fixes
```

### מה אתה תעשה:
```
✅ לספק API Keys ופרטי גישה
✅ להעלות תוכן וידאו
✅ לאשר עיצובים והחלטות UX
✅ לטפל בדברים משפטיים (חשבונות, חוזים)
✅ לבדוק את האפליקציה
✅ לתת feedback
```

---

## ❓ שאלות לסיום

אנא ענה על השאלות הבאות כדי שאוכל להמשיך:

1. **תוכן**: האם יש לך וידאו מוכן? איפה? כמה?
2. **תקציב**: כמה אתה מוכן להשקיע בחודש? ($10? $50? $100?)
3. **טיימליין**: מתי אתה רוצה שהאפליקציה תהיה חיה?
4. **תשלומים**: האם יש לך עסק רשום? (צריך ל-Tranzila + GreenInvoice)
5. **גישה לחשבונות**: האם אתה יכול לפתוח חשבונות בשירותים הללו?

כשתענה, אני מיד אכין תוכנית פעולה מדויקת! 🚀

---

**Built with ❤️ - מוכן לעבודה!**
