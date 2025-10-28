'use client';

import { useRouter } from 'next/navigation';
import { trackBeginCheckout } from '@/lib/analytics';
import { X, CreditCard, Check, Lock } from 'lucide-react';

interface PaywallProps {
  seriesId: string;
  seriesTitle?: string;
  seriesPrice?: number;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

export default function Paywall({
  seriesId,
  seriesTitle = 'סדרת שירה',
  seriesPrice = 49.90,
  onClose,
  onPurchaseComplete,
}: PaywallProps) {
  const router = useRouter();

  const handleProceedToPayment = () => {
    // Track begin checkout
    trackBeginCheckout({
      value: seriesPrice,
      currency: 'ILS',
      items: [
        {
          item_id: seriesId,
          item_name: seriesTitle,
          price: seriesPrice,
        },
      ],
    });

    // Navigate to payment page
    router.push(`/payment/${seriesId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl border border-pink-500/20">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 rounded-full p-2 hover:bg-gray-700 transition-colors z-10"
          >
            <X className="h-6 w-6 text-gray-300" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-4 shadow-lg">
                <CreditCard className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                פתח/י גישה מלאה
              </h2>
              <p className="text-lg text-gray-300">
                צפו בכל הפרקים של {seriesTitle} ללא הגבלה
              </p>
            </div>

            {/* Pricing Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
                  ₪{seriesPrice.toFixed(2)}
                </div>
                <p className="text-gray-400">תשלום חד פעמי</p>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>גישה מלאה לכל הפרקים</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>צפייה ללא הגבלה</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>תמיכה באיכות HD</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>גישה מכל מכשיר</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>ללא מנוי חודשי</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleProceedToPayment}
              className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3 mb-4"
            >
              <Lock className="w-5 h-5" />
              המשך לתשלום מאובטח
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              תשלום מאובטח ומוצפן
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-gray-500 mt-4">
              בלחיצה על "המשך לתשלום" אתה מאשר את{' '}
              <a href="/terms" target="_blank" className="text-pink-400 hover:underline">
                התנאים וההגבלות
              </a>
              {' '}ו
              <a href="/privacy" target="_blank" className="text-pink-400 hover:underline">
                מדיניות הפרטיות
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
