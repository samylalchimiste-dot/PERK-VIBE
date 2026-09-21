import React from 'react';
import { Navigate, NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  ShoppingBag, 
  Layers, 
  Sliders, 
  LogOut, 
  Globe, 
  Loader2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-xs font-mono">Vérification de la session administrateur TRICHOME MONTANE...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-16 selection:bg-zinc-800 selection:text-white">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-2xl border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-extrabold text-xs tracking-tighter shadow-md">
                TM
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white block leading-none">
                  TRICHOME MONTANE · Administration Menu
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Éditeur Menu & Extractions
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700/80 transition"
              title="Voir la vitrine publique"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Voir la Boutique</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium rounded-xl border border-rose-500/30 transition"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};
