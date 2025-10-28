'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { User, Download, CreditCard, CheckCircle, Bell, Heart, History, ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import NotificationSettings from '@/components/NotificationSettings';
import toast from 'react-hot-toast';

interface SeasonPass {
  id: string;
  orderId: string;
  status: string;
  finalPrice: number;
  currency: string;
  purchasedAt: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  series: {
    id: string;
    title: string;
    thumbnailUrl: string;
  };
}

export default function AccountPage() {
  const router = useRouter();
  const [passes, setPasses] = useState<SeasonPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'purchases'>('purchases');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const response = await apiClient.getMyPasses();
      if (response.success && response.data) {
        setPasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await apiClient.getInvoice(orderId);
      if (response.success && response.data?.invoiceUrl) {
        window.open(response.data.invoiceUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toast.success('התנתקת בהצלחה');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition mb-6"
        >
          <ArrowRight className="w-5 h-5" />
          <span>חזור</span>
        </button>

        {/* User Info Header */}
        <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl shadow p-8 mb-8 border border-pink-500/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.name || user?.email || 'החשבון שלי'}</h1>
              <p className="text-gray-300">{user?.email || 'נהל את החשבון שלך'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'purchases'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            רכישות
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'notifications'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            התראות
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'profile'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            פרופיל
          </button>
        </div>

        {/* My Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-gray-800 rounded-2xl shadow-xl">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                הרכישות שלי
              </h2>
            </div>

            <div className="p-6">
              {passes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-300 mb-4">עדיין לא רכשת סדרות</p>
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition"
                  >
                    חזור לעמוד הבית
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {passes.map((pass) => (
                    <div
                      key={pass.id}
                      className="border border-gray-700 rounded-xl p-6 hover:shadow-xl transition bg-gray-700/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          {/* Thumbnail */}
                          <img
                            src={pass.series.thumbnailUrl}
                            alt={pass.series.title}
                            className="w-20 h-28 object-cover rounded-lg"
                          />

                          {/* Details */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">
                              {pass.series.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">
                              מספר הזמנה: {pass.orderId}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                  pass.status === 'active'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {pass.status === 'active' && (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                {pass.status === 'active' ? 'פעיל' : pass.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              נרכש ב-{new Date(pass.purchasedAt).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <span className="text-2xl font-bold text-white">
                            ₪{pass.finalPrice}
                          </span>
                          {pass.invoiceUrl && (
                            <button
                              onClick={() => handleDownloadInvoice(pass.orderId)}
                              className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-600 transition text-sm text-white"
                            >
                              <Download className="h-4 w-4" />
                              הורד קבלה
                            </button>
                          )}
                          <Link
                            href={`/?series=${pass.series.id}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition text-sm"
                          >
                            צפה עכשיו
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <NotificationSettings />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Info */}
            {user && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">פרטי החשבון</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">שם</label>
                    <p className="text-white">{user.name || 'לא הוגדר'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">אימייל</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">תאריך הצטרפות</label>
                    <p className="text-white">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">קישורים מהירים</h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/favorites')}
                  className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <span className="text-white">המועדפים שלי</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                </button>

                <button
                  onClick={() => router.push('/history')}
                  className="w-full flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-500" />
                    <span className="text-white">היסטוריית צפייה</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 rotate-180" />
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-4 rounded-xl transition border border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              התנתק
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
