import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Award, ShoppingBag, Users, Sparkles, ChevronRight } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { getTelegramUser, hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [notifyNewProducts, setNotifyNewProducts] = useState(() => {
    return localStorage.getItem('tm_notif_products') !== 'false';
  });
  const [notifyPromotions, setNotifyPromotions] = useState(() => {
    return localStorage.getItem('tm_notif_promos') !== 'false';
  });

  const tgUser = useMemo(() => {
    const u = getTelegramUser();
    return {
      name: u?.first_name || u?.username || 'Yory',
      initial: (u?.first_name?.[0] || u?.username?.[0] || 'Y').toUpperCase(),
    };
  }, []);

  const toggleNotifProducts = () => {
    hapticFeedback('light');
    playClickSound();
    const next = !notifyNewProducts;
    setNotifyNewProducts(next);
    localStorage.setItem('tm_notif_products', next.toString());
  };

  const toggleNotifPromos = () => {
    hapticFeedback('light');
    playClickSound();
    const next = !notifyPromotions;
    setNotifyPromotions(next);
    localStorage.setItem('tm_notif_promos', next.toString());
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col pb-28 selection:bg-amber-900/60 selection:text-amber-200">
      <Header title="👑 Mon profil" />

      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <h1 className="text-xl font-extrabold tracking-tight text-white uppercase" style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}>
            Mon profil
          </h1>
        </div>

        {/* 1. USER PROFILE MAIN CARD (Exact Reference from Screenshot 2) */}
        <div className="rounded-3xl bg-[#090d16] border border-amber-500/30 p-5 flex flex-col items-center text-center shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/15 blur-2xl rounded-full pointer-events-none" />

          {/* Large Avatar Circle with Amber Initial */}
          <div className="relative w-20 h-20 rounded-full bg-amber-400 text-zinc-950 font-black text-3xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] mb-2.5">
            {tgUser.initial}
          </div>

          {/* Member Tag */}
          <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
            MEMBRE
          </span>

          {/* User Name with ID badge emoji */}
          <h2 className="text-lg font-black text-white mt-0.5 flex items-center gap-1">
            <span>{tgUser.name}</span>
            <span>🪪</span>
          </h2>

          {/* Premium Pill Badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            <span>👑</span>
            <span>Premium</span>
          </div>

          {/* Membership Date */}
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            Membre depuis 2026
          </p>

          {/* Divider */}
          <div className="w-full h-px bg-zinc-800 my-4" />

          {/* 3-Column Stats Row */}
          <div className="w-full grid grid-cols-3 divide-x divide-zinc-800">
            {/* Stat 1: Commandes */}
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-white font-mono">0</span>
              <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Commandes</span>
            </div>

            {/* Stat 2: Dépensé */}
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-white font-mono">0€</span>
              <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Dépensé</span>
            </div>

            {/* Stat 3: Filleuls */}
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-white font-mono">0</span>
              <span className="text-[11px] text-zinc-400 font-medium mt-0.5">Filleuls</span>
            </div>
          </div>
        </div>

        {/* 2. NOTIFICATIONS CARD (Exact Reference from Screenshot 2) */}
        <div className="rounded-3xl bg-[#090d16] border border-amber-500/30 p-4 shadow-md space-y-3">
          {/* Header */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
            <span className="text-amber-400">•</span>
            <span>🔔 NOTIFICATIONS</span>
          </div>

          {/* Toggle 1: Nouveaux produits */}
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5 pr-3">
              <h3 className="text-xs font-semibold text-white">Nouveaux produits</h3>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Soyez prévenu de l'arrivée de nouveaux batchs
              </p>
            </div>
            <button
              type="button"
              onClick={toggleNotifProducts}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                notifyNewProducts ? 'bg-amber-400' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  notifyNewProducts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-800" />

          {/* Toggle 2: Promotions */}
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5 pr-3">
              <h3 className="text-xs font-semibold text-white">Promotions</h3>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Soyez prévenu des offres et drops exclusifs
              </p>
            </div>
            <button
              type="button"
              onClick={toggleNotifPromos}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                notifyPromotions ? 'bg-amber-400' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  notifyPromotions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
