'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-pink-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
            />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-white mb-4">אין חיבור לאינטרנט</h1>
        <p className="text-gray-300 mb-8 max-w-md mx-auto">
          נראה שאין לך חיבור לאינטרנט כרגע. בדוק את החיבור ונסה שוב.
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition"
        >
          נסה שוב
        </button>

        {/* Tips */}
        <div className="mt-12 text-right max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-white mb-4">טיפים לפתרון בעיות:</h2>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-pink-500 ml-2">•</span>
              בדוק שה-WiFi או הנתונים הסלולריים מופעלים
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 ml-2">•</span>
              נסה להפעיל ולכבות את מצב טיסה
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 ml-2">•</span>
              התקרב לנתב ה-WiFi
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 ml-2">•</span>
              אתחל את הראוטר שלך
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
