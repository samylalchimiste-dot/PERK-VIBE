import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { DEFAULT_BRAND_SETTINGS, getBrandSettings } from '../../services/firebase/catalog';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ContactPage: React.FC = () => {
  const [brand, setBrand] = useState(DEFAULT_BRAND_SETTINGS);

  useEffect(() => {
    getBrandSettings().then(setBrand);
  }, []);

  const tgBotUrl = brand.contactLinks.telegram || 'https://t.me/F2nOfficiel_Bot';

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col pb-28 selection:bg-amber-900/60 selection:text-amber-200">
      <Header title="💬 Contact & Support" />

      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h1 className="text-xl font-extrabold tracking-tight text-white uppercase" style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}>
            Contact & Support
          </h1>
        </div>

        {/* Telegram Direct Support Card */}
        <div className="rounded-3xl bg-[#090d16] border border-amber-500/30 p-5 space-y-4 shadow-lg text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400 shadow-md">
            <Send className="w-7 h-7 stroke-[1.8]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-white uppercase tracking-wide">
              Support Officiel TRICHOME MONTANE
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Pour passer commande, poser une question sur nos batchs ou solliciter une livraison sur-mesure, notre équipe vous répond en direct.
            </p>
          </div>

          <a
            href={tgBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              hapticFeedback('medium');
              playClickSound();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.4)] transition active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Ouvrir la conversation Telegram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Guarantees & Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-3.5 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-100">Confidentialité</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Échanges 100% chiffrés et discrets via Telegram.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-3.5 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs text-slate-100">Disponibilité</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Service 7j/7 avec réponse rapide de nos préparateurs.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
