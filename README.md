# 🎬 Shira Streaming Platform

אפליקציית סטרימינג אנכית מלאה (בסגנון ReelShort) עם תמיכה ב-iOS, Android, Web, וממשק ניהול תוכן.

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [תכונות עיקריות](#תכונות-עיקריות)
- [ארכיטקטורה](#ארכיטקטורה)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [דרישות מערכת](#דרישות-מערכת)
- [התקנה](#התקנה)
- [הפעלה](#הפעלה)
- [פיצ'רים](#פיצ'רים)
- [טכנולוגיות](#טכנולוגיות)
- [תיעוד](#תיעוד)

## 🎯 סקירה כללית

פלטפורמת סטרימינג מתקדמת המותאמת לוידאו אנכי (9:16) עם מערכת מונטיזציה מלאה:
- **מטבעות וירטואליים** - רכישה ושימוש במטבעות לפתיחת תוכן
- **מנויים** - תוכניות מנוי חודשיות/שנתיות
- **הורדה לצפייה אופליין** - צפייה ללא אינטרנט
- **DRM** - הגנה על תוכן עם FairPlay ו-Widevine
- **המלצות מותאמות אישית** - מערכת המלצות חכמה
- **אנליטיקס מתקדם** - מעקב מלא אחר צפייה והתנהגות משתמשים

## ⭐ תכונות עיקריות

### לצופים (Users)
- ✅ רישום והתחברות (Email/Social)
- ✅ פרופיל משתמש מלא
- ✅ צפייה בסדרות ופרקים
- ✅ המשך צפייה מנקודת עצירה
- ✅ רשימת מועדפים
- ✅ היסטוריית צפייה
- ✅ חיפוש ופילטור תוכן
- ✅ המלצות מותאמות אישית
- ✅ הורדה לצפייה אופליין
- ✅ רכישת מטבעות ומנויים
- ✅ דירוגים וביקורות

### ליוצרי תוכן (CMS)
- ✅ העלאת וידאו
- ✅ ניהול סדרות ופרקים
- ✅ תמלול אוטומטי לוידאו
- ✅ יצירת תמונות ממוזערות
- ✅ הגדרת מחירים (מטבעות/מנוי)
- ✅ תזמון פרסום תוכן
- ✅ אנליטיקס לכל וידאו
- ✅ ניהול משתמשים

### למפתחים (Tech Stack)
- ✅ Backend API מלא (Node.js + Express)
- ✅ Native iOS App (Swift + SwiftUI)
- ✅ Native Android App (Kotlin + Compose)
- ✅ CMS Web Panel (React)
- ✅ Video Pipeline (FFmpeg + AWS)
- ✅ מערכת תשלומים (Apple/Google/Stripe)
- ✅ Push Notifications (Firebase)
- ✅ Real-time Analytics
- ✅ CI/CD Pipeline

## 🏗️ ארכיטקטורה

```
┌─────────────────────────────────────────────────────┐
│                   CDN (CloudFront)                  │
│              Video Delivery + Caching               │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────┐
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   iOS App   │  │ Android App │  │  Web CMS   │  │
│  │             │  │             │  │            │  │
│  │ Swift/      │  │ Kotlin/     │  │ React/     │  │
│  │ SwiftUI     │  │ Compose     │  │ TypeScript │  │
│  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │         │
│         └────────────────┴────────────────┘         │
│                          │                          │
│                          ▼                          │
│              ┌───────────────────────┐              │
│              │   Backend API Server  │              │
│              │   Node.js + Express   │              │
│              └───────────┬───────────┘              │
│                          │                          │
│         ┌────────────────┼────────────────┐         │
│         │                │                │         │
│         ▼                ▼                ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │PostgreSQL│    │ MongoDB  │    │  Redis   │     │
│  │          │    │          │    │          │     │
│  │Users,    │    │Analytics,│    │Cache,    │     │
│  │Content,  │    │Logs      │    │Sessions  │     │
│  │Purchases │    │          │    │          │     │
│  └──────────┘    └──────────┘    └──────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    ┌──────────┐        ┌──────────────┐
    │   AWS    │        │   Firebase   │
    │          │        │              │
    │S3, Media-│        │Push Notifi-  │
    │Convert,  │        │cations       │
    │DRM       │        │              │
    └──────────┘        └──────────────┘
```

## 📁 מבנה הפרויקט

```
D:\shira APP\
├── backend/                 # Backend API Server
│   ├── src/
│   │   ├── config/         # הגדרות מסד נתונים, Redis, וכו'
│   │   ├── models/         # מודלים של מסד נתונים
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # לוגיקה עסקית
│   │   ├── middleware/     # Authentication, validation
│   │   ├── services/       # שירותים חיצוניים (וידאו, תשלומים)
│   │   ├── utils/          # פונקציות עזר
│   │   └── app.js          # נקודת כניסה ראשית
│   ├── tests/              # בדיקות
│   ├── package.json
│   └── README.md
│
├── ios/                     # iOS Native App
│   ├── ShiraApp/
│   │   ├── Models/         # Data models
│   │   ├── Views/          # SwiftUI views
│   │   ├── ViewModels/     # Business logic
│   │   ├── Services/       # API, Video, Payment
│   │   ├── Utils/          # Helpers
│   │   └── Resources/      # Assets, strings
│   ├── ShiraApp.xcodeproj
│   └── README.md
│
├── android/                 # Android Native App
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/.../shira/
│   │   │   │   │   ├── data/      # Models, repositories
│   │   │   │   │   ├── ui/        # Compose screens
│   │   │   │   │   ├── viewmodel/ # ViewModels
│   │   │   │   │   ├── service/   # Background services
│   │   │   │   │   └── util/      # Utilities
│   │   │   │   └── res/           # Resources
│   │   └── build.gradle
│   ├── build.gradle
│   └── README.md
│
├── cms/                     # Content Management System
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Pages/routes
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities
│   │   └── App.tsx
│   ├── package.json
│   └── README.md
│
├── shared/                  # Shared Code
│   ├── types/              # TypeScript types
│   ├── models/             # Shared models
│   ├── constants/          # Constants
│   └── utils/              # Shared utilities
│
├── docs/                    # Documentation
│   ├── api.md              # API documentation
│   ├── setup.md            # Setup guide
│   ├── deployment.md       # Deployment guide
│   ├── video-pipeline.md   # Video processing
│   └── payments.md         # Payment integration
│
├── infrastructure/          # DevOps
│   ├── docker/             # Docker configs
│   ├── kubernetes/         # K8s manifests
│   ├── ci-cd/              # CI/CD pipelines
│   └── terraform/          # Infrastructure as Code
│
└── README.md               # זה המסמך!
```

## 💻 דרישות מערכת

### Backend
- Node.js 18+
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- FFmpeg (לעיבוד וידאו)

### iOS
- macOS 12+ (Monterey)
- Xcode 14+
- iOS 15+ (Target)
- CocoaPods או Swift Package Manager

### Android
- Android Studio Flamingo+
- Gradle 8+
- Android SDK 24+ (Target: 34)
- Kotlin 1.9+

### CMS (Web)
- Node.js 18+
- npm או yarn
- דפדפן מודרני

### שירותים חיצוניים
- AWS Account (S3, CloudFront, MediaConvert)
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- Firebase Project (חינם)
- Optional: Stripe Account (לתשלומים באתר)

## 🚀 התקנה

### 1. Clone הפרויקט
```bash
cd "D:\shira APP"
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# ערוך .env עם ההגדרות שלך
npm run migrate
npm run dev
```

### 3. iOS Setup
```bash
cd ../ios
pod install  # או Swift Package Manager
open ShiraApp.xcodeproj
# הגדר את Bundle ID, Team, וכו'
# Build and Run
```

### 4. Android Setup
```bash
cd ../android
# פתח ב-Android Studio
# Sync Gradle
# Run on emulator/device
```

### 5. CMS Setup
```bash
cd ../cms
npm install
cp .env.example .env
# ערוך .env
npm start
```

## 🎮 הפעלה

### Development Mode

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - CMS
cd cms && npm start

# Terminal 3 - iOS (or use Xcode)
cd ios && open ShiraApp.xcodeproj

# Terminal 4 - Android (or use Android Studio)
cd android && ./gradlew installDebug
```

### Production Mode

ראה [Deployment Guide](./docs/deployment.md)

## 🎨 פיצ'רים מתקדמים

### מערכת וידאו
- ✅ Adaptive Bitrate Streaming (ABR)
- ✅ HLS (iOS) + DASH (Android)
- ✅ DRM (FairPlay + Widevine)
- ✅ Transcoding אוטומטי
- ✅ Multiple resolutions (240p-1080p)
- ✅ Thumbnails ו-Preview clips

### מונטיזציה
- ✅ In-App Purchases (iOS + Android)
- ✅ מערכת מטבעות וירטואליים
- ✅ מנויים (חודשי/שנתי)
- ✅ Freemium Model
- ✅ תמיכה ב-Trials
- ✅ Promotional codes
- ✅ Receipt Validation

### אנליטיקס
- ✅ מעקב צפייה בזמן אמת
- ✅ Retention metrics
- ✅ Conversion tracking
- ✅ A/B testing
- ✅ User behavior analytics
- ✅ Revenue analytics

## 🛠️ טכנולוגיות

### Backend
- Node.js + Express.js
- PostgreSQL (Sequelize ORM)
- MongoDB (Mongoose)
- Redis (ioredis)
- JWT Authentication
- Winston (Logging)

### iOS
- Swift 5.9
- SwiftUI
- AVFoundation (Video)
- StoreKit 2 (Payments)
- Combine
- URLSession

### Android
- Kotlin 1.9
- Jetpack Compose
- ExoPlayer (Video)
- Play Billing Library
- Coroutines + Flow
- Retrofit

### CMS/Web
- React 18
- TypeScript
- Tailwind CSS
- Axios
- React Router
- Recharts (Analytics)

### Infrastructure
- AWS (S3, CloudFront, MediaConvert)
- Firebase (Push Notifications)
- Docker + Kubernetes
- GitHub Actions (CI/CD)

## 📚 תיעוד מפורט

- [📖 Backend API Documentation](./backend/README.md)
- [📱 iOS App Documentation](./ios/README.md)
- [🤖 Android App Documentation](./android/README.md)
- [💻 CMS Documentation](./cms/README.md)
- [🎥 Video Pipeline Guide](./docs/video-pipeline.md)
- [💳 Payment Integration](./docs/payments.md)
- [🔒 DRM Setup Guide](./docs/drm.md)
- [🚀 Deployment Guide](./docs/deployment.md)

## 📊 תוכנית פיתוח (Roadmap)

### Phase 1: Foundation ✅ (חודשים 0-2)
- [x] Project structure
- [x] Backend API basic
- [x] Database schema
- [x] Authentication
- [x] Basic models

### Phase 2: Core Features 🚧 (חודשים 2-4)
- [ ] Video player (iOS + Android)
- [ ] HLS/DASH integration
- [ ] DRM setup
- [ ] Content upload pipeline
- [ ] Transcoding integration

### Phase 3: Monetization (חודשים 4-6)
- [ ] In-App Purchases
- [ ] Coin system
- [ ] Subscription management
- [ ] Receipt validation
- [ ] Paywall screens

### Phase 4: Enhancement (חודשים 6-8)
- [ ] CMS development
- [ ] Recommendation engine
- [ ] Push notifications
- [ ] Offline downloads
- [ ] Analytics dashboard

### Phase 5: Launch (חודשים 8-9)
- [ ] Beta testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] App Store submission
- [ ] Marketing campaign

## 🤝 עבודת צוות

זהו פרויקט שיתופי! כאשר אתה מגיע לשלב שדורש הגדרות חיצוניות:

### תפקידך (המשתמש):
1. ✅ פתיחת חשבונות (AWS, Apple, Google)
2. ✅ הגדרת פרטי תשלום
3. ✅ קבלת API Keys
4. ✅ העלאת אפליקציות לחנויות
5. ✅ הגדרת DNS ו-Domains

### התפקיד שלי (Claude):
1. ✅ כתיבת כל הקוד
2. ✅ הגדרת ארכיטקטורה
3. ✅ אינטגרציה עם שירותים
4. ✅ תיעוד מפורט
5. ✅ טיפול בבאגים

**כשאתה מוכן לשלב הבא - פשוט תגיד!**

## ⚠️ הערות חשובות

- 🔒 אף פעם לא להעלות `.env` ל-Git
- 🔑 להשתמש תמיד ב-Environment Variables למידע רגיש
- 💰 לבדוק תשלומים ב-Sandbox לפני Production
- 📊 לעקוב אחר עלויות Transcoding
- 🔐 להשתמש ב-DRM לתוכן פרימיום
- 💾 Cache aggressively
- 🧪 לכתוב בדיקות
- 📈 לנטר ביצועים

## 🎯 מה הלאה?

אנחנו נמצאים כאן: **Phase 1 - Foundation** ✅

המבנה הבסיסי של ה-Backend מוכן!

**הצעד הבא:**
1. להשלים את כל ה-Routes והControllers
2. ליצור את אפליקציות ה-Mobile
3. לבנות את ה-CMS
4. להגדיר וידאו pipeline

**תגיד מה אתה רוצה לעשות עכשיו:**
- ✅ להמשיך לבנות את ה-Backend?
- 📱 להתחיל עם iOS?
- 🤖 להתחיל עם Android?
- 💻 לבנות את ה-CMS?
- 📹 להגדיר Video Pipeline?

**אני מוכן למשימה הבאה!** 🚀

---

**Built with ❤️ by Team Shira**
