import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Layers, Info, LayoutDashboard } from 'lucide-react';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const handleAction = () => {
    hapticFeedback('light');
    playClickSound();
  };

  if (isAdmin) {
    return null; // Admin has its own top navigation bar
  }

  const isHome = location.pathname === '/';
  const isShop = location.pathname === '/shop';
  const isCollections = location.pathname === '/collections';
  const isBrand = location.pathname === '/brand';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-2xl border-t border-zinc-800/80">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {/* 1. HOME */}
        <Link
          to="/"
          onClick={handleAction}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            isHome ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isHome ? 'text-white scale-110' : ''}`}>
            <Home className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className={`text-[10px] tracking-wider uppercase font-medium mt-0.5 ${isHome ? 'font-bold text-white' : 'text-zinc-400'}`}>
            Accueil
          </span>
          {isHome && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white"></span>
          )}
        </Link>

        {/* 2. SHOP / CATALOGUE */}
        <Link
          to="/shop"
          onClick={handleAction}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            isShop ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isShop ? 'text-white scale-110' : ''}`}>
            <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className={`text-[10px] tracking-wider uppercase font-medium mt-0.5 ${isShop ? 'font-bold text-white' : 'text-zinc-400'}`}>
            Catalogue
          </span>
          {isShop && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white"></span>
          )}
        </Link>

        {/* 3. COLLECTIONS */}
        <Link
          to="/collections"
          onClick={handleAction}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            isCollections ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isCollections ? 'text-white scale-110' : ''}`}>
            <Layers className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className={`text-[10px] tracking-wider uppercase font-medium mt-0.5 ${isCollections ? 'font-bold text-white' : 'text-zinc-400'}`}>
            Collections
          </span>
          {isCollections && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white"></span>
          )}
        </Link>

        {/* 4. BRAND / FARMZ */}
        <Link
          to="/brand"
          onClick={handleAction}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            isBrand ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${isBrand ? 'text-white scale-110' : ''}`}>
            <Info className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className={`text-[10px] tracking-wider uppercase font-medium mt-0.5 ${isBrand ? 'font-bold text-white' : 'text-zinc-400'}`}>
            Farmz
          </span>
          {isBrand && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white"></span>
          )}
        </Link>
      </div>
    </nav>
  );
};
