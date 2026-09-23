import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, X, ArrowRight, AlertCircle, Sparkles, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playVoteSound } from '../../services/audio/soundService';

interface SecretAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretAdminModal: React.FC<SecretAdminModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { unlockWithPasscode } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Veuillez saisir le code de sécurité.');
      hapticFeedback('medium');
      return;
    }

    setIsSubmitting(true);
    const success = unlockWithPasscode(passcode);

    if (success) {
      hapticFeedback('heavy');
      playVoteSound();
      onClose();
      navigate('/admin');
    } else {
      setError('Code administrateur incorrect.');
      hapticFeedback('heavy');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#04020c]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#120e29] border border-purple-800/60 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5 animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-purple-950/60 border border-purple-800/40 transition"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-cyan-500 p-0.5 mx-auto shadow-lg shadow-pink-500/25">
            <div className="w-full h-full bg-[#0a071c] rounded-[14px] flex items-center justify-center text-pink-400">
              <KeyRound className="w-7 h-7" />
            </div>
          </div>
          <h3 className="font-black text-lg text-white tracking-tight">
            Accès Administrateur TRICOME LAB
          </h3>
          <p className="text-xs text-purple-300/80">
            Saisissez le mot de passe maître pour déverrouiller l'espace d'administration.
          </p>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(null);
              }}
              placeholder="Mot de passe..."
              className="w-full bg-[#09061a] border border-purple-800/70 focus:border-pink-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-purple-400/40 focus:outline-none transition pr-11 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-purple-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            <span>Déverrouiller l'Espace Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-purple-400/70 hover:text-purple-300 underline"
          >
            Annuler et rester sur la vue publique
          </button>
        </div>
      </div>
    </div>
  );
};
