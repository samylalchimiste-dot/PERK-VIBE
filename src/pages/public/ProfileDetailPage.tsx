import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Globe, 
  Instagram, 
  Mail, 
  Phone, 
  ChevronLeft, 
  Image as ImageIcon, 
  Share2, 
  ExternalLink,
  ShieldAlert,
  Loader2,
  Heart,
  Trophy,
  Tag
} from 'lucide-react';
import { Profile } from '../../types';
import { getPublicProfileById, voteForProfile } from '../../services/firebase/profiles';
import { SUPPORTED_COUNTRIES } from '../../data/europeanLocations';
import { Header } from '../../components/common/Header';
import { PhotoGalleryModal } from '../../components/public/PhotoGalleryModal';
import { BottomNav } from '../../components/common/BottomNav';
import { SubmissionModal } from '../../components/public/SubmissionModal';
import { NetworksModal } from '../../components/public/NetworksModal';
import { SecretAdminModal } from '../../components/common/SecretAdminModal';
import { useTapCounter } from '../../hooks/useTapCounter';
import { hapticFeedback, getTelegramWebApp, setupTelegramBackButton } from '../../services/telegram/telegramService';
import { playVoteSound, playClickSound } from '../../services/audio/soundService';

export const ProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Modals
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [isNetworksOpen, setIsNetworksOpen] = useState(false);
  const [isSecretAdminOpen, setIsSecretAdminOpen] = useState(false);

  // Secret 5-tap trigger on the profile avatar/header/title
  const { handleTap: handleProfileSecretTap } = useTapCounter(5, 3500, () => {
    setIsSecretAdminOpen(true);
  });

  // Native Telegram Back Button integration
  useEffect(() => {
    const cleanup = setupTelegramBackButton(() => {
      hapticFeedback('light');
      playClickSound();
      navigate('/');
    });
    return cleanup;
  }, [navigate]);

  useEffect(() => {
    async function loadProfile() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getPublicProfileById(id);
        setProfile(data);
      } catch (err) {
        console.error('Error fetching public profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  const handleVote = async () => {
    if (!profile || hasVoted) return;

    setHasVoted(true);
    setProfile(prev => prev ? { ...prev, votes: (prev.votes || 0) + 1 } : null);

    hapticFeedback('heavy');
    playVoteSound();

    try {
      await voteForProfile(profile.id);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleShare = () => {
    hapticFeedback('light');
    if (navigator.share && profile) {
      navigator.share({
        title: `${profile.name} — Cartel Del Farmez`,
        text: profile.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const openTelegramLink = (telegramUsernameOrUrl: string) => {
    hapticFeedback('medium');
    const clean = telegramUsernameOrUrl.startsWith('http')
      ? telegramUsernameOrUrl
      : `https://t.me/${telegramUsernameOrUrl.replace(/^@/, '')}`;

    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(clean);
    } else {
      window.open(clean, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070414] text-slate-100 flex flex-col">
        <Header showBack onBack={() => navigate('/')} />
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-purple-300">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-xs font-medium">Chargement de la sélection Cartel Del Farmez...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#070414] text-slate-100 flex flex-col">
        <Header showBack onBack={() => navigate('/')} />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Boutique non trouvée</h2>
          <p className="text-xs text-purple-300/80 leading-relaxed">
            Cette boutique est introuvable ou n'a pas encore été validée et publiée par l'équipe Cartel Del Farmez.
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-pink-600/30"
          >
            Retour au classement
          </Link>
        </div>
      </div>
    );
  }

  const primaryPhoto = profile.photos?.[activePhotoIndex] || profile.photos?.[0];
  const photos = profile.photos || [];

  return (
    <div className="min-h-screen bg-[#070414] text-slate-100 flex flex-col pb-24 selection:bg-pink-500 selection:text-white">
      <Header 
        showBack 
        onBack={() => {
          hapticFeedback('light');
          playClickSound();
          navigate('/');
        }} 
        title={profile.name}
        onOpenNetworks={() => setIsNetworksOpen(true)}
      />

      <main className="max-w-md mx-auto px-4 pt-2 flex-1 w-full space-y-3.5">
        {/* Prominent Back Button Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              hapticFeedback('light');
              playClickSound();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#130d2d] hover:bg-[#1e1445] border border-purple-700/60 text-slate-200 hover:text-white font-extrabold text-xs shadow-md transition group active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-pink-400 group-hover:-translate-x-1 transition" />
            <span>← Retour aux boutiques</span>
          </button>

          <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/40">
            Fiche Boutique
          </span>
        </div>

        {/* Photo Gallery & Banner Card */}
        <div className="space-y-2">
          <div 
            onClick={(e) => {
              handleProfileSecretTap(e);
              if (photos.length > 0) {
                hapticFeedback('light');
                setIsGalleryOpen(true);
              }
            }}
            className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-[#110d29] border border-purple-800/40 shadow-2xl cursor-pointer group select-none"
          >
            {primaryPhoto?.url ? (
              <img
                src={primaryPhoto.url}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-purple-400 bg-purple-950/40">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs">Bannière & Logo boutique</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#070414] via-transparent to-transparent" />

            {/* Badges & Floating Buttons */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticFeedback('light');
                    playClickSound();
                    navigate('/');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0a071c]/90 hover:bg-[#180f3d] text-white border border-purple-600/60 backdrop-blur-md transition shadow-lg text-[11px] font-bold"
                  title="Retour au classement"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-pink-400" />
                  <span>Retour</span>
                </button>

                {profile.featured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 shadow-lg backdrop-blur-md">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    Top Farmz
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/40 backdrop-blur-md">
                    Boutique Vérifiée
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="pointer-events-auto p-2 bg-[#0d0921]/80 hover:bg-[#160f33] text-slate-200 rounded-full border border-purple-700/50 backdrop-blur-md transition"
                title="Partager"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Gallery counter pill */}
            {photos.length > 0 && (
              <div className="absolute bottom-3 right-3 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#0a071c]/90 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-md">
                  <ImageIcon className="w-3 h-3" />
                  {photos.length} photo{photos.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActivePhotoIndex(idx);
                    hapticFeedback('light');
                  }}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                    idx === activePhotoIndex
                      ? 'border-pink-500 scale-105 shadow-md shadow-pink-500/20'
                      : 'border-purple-900/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Aperçu ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-[#120d29] border border-purple-800/40 rounded-3xl p-5 shadow-xl space-y-4">
          {/* Top Title & Category */}
          <div className="flex items-start justify-between gap-3">
            <div 
              onClick={handleProfileSecretTap}
              className="space-y-1 min-w-0 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                  {profile.name}
                </h1>
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              </div>

              {profile.username && (
                <p className="text-xs font-mono text-pink-400 font-bold">
                  @{profile.username}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-purple-300 pt-0.5 flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="text-sm">
                  {SUPPORTED_COUNTRIES.find(c => c.name.toLowerCase() === (profile.country || 'france').toLowerCase())?.flag || '🇫🇷'}
                </span>
                <span className="font-bold text-white">
                  {profile.city || profile.secteur || profile.region || 'France'}
                </span>
                {(profile.secteur || profile.region) && profile.city && (
                  <span className="text-purple-300/80">({profile.secteur || profile.region})</span>
                )}
                {profile.country && profile.country !== 'France' && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-[10px] text-pink-300 font-semibold border border-purple-800/40">
                    {profile.country}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-xl text-xs font-extrabold bg-purple-950 text-cyan-300 border border-cyan-500/30">
                {profile.category}
              </span>
            </div>
          </div>

          {/* Service Modes Badges */}
          {profile.serviceModes && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className={`p-2 rounded-xl text-center border text-[11px] font-bold ${
                profile.serviceModes.clickAndCollect
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-purple-950/20 border-purple-900/30 text-purple-400/40 line-through'
              }`}>
                📍 Click & Collect
              </div>
              <div className={`p-2 rounded-xl text-center border text-[11px] font-bold ${
                profile.serviceModes.livraisonLocale
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                  : 'bg-purple-950/20 border-purple-900/30 text-purple-400/40 line-through'
              }`}>
                🚚 Livraison
              </div>
              <div className={`p-2 rounded-xl text-center border text-[11px] font-bold ${
                profile.serviceModes.envoiPostal
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                  : 'bg-purple-950/20 border-purple-900/30 text-purple-400/40 line-through'
              }`}>
                ✈️ Envoi Postal
              </div>
            </div>
          )}

          {/* Vote Action Bar */}
          <div className="bg-[#19133b] border border-purple-700/40 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-black text-white font-mono leading-tight">
                {profile.votes || 0}
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                VOTES COMMUNAUTAIRES
              </div>
            </div>

            <button
              onClick={handleVote}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shadow-md ${
                hasVoted
                  ? 'bg-pink-600 text-white shadow-pink-500/30'
                  : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:opacity-95 text-white active:scale-95'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasVoted ? 'fill-white' : ''}`} />
              <span>{hasVoted ? '❤️ Voté !' : '❤️ Soutenir & Voter'}</span>
            </button>
          </div>
          <div className="text-[11px] text-purple-300/75 text-center -mt-1">
            🔥 Plus une boutique reçoit de votes ❤️, plus elle monte en 1ère position dans le classement Cartel Del Farmez !
          </div>

          {/* Description */}
          {profile.description && (
            <div className="space-y-1.5 pt-2 border-t border-purple-900/40">
              <h3 className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
                À Propos de la boutique
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {profile.description}
              </p>
            </div>
          )}

          {/* Contact Channels Grid */}
          <div className="space-y-2 pt-2 border-t border-purple-900/40">
            <h3 className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
              Canaux & Réseaux Officiels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profile.socialLinks?.telegram && (
                <button
                  onClick={() => openTelegramLink(profile.socialLinks!.telegram!)}
                  className="flex items-center justify-between gap-2 p-3 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/50 rounded-xl text-xs text-sky-200 font-bold transition"
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>Telegram</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                </button>
              )}

              {profile.socialLinks?.telegramBot && (
                <button
                  onClick={() => openTelegramLink(profile.socialLinks!.telegramBot!)}
                  className="flex items-center justify-between gap-2 p-3 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 rounded-xl text-xs text-indigo-200 font-bold transition"
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-400" />
                    <span>Bot Telegram</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              )}

              {profile.socialLinks?.instagram && (
                <a
                  href={profile.socialLinks.instagram.startsWith('http') ? profile.socialLinks.instagram : `https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 bg-pink-950/60 hover:bg-pink-900/60 border border-pink-800/50 rounded-xl text-xs text-pink-200 font-bold transition"
                >
                  <span className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>Instagram</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                </a>
              )}

              {profile.socialLinks?.potato && (
                <a
                  href={profile.socialLinks.potato.startsWith('http') ? profile.socialLinks.potato : `https://${profile.socialLinks.potato}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/50 rounded-xl text-xs text-amber-200 font-bold transition"
                >
                  <span className="flex items-center gap-2">
                    <span>🥔</span>
                    <span>Potato</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              )}

              {profile.socialLinks?.snapchat && (
                <a
                  href={profile.socialLinks.snapchat.startsWith('http') ? profile.socialLinks.snapchat : `https://snapchat.com/add/${profile.socialLinks.snapchat.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 bg-yellow-950/60 hover:bg-yellow-900/60 border border-yellow-800/50 rounded-xl text-xs text-yellow-200 font-bold transition"
                >
                  <span className="flex items-center gap-2">
                    <span>👻</span>
                    <span>Snapchat</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-yellow-400" />
                </a>
              )}

              {profile.socialLinks?.website && (
                <a
                  href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-xl text-xs text-cyan-200 font-bold transition"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Site Web</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              )}
            </div>
          </div>

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-purple-900/40">
              <h3 className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
                Tags & Services
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#181238] border border-purple-800/50 text-purple-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {profile.customFields && profile.customFields.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-purple-900/40">
              <h3 className="text-[11px] font-extrabold text-purple-300 uppercase tracking-wider">
                Informations & Garanties
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.customFields.map((field, idx) => (
                  <div key={idx} className="bg-[#181238] p-2.5 rounded-xl border border-purple-800/40">
                    <span className="text-[10px] text-purple-400 block font-medium">
                      {field.label}
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block truncate">
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Telegram / Social Action */}
          <div className="pt-3 border-t border-purple-900/40 space-y-2">
            {profile.socialLinks?.telegram ? (
              <button
                onClick={() => openTelegramLink(profile.socialLinks!.telegram!)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-cyan-500/25 transition active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                <span>Ouvrir sur Telegram ({profile.username ? `@${profile.username}` : 'Direct'})</span>
              </button>
            ) : (
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#181238] hover:bg-purple-900/50 text-white font-bold text-xs rounded-2xl border border-purple-800/50 transition"
              >
                <Share2 className="w-4 h-4 text-pink-400" />
                <span>{copiedLink ? 'Lien copié !' : 'Partager la boutique'}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Secret Admin Passcode Modal on 5 taps */}
      <SecretAdminModal
        isOpen={isSecretAdminOpen}
        onClose={() => setIsSecretAdminOpen(false)}
      />

      {/* Fullscreen Photo Gallery Modal */}
      <PhotoGalleryModal
        photos={photos}
        initialIndex={activePhotoIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Inscription Modal */}
      <SubmissionModal
        isOpen={isSubmissionOpen}
        onClose={() => setIsSubmissionOpen(false)}
      />

      {/* Réseaux Modal */}
      <NetworksModal
        isOpen={isNetworksOpen}
        onClose={() => setIsNetworksOpen(false)}
      />

      <BottomNav
        onOpenSubmission={() => setIsSubmissionOpen(true)}
        onOpenNetworks={() => setIsNetworksOpen(true)}
      />
    </div>
  );
};
