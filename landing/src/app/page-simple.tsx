'use client';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-6xl font-bold mb-4 drop-shadow-2xl">
          שירה
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          סדרת מיקרו דרמה מרתקת
        </h2>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
          צפו ב-10 הפרקים הראשונים בחינם!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-lg transition-all transform hover:scale-105 shadow-lg">
            ▶ התחילו לצפות עכשיו
          </button>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl">
          {Array.from({ length: 10 }, (_, i) => (
            <div 
              key={i}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition cursor-pointer"
            >
              <div className="aspect-video bg-gray-700 rounded mb-2 flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
              <p className="text-sm font-bold">פרק {i + 1}</p>
              <p className="text-xs text-gray-400">חינם</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4 text-center">
        <p className="text-gray-400">© 2025 שירה - כל הזכויות שמורות</p>
      </footer>
    </main>
  );
}
