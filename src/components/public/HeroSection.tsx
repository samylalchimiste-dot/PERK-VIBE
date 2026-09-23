import React from 'react';
import { Zap, Sparkles, Rocket } from 'lucide-react';

interface HeroSectionProps {
  totalActiveCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ totalActiveCount }) => {
  return (
    <section className="text-center space-y-4 pt-2 pb-2">
      {/* Official Platform Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#160f33]/80 border border-purple-600/40 text-purple-300 text-xs font-bold tracking-wider uppercase shadow-md shadow-purple-900/20 backdrop-blur-md">
        <Rocket className="w-3.5 h-3.5 text-pink-400" />
        <span className="text-[11px] font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-300">
          PLATEFORME OFFICIELLE
        </span>
      </div>

      {/* Main Title */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-400 to-purple-300 leading-tight">
          La connexion<br />ultime.
        </h1>
        <p className="text-xs sm:text-sm text-purple-200/80 max-w-xs sm:max-w-md mx-auto leading-relaxed font-medium">
          Trouve les meilleures sélections de la communauté TRICOME LAB, notées en direct par les connaisseurs.
        </p>
      </div>

      {/* Hero Metric Box */}
      <div className="pt-2">
        <div className="bg-[#120d29]/90 border border-purple-800/40 rounded-3xl p-3.5 sm:p-4 max-w-[280px] mx-auto flex items-center justify-center gap-4 shadow-xl shadow-purple-950/50 backdrop-blur-sm">
          {/* Lightning Icon Box */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 shrink-0">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>

          <div className="text-left">
            <div className="text-2xl sm:text-3xl font-black text-white leading-none font-mono">
              {totalActiveCount}
            </div>
            <div className="text-[10px] sm:text-[11px] font-extrabold tracking-wider text-purple-300 uppercase mt-0.5">
              {totalActiveCount <= 1 ? 'BOUTIQUE ACTIVE' : 'BOUTIQUES ACTIVES'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
