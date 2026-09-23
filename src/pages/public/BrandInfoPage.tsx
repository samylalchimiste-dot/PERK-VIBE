import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, ShieldCheck, Sparkles, Award, Clock, Store } from 'lucide-react';
import { BrandSettings } from '../../types';
import { subscribeBrandSettings, DEFAULT_BRAND_SETTINGS } from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { BrandCrestLogo } from '../../components/common/BrandCrestLogo';
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
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col pb-24 selection:bg-cyan-900 selection:text-white">
      <Header title="ℹ️ Informations" />

      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">ℹ️</span>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            À Propos de la Farm
          </h1>
        </div>

        {/* Brand Banner Hero */}
        <div className="relative rounded-3xl overflow-hidden bg-[#0c1322] border border-cyan-900/40 p-6 text-center space-y-3.5 shadow-lg">
          <div className="relative mx-auto flex items-center justify-center">
            {brand.profileImage ? (
              <div className="w-20 h-20 rounded-2xl mx-auto p-1 bg-[#090d16] border border-amber-500/40 overflow-hidden shadow-2xl flex items-center justify-center">
                <img src={brand.profileImage} alt={brand.brandName} className="w-full h-full object-cover rounded-xl" />
              </div>
            ) : (
              <BrandCrestLogo size="lg" showGlow={true} />
            )}
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">
              Connoisseur Farm & Top-Shelf Extractions
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-white uppercase mt-0.5" style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}>
              {brand.brandName || 'TRICOME LAB'}
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto mt-2">
              {brand.description || 'Menu officiel dédié aux filtrations exclusives : Frozen, Dry, Static et WPFF.'}
            </p>
          </div>
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-slate-800/80 space-y-1">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Curation Pure</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Sélection rigoureuse des meilleurs trichomes et profils terpéniques.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c1322] border border-slate-800/80 space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs text-white uppercase tracking-wider">Discrétion</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Emballage sous vide triple couche sans odeur.
            </p>
          </div>
        </div>

        {/* Telegram Direct Channel */}
        <div className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Canal & Contact
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rejoignez notre canal privé pour consulter les drops exclusifs et les nouveaux batchs en avant-première.
          </p>
          <button
            type="button"
            onClick={() => openLink(brand.contactLinks?.telegram || 'https://t.me/F2nOfficiel_Bot')}
            className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Accéder au canal Telegram</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
