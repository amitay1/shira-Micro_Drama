'use client';

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Space / K', action: 'נגן/השהה' },
    { key: '←', action: 'חזור 10 שניות' },
    { key: '→', action: 'קפוץ קדימה 10 שניות' },
    { key: 'J', action: 'חזור 10 שניות' },
    { key: 'L', action: 'קפוץ קדימה 10 שניות' },
    { key: '↑', action: 'הגבר עוצמה' },
    { key: '↓', action: 'הנמך עוצמה' },
    { key: 'M', action: 'השתק/בטל השתקה' },
    { key: 'F', action: 'מסך מלא' },
    { key: 'N', action: 'פרק הבא' },
    { key: 'P', action: 'פרק קודם' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-3 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-110"
        title="קיצורי מקלדת"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">קיצורי מקלדת</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition"
            >
              <span className="text-gray-300">{shortcut.action}</span>
              <kbd className="px-3 py-1 bg-gray-700 text-white font-mono text-sm rounded border border-gray-600">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Mobile Gestures */}
        <div className="p-6 border-t border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">מחוות מגע</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">החלק למעלה</span>
              <span className="text-pink-500 text-sm font-medium">פרק הבא</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">החלק למטה</span>
              <span className="text-pink-500 text-sm font-medium">פרק קודם</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">לחיצה כפולה (שמאל)</span>
              <span className="text-pink-500 text-sm font-medium">חזור 10 שניות</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-gray-300">לחיצה כפולה (ימין)</span>
              <span className="text-pink-500 text-sm font-medium">קפוץ 10 שניות</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-lg hover:from-pink-700 hover:to-purple-700 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
