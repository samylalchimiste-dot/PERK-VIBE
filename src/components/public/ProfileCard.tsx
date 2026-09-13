import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sparkles, User, ChevronRight, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Profile } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';

interface Props {
  profile: Profile;
}

export const ProfileCard: React.FC<Props> = ({ profile }) => {
  const primaryPhoto = profile.photos?.find(p => p.isPrimary) || profile.photos?.[0];
  const photoCount = profile.photos?.length || 0;

  return (
    <Link
      to={`/profile/${profile.id}`}
      onClick={() => hapticFeedback('light')}
      className="group block bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-cyan-500/10 transition duration-200 active:scale-[0.99]"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-slate-950 overflow-hidden">
        {primaryPhoto?.url ? (
          <img
            src={primaryPhoto.url}
            alt={profile.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
            <User className="w-12 h-12 mb-1 opacity-50" />
            <span className="text-xs font-medium">Aucune photo</span>
          </div>
        )}

        {/* Gradient Overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Badges on top of image */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {profile.featured ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-md">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              Mis en avant
            </span>
          ) : (
            <div />
          )}

          {photoCount > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/70 text-slate-200 backdrop-blur-md border border-slate-700/50">
              <ImageIcon className="w-3 h-3" />
              {photoCount}
            </span>
          )}
        </div>

        {/* Category Pill on bottom of image */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
            {profile.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-cyan-300 transition truncate">
              {profile.name}
            </h3>
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>

          {profile.username && (
            <p className="text-xs text-cyan-400/80 font-mono mt-0.5">
              @{profile.username}
            </p>
          )}
        </div>

        {/* Location: City • Country */}
        {(profile.city || profile.country) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              {[profile.city, profile.country].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {/* Short Bio snippet */}
        {profile.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {profile.description}
          </p>
        )}

        {/* Action button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition">
          <span>Voir le profil</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </Link>
  );
};
