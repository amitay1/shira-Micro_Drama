'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { seriesService } from '@/services/seriesService';
import toast from 'react-hot-toast';
import { CreditCard, Lock, Check, Tag, Loader2 } from 'lucide-react';

const paymentSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  phone: z.string().regex(/^05\d{8}$/, 'מספר טלפון לא תקין').optional().or(z.literal('')),
  cardNumber: z.string().regex(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, 'מספר כרטיס לא תקין'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'תאריך תפוגה לא תקין (MM/YY)'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV לא תקין'),
  idNumber: z.string().regex(/^\d{9}$/, 'תעודת זהות לא תקינה'),
  couponCode: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'חובה לאשר את התנאים',
  }),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.seriesId as string;

  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [pricing, setPricing] = useState({
    basePrice: 49.90,
    discount: 0,
    finalPrice: 49.90,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const couponCode = watch('couponCode');
  const cardNumber = watch('cardNumber');

  useEffect(() => {
    loadSeriesData();
  }, [seriesId]);

  useEffect(() => {
    // Auto-format card number
    if (cardNumber) {
      const formatted = cardNumber.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || cardNumber;
      if (formatted !== cardNumber) {
        setValue('cardNumber', formatted);
      }
    }
  }, [cardNumber, setValue]);

  const loadSeriesData = async () => {
    try {
      const data = await seriesService.getSeriesById(seriesId);
      setSeries(data);
      
      const price = data?.seasonPassPrice || 49.90;
      setPricing({
        basePrice: price,
        discount: 0,
        finalPrice: price,
      });
    } catch (error) {
      console.error('Failed to load series:', error);
      toast.error('שגיאה בטעינת הסדרה');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode || couponCode.trim() === '') {
      toast.error('אנא הזן קוד קופון');
      return;
    }

    try {
      setCouponLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          seriesId: seriesId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'קופון לא תקין');
      }

      const discount = result.data.discount;
      setPricing(prev => ({
        ...prev,
        discount: discount,
        finalPrice: prev.basePrice - discount,
      }));
      setCouponApplied(true);
      toast.success(`✅ קופון הופעל! ₪${discount} הנחה`);
    } catch (error: any) {
      toast.error(error.message || 'קופון לא תקין');
    } finally {
      setCouponLoading(false);
    }
  };

  const onSubmit = async (data: PaymentForm) => {
    try {
      setProcessing(true);

      // Create payment transaction
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          seriesId: seriesId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          cardNumber: data.cardNumber.replace(/\s/g, ''),
          expiryDate: data.expiryDate,
          cvv: data.cvv,
          idNumber: data.idNumber,
          couponCode: couponApplied ? data.couponCode : undefined,
          amount: pricing.finalPrice,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'שגיאה בביצוע התשלום');
      }

      // Success - redirect to success page
      toast.success('התשלום בוצע בהצלחה! 🎉');
      router.push(`/payment/success?orderId=${result.data.orderId}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'שגיאה בביצוע התשלום');
      router.push(`/payment/failed?error=${encodeURIComponent(error.message)}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-4">הסדרה לא נמצאה</h1>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-pink-600 rounded-lg hover:bg-pink-700 transition"
          >
            חזור
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          חזור
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">פרטי תשלום</h1>
                  <p className="text-gray-400 text-sm">מלא את הפרטים לסיום הרכישה</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    פרטים אישיים
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        שם מלא *
                      </label>
                      <input
                        {...register('name')}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="שם מלא"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        תעודת זהות *
                      </label>
                      <input
                        {...register('idNumber')}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="123456789"
                        maxLength={9}
                        dir="ltr"
                      />
                      {errors.idNumber && (
                        <p className="mt-1 text-sm text-red-500">{errors.idNumber.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        אימייל *
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="your@email.com"
                        dir="ltr"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        טלפון (אופציונלי)
                      </label>
                      <input
                        {...register('phone')}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        placeholder="0501234567"
                        dir="ltr"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4 pt-6 border-t border-gray-700">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    פרטי כרטיס אשראי
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      מספר כרטיס *
                    </label>
                    <input
                      {...register('cardNumber')}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-mono"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      dir="ltr"
                    />
                    {errors.cardNumber && (
                      <p className="mt-1 text-sm text-red-500">{errors.cardNumber.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        תוקף *
                      </label>
                      <input
                        {...register('expiryDate')}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-mono"
                        placeholder="MM/YY"
                        maxLength={5}
                        dir="ltr"
                      />
                      {errors.expiryDate && (
                        <p className="mt-1 text-sm text-red-500">{errors.expiryDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        CVV *
                      </label>
                      <input
                        {...register('cvv')}
                        type="password"
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-mono"
                        placeholder="123"
                        maxLength={3}
                        dir="ltr"
                      />
                      {errors.cvv && (
                        <p className="mt-1 text-sm text-red-500">{errors.cvv.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="pt-6 border-t border-gray-700">
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    קוד קופון (אופציונלי)
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register('couponCode')}
                      className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 uppercase"
                      placeholder="הזן קוד קופון"
                      disabled={couponApplied}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponApplied || couponLoading}
                      className="px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition"
                    >
                      {couponLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : couponApplied ? '✓' : 'החל'}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 pt-4">
                  <input
                    type="checkbox"
                    {...register('acceptTerms')}
                    className="mt-1 h-5 w-5 text-pink-600 rounded border-gray-600 bg-gray-900/50 focus:ring-2 focus:ring-pink-500"
                  />
                  <label className="text-sm text-gray-300">
                    אני מסכים/ה ל
                    <a href="/terms" target="_blank" className="text-pink-500 hover:text-pink-400 underline mx-1">
                      תנאי השימוש
                    </a>
                    ול
                    <a href="/privacy" target="_blank" className="text-pink-500 hover:text-pink-400 underline mx-1">
                      מדיניות הפרטיות
                    </a>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      מעבד תשלום...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      שלם ₪{pricing.finalPrice.toFixed(2)}
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Lock className="w-4 h-4" />
                  תשלום מאובטח ומוצפן
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6">סיכום הזמנה</h2>

              {/* Series Info */}
              <div className="mb-6">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                  <Image
                    src={series.posterUrl || series.thumbnailUrl || '/placeholder.jpg'}
                    alt={series.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{series.title}</h3>
                <p className="text-sm text-gray-400">{series.totalEpisodes} פרקים</p>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3 py-4 border-t border-gray-700">
                <div className="flex justify-between text-gray-300">
                  <span>מחיר בסיס:</span>
                  <span className={couponApplied ? 'line-through text-gray-500' : ''}>
                    ₪{pricing.basePrice.toFixed(2)}
                  </span>
                </div>
                
                {couponApplied && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      הנחת קופון:
                    </span>
                    <span>-₪{pricing.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-white">סה"כ:</span>
                    <span className="text-3xl font-extrabold text-pink-500">
                      ₪{pricing.finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>גישה מלאה לכל הפרקים</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>צפייה ללא הגבלה</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>תמיכה באיכות HD</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>גישה מכל מכשיר</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
