'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import notificationService from '@/services/notificationService';
import toast from 'react-hot-toast';

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    if (!notificationService.isSupported()) {
      return;
    }

    const status = notificationService.getPermissionStatus();
    
    if (status.granted) {
      setPermissionStatus('granted');
      return;
    }
    
    if (status.denied) {
      setPermissionStatus('denied');
      return;
    }

    // Check if user dismissed the prompt
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime();
      const now = new Date().getTime();
      const daysSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 3 days
      if (daysSinceDismissed < 3) {
        return;
      }
    }

    // Show prompt after 1 minute
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    
    if (granted) {
      setPermissionStatus('granted');
      setShowPrompt(false);
      toast.success('התראות הופעלו בהצלחה!');
      
      // Show welcome notification
      setTimeout(() => {
        notificationService.showNotification('התראות הופעלו', {
          body: 'תקבל התראה על פרקים חדשים ותזכורות להמשך צפייה',
          icon: '/icons/icon.svg',
        });
      }, 1000);
    } else {
      setPermissionStatus('denied');
      setShowPrompt(false);
      toast.error('לא ניתן להפעיל התראות');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', new Date().toISOString());
  };

  if (!showPrompt || permissionStatus !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-6 text-white">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Bell className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-2">קבל התראות על תוכן חדש</h3>
        <p className="text-white/90 text-sm mb-4">
          נודיע לך כשיהיו פרקים חדשים ונזכיר לך להמשיך לצפות בסדרות שהתחלת
        </p>

        {/* Features */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            התראות על פרקים חדשים
          </div>
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            תזכורות להמשך צפייה
          </div>
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            עדכונים על סדרות שאתה עוקב אחריהן
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleEnableNotifications}
            className="flex-1 bg-white text-blue-600 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition"
          >
            הפעל התראות
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-white/90 hover:text-white transition"
          >
            לא עכשיו
          </button>
        </div>
      </div>
    </div>
  );
}
