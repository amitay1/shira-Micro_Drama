'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import notificationService from '@/services/notificationService';
import toast from 'react-hot-toast';

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [reminderHours, setReminderHours] = useState<number>(24);

  useEffect(() => {
    if (!notificationService.isSupported()) {
      setSupported(false);
      return;
    }

    const status = notificationService.getPermissionStatus();
    setEnabled(status.granted);
  }, []);

  const handleToggleNotifications = async () => {
    if (!enabled) {
      // Request permission
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        setEnabled(true);
        toast.success('התראות הופעלו בהצלחה');
      } else {
        toast.error('לא ניתן להפעיל התראות. בדוק את הגדרות הדפדפן.');
      }
    } else {
      // Unsubscribe
      const success = await notificationService.unsubscribe();
      
      if (success) {
        setEnabled(false);
        toast.success('התראות בוטלו');
      } else {
        toast.error('שגיאה בביטול התראות');
      }
    }
  };

  const handleScheduleReminder = () => {
    if (!enabled) {
      toast.error('יש להפעיל התראות תחילה');
      return;
    }

    notificationService.scheduleReminder(reminderHours);
    toast.success(`תזכורת נקבעה ל-${reminderHours} שעות מעכשיו`);
  };

  const handleTestNotification = async () => {
    if (!enabled) {
      toast.error('יש להפעיל התראות תחילה');
      return;
    }

    await notificationService.showNotification('התראת בדיקה', {
      body: 'זוהי התראת בדיקה מ-Shira Shorts',
      icon: '/icons/icon.svg',
    });
    
    toast.success('התראת בדיקה נשלחה');
  };

  if (!supported) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-1">התראות לא נתמכות</h3>
            <p className="text-gray-300 text-sm">
              הדפדפן שלך לא תומך בהתראות או שהן חסומות. נסה דפדפן אחר או בדוק את ההגדרות.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {enabled ? (
              <Bell className="w-6 h-6 text-blue-500" />
            ) : (
              <BellOff className="w-6 h-6 text-gray-500" />
            )}
            <div>
              <h3 className="text-white font-semibold">התראות push</h3>
              <p className="text-gray-400 text-sm">
                {enabled ? 'התראות מופעלות' : 'התראות כבויות'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              enabled ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <button
            onClick={handleTestNotification}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition text-sm"
          >
            שלח התראת בדיקה
          </button>
        )}
      </div>

      {/* Reminder Settings */}
      {enabled && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-purple-500" />
            <div>
              <h3 className="text-white font-semibold">תזכורות צפייה</h3>
              <p className="text-gray-400 text-sm">קבע תזכורת להמשך צפייה</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">
                זמן עד לתזכורת (שעות)
              </label>
              <select
                value={reminderHours}
                onChange={(e) => setReminderHours(Number(e.target.value))}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>שעה אחת</option>
                <option value={3}>3 שעות</option>
                <option value={6}>6 שעות</option>
                <option value={12}>12 שעות</option>
                <option value={24}>יום אחד</option>
                <option value={48}>יומיים</option>
                <option value={72}>3 ימים</option>
              </select>
            </div>

            <button
              onClick={handleScheduleReminder}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              קבע תזכורת
            </button>
          </div>
        </div>
      )}

      {/* Notification Types */}
      {enabled && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">סוגי התראות</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-white text-sm font-medium">פרקים חדשים</p>
                <p className="text-gray-400 text-xs">התראה כשפרק חדש מתפרסם</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-white text-sm font-medium">המשך צפייה</p>
                <p className="text-gray-400 text-xs">תזכורות על פרקים שהתחלת</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-white text-sm font-medium">סדרות מומלצות</p>
                <p className="text-gray-400 text-xs">הצעות לסדרות חדשות</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-500 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!enabled && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">
            💡 הפעל התראות כדי לקבל עדכונים על פרקים חדשים ותזכורות להמשך צפייה.
            אתה יכול לכבות את ההתראות בכל עת.
          </p>
        </div>
      )}
    </div>
  );
}
