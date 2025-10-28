'use client';

import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזור
          </button>
        </div>

        <h1 className="text-5xl font-bold text-white mb-8 text-center">אודות שירה</h1>
        
        <div className="bg-gray-800 rounded-2xl p-8 mb-8">
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            ברוכים הבאים לשירה - פלטפורמת הסטרימינג המובילה לסדרות דרמה רומנטיות בעברית.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            אנחנו מביאים לכם את הסדרות הטובות ביותר, עם תוכן איכותי ומרתק שיגרום לכם להתמכר.
            כל סדרה מיוצרת במיוחד עבורכם, עם תסריטים מקוריים, שחקנים מוכשרים וביצוע ברמה הגבוהה ביותר.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            הצטרפו אלינו למסע רגשי מרתק שלא תרצו שייגמר!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-pink-500 text-4xl font-bold mb-2">100+</div>
            <div className="text-gray-300">פרקים זמינים</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-pink-500 text-4xl font-bold mb-2">10+</div>
            <div className="text-gray-300">סדרות מקוריות</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-pink-500 text-4xl font-bold mb-2">24/7</div>
            <div className="text-gray-300">זמינות מלאה</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">למה לבחור בשירה?</h2>
          <div className="grid md:grid-cols-2 gap-6 text-right mt-8">
            <div>
              <h3 className="text-pink-500 font-bold text-xl mb-2">תוכן איכותי</h3>
              <p className="text-gray-300">סדרות מקוריות עם ביצוע מקצועי</p>
            </div>
            <div>
              <h3 className="text-pink-500 font-bold text-xl mb-2">פרקים חדשים</h3>
              <p className="text-gray-300">תוכן חדש מתעדכן באופן קבוע</p>
            </div>
            <div>
              <h3 className="text-pink-500 font-bold text-xl mb-2">צפייה ללא הגבלה</h3>
              <p className="text-gray-300">צפו בכל הסדרות ללא הגבלת זמן</p>
            </div>
            <div>
              <h3 className="text-pink-500 font-bold text-xl mb-2">מחיר משתלם</h3>
              <p className="text-gray-300">מנויים ומחירים הוגנים לכולם</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
