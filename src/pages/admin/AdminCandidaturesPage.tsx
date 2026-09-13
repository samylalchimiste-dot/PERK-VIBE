import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileEdit,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  Store,
  MapPin,
  Clock,
  Send,
  AlertTriangle,
  Search,
  Sparkles,
  Phone,
  MessageCircle,
  Tag,
  ShieldCheck,
  Truck,
  Plane,
  Instagram,
  Bot,
  Globe
} from 'lucide-react';
import { Profile } from '../../types';
import {
  subscribeAdminProfiles,
  publishProfile,
  archiveProfile,
  deleteProfilePermanently
} from '../../services/firebase/profiles';
import { ConfirmationModal, ConfirmationType } from '../../components/admin/ConfirmationModal';

export const AdminCandidaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfirmationType>('publish');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAdminProfiles(
      (items) => {
        setProfiles(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching profiles for moderation:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter only pending drafts (candidatures)
  const candidatures = profiles.filter((p) => p.status === 'draft');

  const filteredCandidatures = candidatures.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.secteur && c.secteur.toLowerCase().includes(q)) ||
      (c.region && c.region.toLowerCase().includes(q)) ||
      (c.socialLinks?.telegram && c.socialLinks.telegram.toLowerCase().includes(q)) ||
      (c.socialLinks?.telegramBot && c.socialLinks.telegramBot.toLowerCase().includes(q)) ||
      (c.socialLinks?.instagram && c.socialLinks.instagram.toLowerCase().includes(q)) ||
      (c.socialLinks?.potato && c.socialLinks.potato.toLowerCase().includes(q)) ||
      (c.socialLinks?.snapchat && c.socialLinks.snapchat.toLowerCase().includes(q))
    );
  });

  const handleOpenAction = (type: ConfirmationType, profile: Profile) => {
    setSelectedProfile(profile);
    setModalType(type);
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProfile) return;

    setIsActionLoading(true);
    try {
      if (modalType === 'publish') {
        await publishProfile(selectedProfile.id);
      } else if (modalType === 'archive') {
        await archiveProfile(selectedProfile.id);
      } else if (modalType === 'delete_permanent') {
        await deleteProfilePermanently(selectedProfile.id, selectedProfile.photos);
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error('Action error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileEdit className="w-6 h-6 text-pink-400" />
            <span>Demandes d'Inscription & Candidatures</span>
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Examinez, validez d'un clic pour publier en direct sur la mini-application.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-300 font-bold text-xs font-mono">
            {candidatures.length} candidature{candidatures.length > 1 ? 's' : ''} en attente
          </span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par nom, ville, secteur, @telegram, instagram..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#120e29] border border-purple-800/50 focus:border-pink-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
        />
      </div>

      {/* List of Applications */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#120e29] border border-purple-800/40 rounded-2xl p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : filteredCandidatures.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#120e29]/70 border border-dashed border-purple-800/50 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-pink-400 mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="font-extrabold text-base text-white">Toutes les candidatures sont traitées !</h3>
          <p className="text-xs text-purple-300 max-w-sm mx-auto">
            {candidatures.length === 0
              ? "Aucune nouvelle inscription en attente. Dès qu'un utilisateur envoie sa boutique via la mini-application, elle apparaîtra ici en temps réel."
              : "Aucune candidature ne correspond à votre recherche."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidatures.map((candidature) => {
            const photoUrl = candidature.photos?.[0]?.url;
            const modes = candidature.serviceModes;
            const socials = candidature.socialLinks || {};

            return (
              <div
                key={candidature.id}
                className="bg-[#120e29] border border-purple-800/60 hover:border-purple-600/70 rounded-3xl p-5 shadow-xl transition space-y-4 relative overflow-hidden"
              >
                {/* Top Row: Shop Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Photo / Logo */}
                    <div className="w-16 h-16 rounded-2xl bg-purple-950 border border-purple-800/50 overflow-hidden shrink-0 flex items-center justify-center text-purple-400">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-lg text-white">{candidature.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          ⏳ En attente de validation
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-purple-300 flex-wrap">
                        {candidature.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Ville : <strong className="text-white">{candidature.city}</strong></span>
                          </span>
                        )}

                        {candidature.secteur && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300 text-[11px]">
                            Secteur : <strong className="text-pink-300">{candidature.secteur}</strong>
                          </span>
                        )}
                      </div>

                      {/* Modes de service Badges */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[11px] text-purple-400 font-semibold">Modes de service :</span>
                        {modes?.clickAndCollect && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[10px] font-bold">
                            📍 Click & Collect
                          </span>
                        )}
                        {modes?.livraisonLocale && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-300 text-[10px] font-bold">
                            🚚 Livraison Locale
                          </span>
                        )}
                        {modes?.envoiPostal && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-950/80 border border-purple-800/50 text-purple-300 text-[10px] font-bold">
                            ✈️ Envoi Postal suivi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                    {/* Valider & Publier (Green) */}
                    <button
                      onClick={() => handleOpenAction('publish', candidature)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Publier</span>
                    </button>

                    {/* Modifier */}
                    <Link
                      to={`/admin/profiles/${candidature.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold rounded-xl border border-purple-700/40 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Modifier</span>
                    </Link>

                    {/* Refuser / Supprimer */}
                    <button
                      onClick={() => handleOpenAction('delete_permanent', candidature)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition"
                      title="Refuser et supprimer la demande"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>

                {/* Social & Contact Links Provided */}
                <div className="p-3 bg-[#0a061c] rounded-2xl border border-purple-900/40 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Réseaux & Contacts Fournis :
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {socials.telegram && (
                      <a
                        href={socials.telegram.startsWith('http') ? socials.telegram : `https://t.me/${socials.telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-950/70 border border-sky-800/40 text-sky-300 hover:text-white transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Telegram : {socials.telegram.replace('https://t.me/', '@')}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}

                    {socials.telegramBot && (
                      <a
                        href={socials.telegramBot.startsWith('http') ? socials.telegramBot : `https://t.me/${socials.telegramBot.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/70 border border-indigo-800/40 text-indigo-300 hover:text-white transition"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Bot : {socials.telegramBot.replace('https://t.me/', '@')}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}

                    {socials.instagram && (
                      <a
                        href={socials.instagram.startsWith('http') ? socials.instagram : `https://instagram.com/${socials.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-950/70 border border-pink-800/40 text-pink-300 hover:text-white transition"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Instagram : {socials.instagram.replace('https://instagram.com/', '@')}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}

                    {socials.potato && (
                      <a
                        href={socials.potato.startsWith('http') ? socials.potato : `https://${socials.potato}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/70 border border-amber-800/40 text-amber-300 hover:text-white transition"
                      >
                        <span>🥔 Potato : {socials.potato}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}

                    {socials.snapchat && (
                      <a
                        href={socials.snapchat.startsWith('http') ? socials.snapchat : `https://snapchat.com/add/${socials.snapchat.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-950/70 border border-yellow-800/40 text-yellow-300 hover:text-white transition"
                      >
                        <span>👻 Snapchat : {socials.snapchat.replace('https://snapchat.com/add/', '@')}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        type={modalType}
        itemName={selectedProfile?.name || ''}
        isLoading={isActionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};
