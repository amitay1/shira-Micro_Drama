'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { trackEvent } from '@/lib/analytics';
import { mockSeries } from '@/data/mockSeries';

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalSlides = mockSeries.length;

  useEffect(() => {
    // Auto-advance carousel every 5 seconds
    const interval = setInterval(() => {
      if (!isPlaying) {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, totalSlides]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const currentSeries = mockSeries[currentSlide];

  const handlePlayTrailer = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        trackEvent({
          action: 'view_trailer',
          category: 'Video',
          label: 'Hero Trailer',
        });
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <section className="relative w-full h-[600px] md:h-[700px] bg-black overflow-hidden">
      {/* Navigation Arrows */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Background Poster/Video */}
      <div className="absolute inset-0">
        {!isPlaying ? (
          <div 
            className="w-full h-full bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.3)), url(${currentSeries.bannerUrl})`
            }}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            onEnded={handleVideoEnded}
            playsInline
            controls={false}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          >
          </video>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex items-end h-full px-8 pb-20">
        <div className="max-w-2xl">
          {/* Genre & Rating */}
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded">
              {currentSeries.genre}
            </span>
            <span className="text-yellow-400 flex items-center gap-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {currentSeries.rating}
            </span>
            <span className="text-gray-300 text-sm">
              {currentSeries.totalEpisodes} פרקים
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {currentSeries.title}
          </h1>

          {/* Description */}
          <p className="text-gray-200 text-lg mb-6">
            {currentSeries.description}
          </p>

          {/* Play Button */}
          <button
            onClick={handlePlayTrailer}
            className="px-8 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-md text-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            {isPlaying ? 'השהה' : 'נגן'}
          </button>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {mockSeries.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
