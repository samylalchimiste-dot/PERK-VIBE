import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Send, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ReviewsPage: React.FC = () => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const initialReviews = [
    {
      id: '1',
      author: 'Alexandre M.',
      rating: 5,
      date: 'Hier',
      comment: 'Le 2x Static est incroyable, fonte instantanée et terpènes intacts. Livraison rapide et emballage au top.',
      badge: 'Client Vérifié',
    },
    {
      id: '2',
      author: 'Lucas D.',
      rating: 5,
      date: 'Il y a 3 jours',
      comment: 'Frozen Sift d\'une fraîcheur remarquable. Texture bader parfaite et arôme tropical puissant.',
      badge: 'Client Vérifié',
    },
    {
      id: '3',
      author: 'Karim B.',
      rating: 5,
      date: 'La semaine dernière',
      comment: 'Rien à redire, qualité connoisseur irréprochable. Meilleur menu disponible actuellement.',
      badge: 'Client VIP',
    },
  ];

  const [reviewsList, setReviewsList] = useState(initialReviews);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    hapticFeedback('medium');
    playClickSound();

    const newRev = {
      id: Date.now().toString(),
      author: author.trim() || 'Membre Connoisseur',
      rating,
      date: 'À l\'instant',
      comment: comment.trim(),
      badge: 'Membre Vérifié',
    };

    setReviewsList([newRev, ...reviewsList]);
    setComment('');
    setAuthor('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col pb-24 selection:bg-cyan-900 selection:text-white">
      <Header title="⭐ Avis & Retours" />

      <main className="max-w-md mx-auto px-4 pt-4 flex-1 w-full space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            Avis Clients
          </h1>
        </div>

        {/* Global Rating Card */}
        <div className="rounded-3xl bg-[#0c1322] border border-slate-800/80 p-4 flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">4.9</span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Basé sur 142 retours certifiés</p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
              <ThumbsUp className="w-3 h-3" />
              <span>99% Positif</span>
            </span>
          </div>
        </div>

        {/* Submit Review Form */}
        <div className="rounded-3xl bg-[#0c1322] border border-slate-800/80 p-4 space-y-3 shadow-md">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Laisser un avis
          </h3>

          {submitted ? (
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-2 text-cyan-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Merci pour votre retour ! Votre avis a été publié.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Votre note</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setRating(s);
                      }}
                      className="p-1 focus:outline-hidden active:scale-90 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Votre prénom ou pseudo"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Partagez votre expérience sur nos produits..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publier mon avis</span>
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-2.5">
          {reviewsList.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-3.5 space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{rev.author}</span>
                  <span className="text-[10px] text-cyan-400 font-medium">({rev.badge})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
              </div>

              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
