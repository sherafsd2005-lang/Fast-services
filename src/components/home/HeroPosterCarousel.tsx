import React, { useState, useEffect } from 'react';
import { HeroPoster } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroPosterCarouselProps {
  posters: HeroPoster[];
  onSelectService: (category: string, service?: string) => void;
  onPostJob: () => void;
}

export const HeroPosterCarousel: React.FC<HeroPosterCarouselProps> = ({
  posters,
  onSelectService,
  onPostJob
}) => {
  const { lang, isUrdu } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activePosters = posters.filter(p => p.isActive);

  useEffect(() => {
    if (activePosters.length <= 1 || isPaused) return;

    const currentDuration = (activePosters[currentIndex]?.durationSeconds || 5) * 1000;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activePosters.length);
    }, currentDuration);

    return () => clearInterval(interval);
  }, [activePosters.length, currentIndex, isPaused]);

  if (!activePosters.length) return null;

  const current = activePosters[currentIndex] || activePosters[0];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activePosters.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activePosters.length) % activePosters.length);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Media with Gradient Overlay */}
      <div className="relative min-h-[380px] sm:min-h-[460px] md:min-h-[500px] flex items-center">
        {/* Dynamic Image with Fallback */}
        <div className="absolute inset-0 z-0">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transition-all duration-700 scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Graceful fallback to rich dark gradient mesh if local file load issue
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {/* Measured Scrim for WCAG AA Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 py-12 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold w-fit mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{current.category} · Verified Pros</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight max-w-2xl text-balance">
            {isUrdu ? current.titleUrdu : current.title}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
            {isUrdu ? current.subtitleUrdu : current.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onSelectService(current.category, current.serviceName)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm sm:text-base hover:bg-teal-400 transition shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>{isUrdu ? current.buttonTextUrdu : current.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onPostJob}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 backdrop-blur-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>{isUrdu ? 'مطلوبہ کام لگائیں' : 'Post Custom Job'}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mt-8 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CNIC Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>FIRST STEP Protected</span>
            </div>
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        {activePosters.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer border border-white/10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer border border-white/10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {activePosters.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {activePosters.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? 'w-6 bg-teal-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
