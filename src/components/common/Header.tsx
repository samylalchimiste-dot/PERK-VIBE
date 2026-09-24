import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, Volume2, VolumeX, RotateCw } from 'lucide-react';
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
  const [soundOn, setSoundOn] = useState(true);
  const [isSecretAdminOpen, setIsSecretAdminOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 5 taps on the title opens secret admin access
  const { handleTap: handleHeaderSecretTap } = useTapCounter(5, 4000, () => {
    setIsSecretAdminOpen(true);
  });

  useEffect(() => {
    setSoundOn(initSoundState());
    const unsub = subscribeBrandSettings(setBrand);
    
    // Listen for custom trigger from any other "TRICOME LAB" top title element
    const handleCustomTrigger = () => setIsSecretAdminOpen(true);
    window.addEventListener('open-secret-admin', handleCustomTrigger);

    return () => {
      unsub();
      window.removeEventListener('open-secret-admin', handleCustomTrigger);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleClose = () => {
    hapticFeedback('medium');
    if (isTelegramWebApp()) {
      closeTelegramWebApp();
    } else {
      navigate('/');
    }
  };

  const brandName = brand?.brandName || 'TRICOME LAB';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#050608]/90 backdrop-blur-2xl border-b border-zinc-800/60 transition-colors">
        <div className="max-w-md mx-auto px-3.5 h-13 flex items-center justify-between relative">
          {/* Left Action: "✕ Fermer" or "< Retour" Pill Button */}
          <div className="flex items-center min-w-[70px]">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181a20]/90 hover:bg-[#222530] border border-zinc-700/60 text-zinc-200 hover:text-white font-medium text-xs tracking-tight transition active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 -ml-0.5 text-zinc-400" />
                <span>Retour</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#181a20]/90 hover:bg-[#222530] border border-zinc-700/60 text-zinc-200 hover:text-white font-medium text-xs tracking-tight transition active:scale-95 shadow-sm"
              >
                <span className="text-zinc-400 text-xs">✕</span>
                <span>Fermer</span>
              </button>
            )}
          </div>

          {/* Center: Brand Name or Title - 5 taps to open secret admin access */}
          <div
            onClick={handleHeaderSecretTap}
            className="flex flex-col items-center justify-center cursor-pointer select-none px-2 active:scale-95 transition-transform"
          >
            {title ? (
              <span className="font-bold text-xs tracking-wider text-zinc-200 uppercase truncate max-w-[180px]">
                {title}
              </span>
            ) : (
              <span className="font-bold text-xs tracking-widest text-zinc-300 uppercase truncate max-w-[180px]">
                {brandName}
              </span>
            )}
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-mono">
              OFFICIEL · BOT
            </span>
          </div>

          {/* Right Action: Menu pill with chevron and 3 dots `⌄ •••` */}
          <div className="relative flex items-center justify-end min-w-[70px]" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setIsMenuOpen(!isMenuOpen);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#181a20]/90 hover:bg-[#222530] border border-zinc-700/60 text-zinc-300 hover:text-white transition active:scale-95 shadow-sm"
              aria-label="Menu"
            >
              <span className="text-[10px] text-zinc-400">⌄</span>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Header Popup Dropdown (Sound & Reload only, NO admin access) */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#090d16] border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.9)] py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    toggleSound();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-[#121a2c] transition"
                >
                  <span className="flex items-center gap-2">
                    {soundOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
                    Effets sonores
                  </span>
                  <span className="text-[10px] text-zinc-500">{soundOn ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('light');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-[#121a2c] transition"
                >
                  <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Recharger la page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Secret Admin Authentication Modal */}
      <SecretAdminModal
        isOpen={isSecretAdminOpen}
        onClose={() => setIsSecretAdminOpen(false)}
      />
    </>
  );
};
