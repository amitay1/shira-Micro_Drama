# Push Notifications System

## Overview
מערכת התראות מלאה עם תמיכה ב-Web Push Notifications, תזכורות צפייה ועדכונים על תוכן חדש.

## Features Implemented

### ✅ Notification Service (`/services/notificationService.ts`)
- **Permission Management**: בקשת הרשאה והצגת סטטוס
- **Push Subscriptions**: רישום והסרה של subscriptions  
- **Local Notifications**: הצגת התראות מקומיות
- **Specialized Notifications**:
  - `notifyNewEpisode()` - פרקים חדשים
  - `notifyContinueWatching()` - תזכורות המשך צפייה
  - `scheduleReminder()` - תזכורות מתוזמנות
- **Background Sync**: סנכרון אוטומטי עם backend

### ✅ Notification Prompt (`/components/NotificationPrompt.tsx`)
- מופיע אחרי **דקה של שימוש**
- עיצוב כחול-סגול מושך
- רשימת יתרונות:
  - ✓ התראות על פרקים חדשים
  - ✓ תזכורות להמשך צפייה  
  - ✓ עדכונים על סדרות
- **"לא עכשיו"** - חוזר אחרי 3 ימים
- **התראת ברוך הבא** לאחר הפעלה

### ✅ Notification Settings (`/components/NotificationSettings.tsx`)
- **Toggle הפעלה/כיבוי** עם אנימציה
- **שליחת התראת בדיקה**
- **תזכורות מתוזמנות**: 1, 3, 6, 12, 24, 48, 72 שעות
- **סוגי התראות** (checkboxes):
  - פרקים חדשים ✓
  - המשך צפייה ✓
  - סדרות מומלצות ✓
- **אזהרה** אם דפדפן לא תומך

### ✅ Account Page Integration (`/app/account/page.tsx`)
- **3 טאבים**: רכישות, התראות, פרופיל
- עיצוב כהה עם גרדיינטים
- אינטגרציה מלאה של NotificationSettings
- כפתור חזרה
- כפתור התנתקות

### ✅ Backend API (`/routes/notifications.js`)
- **POST /api/notifications/subscribe** - רישום subscription
- **POST /api/notifications/unsubscribe** - ביטול subscription
- **GET /api/notifications** - קבלת רשימת התראות
- **PATCH /api/notifications/:id/read** - סימון כנקרא
- **POST /api/notifications/test** - שליחת התראת בדיקה (admin)
- **In-memory storage** (בייצור יעבור ל-DB)

### ✅ Service Worker Integration (`/public/sw.js`)
- **Push event listener** - מקבל התראות מהשרת
- **Notification click** - פותח את הדף הרלוונטי
- **Actions support**: "צפה עכשיו" / "סגור"
- **Badge & Icons**: משתמש ב-SVG

### ✅ Layout Integration
- NotificationPrompt מוסף ל-layout.tsx
- טוען אוטומטית בכל עמוד
- לא מפריע ל-InstallPrompt

## Usage Examples

### Request Permission
```typescript
import notificationService from '@/services/notificationService';

// בדוק תמיכה
if (notificationService.isSupported()) {
  // בקש הרשאה
  const granted = await notificationService.requestPermission();
  
  if (granted) {
    console.log('Notifications enabled!');
  }
}
```

### Send New Episode Notification
```typescript
await notificationService.notifyNewEpisode(
  'שקרים קטנים',
  'פרק 12 - הגילוי',
  345
);
```

### Send Continue Watching Reminder
```typescript
await notificationService.notifyContinueWatching(
  'האחיות שלי',
  'פרק 5 - ההחלטה',
  234,
  67 // 67% progress
);
```

### Schedule Reminder
```typescript
// תזכורת אחרי 24 שעות
notificationService.scheduleReminder(24);
```

### Show Custom Notification
```typescript
await notificationService.showNotification(
  'כותרת',
  {
    body: 'תוכן ההתראה',
    icon: '/icons/icon.svg',
    tag: 'custom-notification'
  }
);
```

## Configuration

### Environment Variables
Add to `.env.local`:

```bash
# VAPID Keys (generate with web-push library)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

### Generate VAPID Keys
```bash
# Install web-push
npm install -g web-push

# Generate keys
web-push generate-vapid-keys

# Output:
# Public Key: BHx...
# Private Key: yRq...
```

## Testing

### Test in Browser (Desktop)
1. פתח http://localhost:3001
2. חכה דקה → התראת prompt מופיעה
3. לחץ "הפעל התראות"
4. לך לדף חשבון → טאב התראות
5. לחץ "שלח התראת בדיקה"

### Test in Browser (Mobile)
1. פתח באנדרואיד Chrome: http://your-domain.com
2. חכה דקה לפרומפט
3. אשר התראות
4. סגור דפדפן
5. שלח התראה מהשרת
6. התראה תופיע בשורת ההתראות

### Test Service Worker Push
1. פתח DevTools → Application → Service Workers
2. בדוק ש-SW רשום ופעיל
3. לחץ "Push" ליד ה-SW
4. הכנס JSON:
```json
{
  "title": "Test",
  "body": "This is a test notification",
  "url": "/"
}
```
5. התראה תופיע

## Notification Types

### 1. New Episode
```typescript
{
  title: 'פרק חדש זמין!',
  body: 'שקרים קטנים - פרק 12',
  tag: 'episode-345',
  actions: [
    { action: 'watch', title: 'צפה עכשיו' },
    { action: 'later', title: 'אחר כך' }
  ]
}
```

### 2. Continue Watching
```typescript
{
  title: 'המשך מהמקום שעצרת',
  body: 'האחיות שלי - פרק 5 (67%)',
  tag: 'continue-234',
  actions: [
    { action: 'watch', title: 'המשך לצפות' },
    { action: 'dismiss', title: 'התעלם' }
  ]
}
```

### 3. Test Notification
```typescript
{
  title: 'התראת בדיקה',
  body: 'זוהי התראת בדיקה מ-Shira Shorts',
  icon: '/icons/icon.svg'
}
```

## Backend Implementation (Future)

### Send Push Notification
```javascript
const webpush = require('web-push');

// Configure VAPID
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send notification
async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Usage
const payload = {
  title: 'פרק חדש!',
  body: 'שקרים קטנים - פרק 12',
  url: '/watch/345',
};

sendPushNotification(userSubscription, payload);
```

## Browser Support

- ✅ Chrome 42+
- ✅ Firefox 44+
- ✅ Edge 17+
- ✅ Opera 37+
- ✅ Samsung Internet 4+
- ⚠️ Safari 16+ (limited support)
- ❌ iOS Safari (not supported yet)

## Troubleshooting

### Notifications Not Showing
- בדוק שההרשאה ניתנה (Notification.permission === 'granted')
- וודא ש-Service Worker רשום
- בדוק הגדרות דפדפן (אל תחסום התראות)
- בדוק שאתר מוגש דרך HTTPS

### Permission Denied
- משתמש סירב להרשאה
- אי אפשר לבקש שוב באותה הפעלה
- המשתמש צריך לאפשר ידנית בהגדרות דפדפן

### Service Worker Not Registering
- וודא שקובץ sw.js נמצא ב-/public
- בדוק שאין שגיאות syntax ב-sw.js
- נקה cache ו-unregister SW ישנים

### Prompt Not Appearing
- בדוק אם dismissed לאחרונה (< 3 ימים)
- וודא שההרשאה default (לא granted/denied)
- בדוק console לשגיאות

## Next Steps

1. ✅ **Task 6: Push Notifications** - הושלם!

2. **Optional Enhancements**:
   - 📊 Dashboard לניהול התראות (admin)
   - 📧 Email fallback אם push לא זמין
   - 🔔 Notification history בדף חשבון
   - 📱 Deep links לפרקים ספציפיים
   - ⏰ Smart timing (אל תשלח בלילה)
   - 🎯 Segmentation (התראות ממוקדות)

3. **Production Requirements**:
   - הגדר VAPID keys בייצור
   - העבר subscriptions ל-MongoDB
   - הוסף rate limiting
   - התקן web-push library בבאקאנד
   - הגדר HTTPS (חובה לפוש)

## Resources

- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push Library](https://github.com/web-push-libs/web-push)
- [VAPID Keys Guide](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/)
