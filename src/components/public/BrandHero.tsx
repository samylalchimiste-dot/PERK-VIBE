import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Send } from 'lucide-react';
import { BrandSettings } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface BrandHeroProps {
  brand: BrandSettings;
  onExploreClick?: () => void;
}

export const BrandHero: React.FC<BrandHeroProps> = ({ brand, onExploreClick }) => {
  const navigate = useNavigate();

  const handleExplore = () => {
    hapticFeedback('medium');
    playClickSound();
    if (onExploreClick) {
      onExploreClick();
    } else {
      navigate('/shop');
    }
  };

  const handleTelegramContact = () => {
    hapticFeedback('light');
    const targetUrl = brand.contactLinks.botUrl || brand.contactLinks.telegram || 'https://t.me/PerkVibesFarmz_Bot';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800/80 shadow-2xl">
      {/* Cover Background Image with Dark Luxury Vignette */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        {brand.coverImage ? (
          <img
            src={brand.coverImage}
            alt={brand.brandName}
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-zinc-950" />
        )}

        {/* Elegant Multi-layered Dark Overlay for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-black/40" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/70 pointer-events-none" />

        {/* Badge Top Left */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-zinc-300 bg-black/60 backdrop-blur-md border border-zinc-700/60 shadow-lg">
            <Sparkles className="w-3 h-3 text-zinc-300" />
            {brand.badgeText || 'Collection Officielle'}
          </span>
        </div>

        {/* Fast Telegram link top right */}
        {brand.contactLinks?.botUsername && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleTelegramContact}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wide text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800/90 backdrop-blur-md border border-zinc-700/60 transition shadow-lg"
              title="Discuter avec le bot officiel"
            >
              <Send className="w-3 h-3 text-cyan-400" />
              <span>@{brand.contactLinks.botUsername}</span>
            </button>
          </div>
        )}
      </div>

      {/* Brand Profile Content (Overlapping Cover) */}
      <div className="relative px-6 pb-7 -mt-16 flex flex-col items-center text-center">
        {/* Circular Profile Photo / Logo */}
        <div className="relative mb-3.5 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-950 shadow-2xl">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              {brand.profileImage ? (
                <img
                  src={brand.profileImage}
                  alt={brand.brandName}
                  className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="font-extrabold text-2xl tracking-tighter text-emerald-400">
                  {brand.brandName || 'PERK VIBES FARMZ'}
                </span>
              )}
            </div>
          </div>

          {/* Verified Official Seal Dot */}
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-950 flex items-center justify-center text-[10px] text-emerald-400 shadow-md">
            ✓
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase mb-1">
          {brand.brandName || 'PERK VIBES FARMZ'}
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-400 max-w-sm mb-2">
          {brand.tagline || 'Extractions d\'Élite · 2x Static, Frozen Sift & Dry Sift'}
        </p>

        {/* Description */}
        <p className="text-xs text-zinc-400 font-normal leading-relaxed max-w-md mb-5">
          {brand.description}
        </p>

        {/* Primary Action Button: View Collection */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
          <button
            onClick={handleExplore}
            className="w-full group py-3 px-6 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-xl shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>{brand.heroCtaText || 'Découvrir la Collection'}</span>
            <ArrowRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
