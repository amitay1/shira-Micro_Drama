'use client';

import { useEffect } from 'react';
import { initGA, initMetaPixel, initTikTokPixel, trackPageView } from '@/lib/analytics';
import Hero from '@/components/Hero';
import EpisodePlayer from '@/components/EpisodePlayer';
import Paywall from '@/components/Paywall';
import Footer from '@/components/Footer';

export default function HomePage() {
  useEffect(() => {
    // Initialize analytics
    initGA();
    initMetaPixel();
    initTikTokPixel();
    trackPageView('/');
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Trailer */}
      <Hero />

      {/* Episode Player Section */}
      <section className="py-8 px-4">
        <EpisodePlayer />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
