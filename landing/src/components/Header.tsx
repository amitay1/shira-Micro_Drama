'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [language, setLanguage] = useState('he');
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-white font-bold text-xl">Ananey Studios</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors font-medium">
              בית
            </Link>
            <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
              חיפוש
            </Link>
            <Link href="/#episodes" className="text-gray-400 hover:text-white transition-colors">
              סדרות
            </Link>
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
              אודות
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button 
              onClick={() => router.push('/search')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Download */}
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* History */}
            <button 
              onClick={() => router.push('/history')}
              className="text-gray-400 hover:text-white transition-colors"
              title="היסטוריית צפייה"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Language */}
            <button 
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
              onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-sm font-medium">{language === 'he' ? 'עברית' : 'English'}</span>
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:scale-110 transition-transform"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {user.full_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <p className="text-white font-semibold text-sm">{user.full_name}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      החשבון שלי
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      המועדפים שלי
                    </Link>
                    <Link
                      href="/account/purchases"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      הרכישות שלי
                    </Link>
                    <Link
                      href="/history"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      היסטוריית צפייה
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition"
                    >
                      התנתק
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
                >
                  התחבר
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition"
                >
                  הירשם
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
