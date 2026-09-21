import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Info, MapPin, ShoppingCart, Star, Mail } from 'lucide-react';
import { getTelegramUser, hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [cartCount, setCartCount] = useState<number>(0);

  const tgUser = useMemo(() => {
    const u = getTelegramUser();
    return {
      initial: (u?.first_name?.[0] || u?.username?.[0] || 'Y').toUpperCase(),
    };
  }, []);

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = localStorage.getItem('pvf_cart');
        if (saved) {
          const items = JSON.parse(saved);
          setCartCount(Array.isArray(items) ? items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 0);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cart-updated', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cart-updated', updateCount);
    };
  }, []);

  const handleAction = () => {
    hapticFeedback('light');
    playClickSound();
  };

  if (isAdmin) {
    return null;
  }

  const currentPath = location.pathname;

  // 7 Tabs matching Screenshots 1 & 2 exactly: Accueil, Infos, Carte, Panier, Avis, Contact, Profil
  const navItems = [
    { label: 'Accueil', path: '/', icon: Home },
    { label: 'Infos', path: '/infos', icon: Info },
    { label: 'Carte', path: '/carte', icon: MapPin },
    { label: 'Panier', path: '/panier', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
    { label: 'Avis', path: '/avis', icon: Star },
    { label: 'Contact', path: '/contact', icon: Mail },
    { label: 'Profil', path: '/profil', isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050608]/98 backdrop-blur-2xl border-t border-amber-500/20 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between h-16 max-w-md mx-auto px-1.5">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={handleAction}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all select-none relative group ${
                isActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                {item.isProfile ? (
                  <div
                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter transition-all ${
                      isActive
                        ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-105'
                        : 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                    }`}
                  >
                    {tgUser.initial}
                  </div>
                ) : (
                  Icon && (
                    <div
                      className={`relative flex items-center justify-center p-1 rounded-xl transition-all ${
                        isActive && item.path === '/'
                          ? 'bg-amber-400/15 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : isActive
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.7]'
                        }`}
                      />
                    </div>
                  )
                )}

                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label in Title Case as seen in screenshots */}
              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors ${
                  isActive ? 'font-bold text-amber-400' : 'font-medium text-zinc-400'
                }`}
              >
                {item.label}
              </span>

              {/* Subtle Gold Active Bar/Glow */}
              {isActive && (
                <span className="absolute bottom-0.5 w-3 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
