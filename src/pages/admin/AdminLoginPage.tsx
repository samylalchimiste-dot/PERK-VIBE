import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User, AlertCircle, Loader2, Sparkles, ArrowRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuth, MASTER_ADMIN_PASSCODE } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playVoteSound } from '../../services/audio/soundService';

export const AdminLoginPage: React.FC = () => {
  const { login, unlockWithPasscode, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced email/password toggle
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [firebasePassword, setFirebasePassword] = useState('');

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Veuillez saisir le mot de passe maître.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const success = unlockWithPasscode(passcode);
    if (success) {
      hapticFeedback('heavy');
      playVoteSound();
      navigate('/admin');
    } else {
      setError('Mot de passe de sécurité incorrect.');
      hapticFeedback('heavy');
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firebasePassword) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, firebasePassword);
      hapticFeedback('heavy');
      playVoteSound();
      navigate('/admin');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Échec de l\'authentification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070414] text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#120e29] border border-purple-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-cyan-500 p-0.5 mx-auto shadow-lg shadow-pink-500/25">
              <div className="w-full h-full bg-[#0a071c] rounded-[14px] flex items-center justify-center text-pink-400">
                <KeyRound className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Espace Administrateur TRICOME LAB
            </h1>
            <p className="text-xs text-purple-300">
              Accès réservé. Saisissez le mot de passe maître pour continuer.
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!showEmailLogin ? (
            /* Master Passcode Form (Primary) */
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center justify-between">
                  <span>Mot de passe Maître</span>
                  <span className="text-[10px] text-emerald-400 font-mono">OMERTA2026</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="admin-master-password"
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError(null);
                    }}
                    placeholder="Saisissez le mot de passe..."
                    className="w-full bg-[#09061a] border border-purple-800/70 focus:border-pink-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-purple-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:opacity-95 text-white text-xs font-extrabold rounded-2xl transition shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>Accéder au Dashboard Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailLogin(true);
                    setError(null);
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-200 transition underline"
                >
                  Connexion par Email / Firebase
                </button>
              </div>
            </form>
          ) : (
            /* Email / Password Form (Alternative) */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                  Adresse Email Administrateur
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@perkvibesfarmz.com"
                    className="w-full bg-[#09061a] border border-purple-800/70 focus:border-pink-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={firebasePassword}
                    onChange={(e) => setFirebasePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#09061a] border border-purple-800/70 focus:border-pink-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Se connecter avec Firebase</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailLogin(false);
                    setError(null);
                  }}
                  className="text-[11px] text-pink-400 hover:text-pink-300 transition underline font-bold"
                >
                  ← Utiliser le Mot de Passe Maître
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-purple-900/40 pt-4 text-center">
            <Link
              to="/"
              className="text-xs text-purple-400/80 hover:text-white transition"
            >
              Retour à l'application publique
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
