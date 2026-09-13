import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, Instagram, ShieldCheck, Sparkles, Award, Globe, Clock } from 'lucide-react';
import { BrandSettings } from '../../types';
import { subscribeBrandSettings, DEFAULT_BRAND_SETTINGS } from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const BrandInfoPage: React.FC = () => {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);

  useEffect(() => {
    const unsub = subscribeBrandSettings(setBrand);
    return () => unsub();
  }, []);

  const openLink = (url?: string) => {
    if (!url) return;
    hapticFeedback('medium');
    playClickSound();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-24 selection:bg-zinc-800 selection:text-white">
      <Header />

      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-6">
        {/* Brand Banner Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-[#111114] border border-zinc-800/80 p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full mx-auto p-1 bg-gradient-to-b from-zinc-700 to-zinc-950 border border-zinc-700 overflow-hidden shadow-2xl">
            {brand.profileImage ? (
              <img src={brand.profileImage} alt={brand.brandName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-extrabold text-emerald-400 text-xl">
                PVF
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400">
              Connoisseur Farm & Top-Shelf Extractions
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase mt-0.5">
              {brand.brandName || 'PERK VIBES FARMZ'}
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto mt-2">
              {brand.description || 'Sélection exclusive de filtrations d\'exception : Dry Sift, Frozen Sift et 2x Static.'}
            </p>
          </div>
        </div>

        {/* Brand Pillars */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#111114] border border-zinc-800/80 space-y-1.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Terpènes Purs</h3>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Filtrations d'élite 100% single farm, arômes intacts et curing sous contrôle.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#111114] border border-zinc-800/80 space-y-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Confidentialité</h3>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Conditionnement hermétique sous vide et expéditions isothermes discrètes.
            </p>
          </div>
        </div>

        {/* Official Channels & Contact */}
        <div className="rounded-3xl bg-[#111114] border border-zinc-800/80 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-sm text-white uppercase tracking-wider">
              Canaux Officiels & Contact
            </h2>
          </div>

          <div className="space-y-2">
            {/* Telegram Bot */}
            <button
              onClick={() => openLink(brand.contactLinks?.botUrl || `https://t.me/${brand.contactLinks?.botUsername || 'PerkVibesFarmz_Bot'}`)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition">
                    Bot Telegram Officiel
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    @{brand.contactLinks?.botUsername || 'PerkVibesFarmz_Bot'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                Ouvrir →
              </span>
            </button>

            {/* Telegram Channel if set */}
            {brand.contactLinks?.channel && (
              <button
                onClick={() => openLink(brand.contactLinks.channel)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-blue-300 transition">
                      Canal Drops & Annonces
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      Rejoindre les alertes exclusives
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  Rejoindre →
                </span>
              </button>
            )}

            {/* WhatsApp if set */}
            {brand.contactLinks?.whatsapp && (
              <button
                onClick={() => openLink(`https://wa.me/${brand.contactLinks.whatsapp.replace(/[^0-9]/g, '')}`)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-emerald-300 transition">
                      Ligne WhatsApp
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {brand.contactLinks.whatsapp}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  Écrire →
                </span>
              </button>
            )}

            {/* Instagram if set */}
            {brand.contactLinks?.instagram && (
              <button
                onClick={() => openLink(brand.contactLinks.instagram?.startsWith('http') ? brand.contactLinks.instagram : `https://instagram.com/${brand.contactLinks.instagram}`)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 transition group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white group-hover:text-pink-300 transition">
                      Instagram PERK VIBES FARMZ
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {brand.contactLinks.instagram}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-pink-400 group-hover:translate-x-0.5 transition-transform">
                  Suivre →
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Service Hours */}
        <div className="p-4 rounded-2xl bg-[#111114] border border-zinc-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-white block">Support & Expéditions</span>
            <span className="text-zinc-400 text-[11px]">
              Commandes traitées 7j/7. Réponses sous 15 minutes sur Telegram.
            </span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
