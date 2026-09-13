import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, ChevronLeft, Shield, Sparkles, ShoppingBag } from 'lucide-react';
import { isTelegramWebApp, closeTelegramWebApp, hapticFeedback } from '../../services/telegram/telegramService';
import { isSoundEnabled, setSoundEnabled, initSoundState, playClickSound } from '../../services/audio/soundService';
import { useTapCounter } from '../../hooks/useTapCounter';
import { SecretAdminModal } from './SecretAdminModal';
import { BrandSettings } from '../../types';
import { subscribeBrandSettings } from '../../services/firebase/catalog';

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ showBack, onBack, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [soundOn, setSoundOn] = useState(true);
  const [isSecretAdminOpen, setIsSecretAdminOpen] = useState(false);
  const [brand, setBrand] = useState<BrandSettings | null>(null);

  // 5 taps on the logo opens secret admin access
  const { handleTap: handleHeaderSecretTap } = useTapCounter(5, 3000, () => {
    setIsSecretAdminOpen(true);
  });

  useEffect(() => {
    setSoundOn(initSoundState());
    const unsub = subscribeBrandSettings(setBrand);
    return () => unsub();
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
    hapticFeedback('light');
  };

  const handleBack = () => {
    hapticFeedback('light');
    playClickSound();
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-2xl border-b border-zinc-800/80 transition-colors">
        {/* Telegram Simulation Top Status Bar */}
        <div className="max-w-md mx-auto px-4 pt-1.5 pb-1 flex items-center justify-between text-[11px] text-zinc-500 font-mono tracking-wider">
          <button
            onClick={() => {
              hapticFeedback('medium');
              if (isTelegramWebApp()) {
                closeTelegramWebApp();
              } else {
                navigate('/');
              }
            }}
            className="hover:text-zinc-200 transition active:opacity-60"
          >
            Fermer
          </button>

          <div
            onClick={handleHeaderSecretTap}
            className="cursor-pointer select-none text-center"
            title="Accès Admin (Taper 5 fois)"
          >
            <span className="text-zinc-400 hover:text-zinc-200 font-medium tracking-wider">PERK VIBES FARMZ</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse"></span>
            <span className="text-[10px] text-zinc-400">MENU EN LIGNE</span>
          </div>
        </div>

        {/* Primary Navbar */}
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-xl active:bg-zinc-800/50 transition flex items-center gap-1 group"
                aria-label="Retour"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-medium text-zinc-300">Retour</span>
              </button>
            ) : (
              <Link
                to="/"
                onClick={handleHeaderSecretTap}
                className="flex items-center gap-2.5 group cursor-pointer select-none"
              >
                {/* Brand Logo Avatar */}
                <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700/80 p-0.5 overflow-hidden shadow-md group-hover:border-zinc-500 transition">
                  {brand?.profileImage ? (
                    <img 
                      src={brand.profileImage} 
                      alt={brand.brandName || 'PERK VIBES FARMZ'} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-white font-extrabold text-[10px] tracking-tighter">
                      PVF
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-wider text-white uppercase">
                      {brand?.brandName || 'PERK VIBES FARMZ'}
                    </span>
                    <span className="text-[9px] font-mono tracking-widest text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                      TOP SHELF
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium tracking-tight block -mt-0.5">
                    Extractions & Connoisseur Farm
                  </span>
                </div>
              </Link>
            )}

            {showBack && title && (
              <span className="font-semibold text-xs tracking-wide text-zinc-200 truncate max-w-[190px]">
                {title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Catalog Link */}
            <Link
              to="/shop"
              onClick={() => {
                hapticFeedback('light');
                playClickSound();
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 active:scale-95 transition"
              title="Catalogue"
            >
              <ShoppingBag className="w-4 h-4" />
            </Link>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'Couper le son' : 'Activer le son'}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 active:scale-95 transition"
              aria-label="Activer ou couper le son"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-zinc-200" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Admin Badge/Link if currently authenticated */}
            {isAdmin && (
              <Link
                to="/"
                className="px-2.5 py-1 text-[11px] font-mono text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 rounded-lg transition"
              >
                Vue Publique
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Secret Admin Passcode Modal (triggered by 5 taps on brand) */}
      <SecretAdminModal
        isOpen={isSecretAdminOpen}
        onClose={() => setIsSecretAdminOpen(false)}
      />
    </>
  );
};
