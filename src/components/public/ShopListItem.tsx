import React, { useState } from 'react';
import { Heart, Send, CheckCircle, MapPin, Sparkles, ChevronRight } from 'lucide-react';
import { Profile } from '../../types';
import { voteForProfile } from '../../services/firebase/profiles';
import { SUPPORTED_COUNTRIES } from '../../data/europeanLocations';
import { hapticFeedback, openTelegramLink } from '../../services/telegram/telegramService';
import { playVoteSound } from '../../services/audio/soundService';

interface ShopListItemProps {
  profile: Profile;
  rank: number;
  onSelect: (profile: Profile) => void;
}

export const ShopListItem: React.FC<ShopListItemProps> = ({ profile, rank, onSelect }) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState(profile.votes || 0);
  const [isBumping, setIsBumping] = useState(false);

  const countryFlag = React.useMemo(() => {
    const c = SUPPORTED_COUNTRIES.find(
      (item) => item.name.toLowerCase() === (profile.country || 'france').toLowerCase()
    );
    return c?.flag || '🇫🇷';
  }, [profile.country]);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted) return;

    setHasVoted(true);
    setVotes(prev => prev + 1);
    setIsBumping(true);
    profile.votes = (profile.votes || 0) + 1;

    hapticFeedback('medium');
    playVoteSound();

    try {
      await voteForProfile(profile.id);
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setTimeout(() => setIsBumping(false), 600);
    }
  };

  const handleTelegram = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    if (profile.socialLinks?.telegram) {
      openTelegramLink(profile.socialLinks.telegram);
    } else if (profile.username) {
      openTelegramLink(`https://t.me/${profile.username}`);
    }
  };

  return (
    <div
      onClick={() => onSelect(profile)}
      className="group bg-[#110d29]/90 hover:bg-[#18133b] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-3 sm:p-4 transition cursor-pointer flex items-center justify-between gap-3 shadow-md shadow-purple-950/40"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank Badge */}
        <div className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
          rank === 1
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
            : rank === 2
            ? 'bg-slate-300 text-slate-950'
            : rank === 3
            ? 'bg-amber-800 text-amber-100'
            : 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
        }`}>
          #{rank}
        </div>

        {/* Thumbnail */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-900 border border-purple-800/40 shrink-0 relative">
          {profile.photos?.[0]?.url ? (
            <img
              src={profile.photos[0].url}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-purple-300 bg-purple-950/60">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-extrabold text-sm text-white truncate group-hover:text-pink-300 transition">
              {profile.name}
            </h4>
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#191038] border border-purple-700/50 text-white font-bold text-xs shadow-sm">
              <span className="text-base">{countryFlag}</span>
              <span className="text-pink-300 font-extrabold">{profile.city || profile.secteur || profile.region || profile.country || 'France'}</span>
              {profile.secteur && profile.city && (
                <span className="text-purple-400 text-[11px] font-medium">({profile.secteur})</span>
              )}
            </span>

            <span className="text-[11px] text-purple-300/80 font-medium">
              {profile.category}
            </span>
          </div>

          {/* Service modes pill icons */}
          {profile.serviceModes && (
            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
              {profile.serviceModes.clickAndCollect && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                  📍 C&C
                </span>
              )}
              {profile.serviceModes.livraisonLocale && (
                <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                  🚚 Livr.
                </span>
              )}
              {profile.serviceModes.envoiPostal && (
                <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">
                  ✈️ Postal
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Heart Vote Button */}
        <button
          onClick={handleVote}
          title="Voter pour cette boutique (❤️)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
            hasVoted
              ? 'bg-gradient-to-r from-pink-600/30 to-fuchsia-600/30 text-pink-300 border border-pink-500/50 shadow-md shadow-pink-600/20'
              : 'bg-[#1b153b] hover:bg-pink-950/40 text-purple-200 hover:text-pink-300 border border-purple-800/50 hover:border-pink-500/40'
          }`}
        >
          <Heart className={`w-4 h-4 transition duration-300 ${
            isBumping ? 'scale-125' : 'scale-100'
          } ${hasVoted ? 'fill-pink-500 text-pink-500' : 'text-pink-400/80 group-hover:text-pink-400'}`} />
          <span className="font-mono text-xs">{votes}</span>
        </button>

        {/* Telegram Direct */}
        <button
          onClick={handleTelegram}
          title="Ouvrir sur Telegram"
          className="p-2 bg-[#1b153b] hover:bg-sky-600/30 text-sky-400 hover:text-white rounded-xl border border-purple-800/40 hover:border-sky-500/40 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
