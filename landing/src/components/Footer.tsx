'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function Footer() {
  const handleSocialClick = (platform: string) => {
    trackEvent({
      action: 'social_click',
      category: 'Social',
      label: platform,
      placement: 'footer',
    });
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">אודות</h3>
            <p className="text-gray-400 text-sm">
              Ananey Studios - פלטפורמת סטרימינג מובילה לסדרות מיקרו דרמה בעברית
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">קישורים</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  דף הבית
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  אודות
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white transition-colors">
                  תמיכה
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  שאלות נפוצות
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold mb-4">משפטי</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  תנאי שימוש
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  מדיניות פרטיות
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-400 hover:text-white transition-colors">
                  מדיניות ביטולים
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-gray-400 hover:text-white transition-colors">
                  הצהרת נגישות
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">עקבו אחרינו</h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick('facebook')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick('instagram')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick('tiktok')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="mailto:support@ananey.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>

            {/* Contact */}
            <div className="mt-6">
              <h4 className="font-bold mb-2">צור קשר</h4>
              <p className="text-sm text-gray-400">support@ananey.com</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Ananey Studios. כל הזכויות שמורות.</p>
          <p className="mt-2">
            תשלומים מאובטחים | הצפנת SSL | שירות לקוחות 24/7
          </p>
        </div>
      </div>
    </footer>
  );
}
