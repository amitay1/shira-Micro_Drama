'use client';

import { XCircle, ArrowRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { useEffect } from 'react';

export default function PaymentFailed() {
  useEffect(() => {
    // Track payment failure
    trackEvent({
      action: 'payment_failed',
      category: 'Monetization',
      label: 'Payment Page',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-red-500/20">
        {/* Failure Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
          <XCircle className="h-12 w-12 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          התשלום נכשל
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          לא הצלחנו לעבד את התשלום שלך
        </p>

        {/* Reasons */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 mb-6 text-right">
          <h3 className="font-bold text-white mb-3">סיבות אפשריות:</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>• פרטי האשראי שגויים</li>
            <li>• יתרה לא מספקת בכרטיס</li>
            <li>• בעיה זמנית בתקשורת</li>
            <li>• כרטיס חסום או פג תוקף</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            נסה שוב
            <ArrowRight className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="w-full px-6 py-3 border-2 border-gray-600 text-gray-300 font-medium rounded-xl hover:bg-gray-700 transition-colors inline-block"
          >
            חזור לעמוד הבית
          </Link>

          <Link
            href="/support"
            className="w-full px-6 py-3 text-pink-400 font-medium hover:underline inline-flex items-center justify-center gap-2"
          >
            <HelpCircle className="h-5 w-5" />
            צור קשר לתמיכה
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-sm text-gray-400">
          זקוק/ה לעזרה? צור/י איתנו קשר ואנחנו נשמח לעזור
        </p>
      </div>
    </div>
  );
}
