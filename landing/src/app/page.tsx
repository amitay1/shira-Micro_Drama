'use client';

import { useEffect } from 'react';
import { initGA, initMetaPixel, initTikTokPixel, trackPageView } from '@/lib/analytics';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ContinueWatching from '@/components/ContinueWatching';
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
    <main className="min-h-screen bg-black">
      {/* Header */}
      <Header />
      
      {/* Hero Section with Trailer */}
      <Hero />

      {/* Continue Watching Section */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto">
        <ContinueWatching />
      </section>

      {/* Episode Player Section */}
      <section className="py-12 px-4 bg-black">
        <EpisodePlayer />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
