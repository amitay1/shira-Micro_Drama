'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { trackPurchase } from '@/lib/analytics';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      router.push('/');
      return;
    }

    // Track purchase
    trackPurchase({
      transactionId: orderId,
      value: 49.90,
      currency: 'ILS',
      items: [{ item_id: 'season-pass', item_name: 'Season Pass', price: 49.90 }],
    });

    setLoading(false);
  }, [searchParams, router]);

  const handleDownloadInvoice = async () => {
    const orderId = searchParams.get('orderId');
    if (!orderId) return;

    try {
      const response = await apiClient.get(`/season-pass/invoice/${orderId}`);
      if (response.success && response.data?.invoiceUrl) {
        window.open(response.data.invoiceUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-green-500/20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6 animate-pulse">
          <CheckCircle className="h-12 w-12 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          התשלום בוצע בהצלחה!
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          קיבלת גישה מלאה לכל הסדרה 🎉
        </p>

        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6 text-right">
          <div className="flex justify-between mb-3">
            <span className="text-gray-400">מספר הזמנה:</span>
            <span className="font-mono font-bold text-white">
              {searchParams.get('orderId')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">קבלה נשלחה למייל</span>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            התחל לצפות
            <ArrowRight className="h-5 w-5" />
          </Link>

          <button
            onClick={handleDownloadInvoice}
            className="w-full px-6 py-3 border-2 border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            הורד קבלה
          </button>

          <Link
            href="/account"
            className="w-full px-6 py-3 text-green-400 font-medium hover:underline inline-block"
          >
            עבור לחשבון שלי
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
