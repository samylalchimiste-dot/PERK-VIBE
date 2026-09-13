import React, { useState } from 'react';
import { Crown, Trophy, Medal, ThumbsUp, Heart, CheckCircle, ExternalLink } from 'lucide-react';
import { Profile } from '../../types';
import { voteForProfile } from '../../services/firebase/profiles';
import { SUPPORTED_COUNTRIES } from '../../data/europeanLocations';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playVoteSound } from '../../services/audio/soundService';

interface PodiumSectionProps {
  topProfiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
}

const getFlagForProfile = (profile: Profile) => {
  const c = SUPPORTED_COUNTRIES.find(
    (item) => item.name.toLowerCase() === (profile.country || 'france').toLowerCase()
  );
  return c?.flag || '🇫🇷';
};

export const PodiumSection: React.FC<PodiumSectionProps> = ({ topProfiles, onSelectProfile }) => {
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  if (topProfiles.length === 0) return null;

  // Podium order: [2nd (index 1), 1st (index 0), 3rd (index 2)]
  const first = topProfiles[0];
  const second = topProfiles[1];
  const third = topProfiles[2];

  const handleVote = async (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    if (votedIds[profile.id]) return;

    // Optimistic vote feedback
    setVotedIds(prev => ({ ...prev, [profile.id]: true }));
    setAnimatingId(profile.id);
    profile.votes = (profile.votes || 0) + 1;

    hapticFeedback('heavy');
    playVoteSound();

    try {
      await voteForProfile(profile.id);
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setTimeout(() => setAnimatingId(null), 1000);
    }
  };

  return (
    <div className="pt-2 pb-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end max-w-md mx-auto">
        {/* 2nd Place (Left) */}
        {second ? (
          <div
            onClick={() => onSelectProfile(second)}
            className="group relative bg-[#130e2e]/90 hover:bg-[#19133b] border border-slate-700/50 hover:border-slate-500/80 rounded-2xl p-2 sm:p-3 text-center cursor-pointer transition flex flex-col items-center justify-between min-h-[160px] shadow-lg shadow-purple-950/40"
          >
            {/* Rank Badge */}
            <div className="w-7 h-7 rounded-full bg-slate-700/80 border border-slate-400/50 flex items-center justify-center -mt-5 shadow-md">
              <Trophy className="w-3.5 h-3.5 text-slate-200" />
            </div>

            {/* Photo / Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 my-1.5 shrink-0 relative">
              {second.photos?.[0]?.url ? (
                <img
                  src={second.photos[0].url}
                  alt={second.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                  {second.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-[#130e2e] rounded-full"></span>
            </div>

            {/* Name */}
            <div className="w-full px-0.5">
              <div className="text-[11px] sm:text-xs font-bold text-white truncate">
                {second.name}
              </div>
              <div className="text-[10px] text-purple-300 truncate flex items-center justify-center gap-1 mt-0.5">
                <span>{getFlagForProfile(second)}</span>
                <span className="truncate">{second.city || second.region}</span>
              </div>
            </div>

            {/* Votes Pill & Action */}
            <button
              onClick={(e) => handleVote(e, second)}
              className={`w-full mt-2 py-1 px-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                votedIds[second.id]
                  ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                  : 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/30'
              }`}
            >
              <Heart className={`w-3 h-3 ${votedIds[second.id] ? 'fill-pink-500 text-pink-500' : 'text-purple-300'}`} />
              <span>{second.votes || 0} votes</span>
            </button>
          </div>
        ) : (
          <div className="opacity-0"></div>
        )}

        {/* 1st Place (Center - Elevated) */}
        {first && (
          <div
            onClick={() => onSelectProfile(first)}
            className="group relative bg-[#1c123d] hover:bg-[#23174d] border-2 border-amber-500/60 hover:border-amber-400 rounded-3xl p-2.5 sm:p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-between min-h-[185px] shadow-xl shadow-amber-500/10 scale-105 z-10"
          >
            {/* Crown Icon */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-200 flex items-center justify-center -mt-6 shadow-lg shadow-amber-500/30 animate-bounce">
              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
            </div>

            {/* Photo / Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/80 my-1 shrink-0 relative shadow-md">
              {first.photos?.[0]?.url ? (
                <img
                  src={first.photos[0].url}
                  alt={first.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-300">
                  {first.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-md">#1</span>
            </div>

            {/* Name */}
            <div className="w-full px-0.5">
              <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center justify-center gap-1">
                <span>{first.name}</span>
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </div>
              <div className="text-[11px] text-amber-300/90 font-bold truncate flex items-center justify-center gap-1 mt-0.5">
                <span className="text-sm">{getFlagForProfile(first)}</span>
                <span className="truncate">{first.city || first.region}</span>
              </div>
            </div>

            {/* Votes Pill & Action */}
            <button
              onClick={(e) => handleVote(e, first)}
              className={`w-full mt-2 py-1.5 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm ${
                votedIds[first.id]
                  ? 'bg-pink-600 text-white shadow-pink-500/30'
                  : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 fill-white text-white`} />
              <span>{first.votes || 0} votes</span>
            </button>
          </div>
        )}

        {/* 3rd Place (Right) */}
        {third ? (
          <div
            onClick={() => onSelectProfile(third)}
            className="group relative bg-[#130e2e]/90 hover:bg-[#19133b] border border-amber-900/40 hover:border-amber-700/60 rounded-2xl p-2 sm:p-3 text-center cursor-pointer transition flex flex-col items-center justify-between min-h-[160px] shadow-lg shadow-purple-950/40"
          >
            {/* Rank Badge */}
            <div className="w-7 h-7 rounded-full bg-amber-900/80 border border-amber-600/50 flex items-center justify-center -mt-5 shadow-md">
              <Medal className="w-3.5 h-3.5 text-amber-400" />
            </div>

            {/* Photo / Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-900 border border-amber-800/50 my-1.5 shrink-0 relative">
              {third.photos?.[0]?.url ? (
                <img
                  src={third.photos[0].url}
                  alt={third.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-amber-400">
                  {third.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-[#130e2e] rounded-full"></span>
            </div>

            {/* Name */}
            <div className="w-full px-0.5">
              <div className="text-[11px] sm:text-xs font-bold text-white truncate">
                {third.name}
              </div>
              <div className="text-[10px] text-purple-300 truncate flex items-center justify-center gap-1 mt-0.5">
                <span>{getFlagForProfile(third)}</span>
                <span className="truncate">{third.city || third.region}</span>
              </div>
            </div>

            {/* Votes Pill & Action */}
            <button
              onClick={(e) => handleVote(e, third)}
              className={`w-full mt-2 py-1 px-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                votedIds[third.id]
                  ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40'
                  : 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/30'
              }`}
            >
              <Heart className={`w-3 h-3 ${votedIds[third.id] ? 'fill-pink-500 text-pink-500' : 'text-purple-300'}`} />
              <span>{third.votes || 0} votes</span>
            </button>
          </div>
        ) : (
          <div className="opacity-0"></div>
        )}
      </div>
    </div>
  );
};
