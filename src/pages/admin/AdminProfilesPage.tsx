import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Edit3, 
  Send, 
  AlertTriangle, 
  Archive, 
  CheckCircle2, 
  Clock, 
  X, 
  Filter, 
  Sparkles, 
  ExternalLink,
  Store,
  Heart,
  MapPin
} from 'lucide-react';
import { Profile, ProfileStatus } from '../../types';
import { 
  subscribeAdminProfiles, 
  publishProfile, 
  unpublishProfile, 
  archiveProfile 
} from '../../services/firebase/profiles';
import { ConfirmationModal, ConfirmationType } from '../../components/admin/ConfirmationModal';

export const AdminProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | ProfileStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

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
        console.error('Error fetching admin profiles:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
      } else if (modalType === 'unpublish') {
        await unpublishProfile(selectedProfile.id);
      } else if (modalType === 'archive') {
        await archiveProfile(selectedProfile.id);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filter items
  const filteredProfiles = profiles.filter((p) => {
    if (activeStatusTab !== 'all' && p.status !== activeStatusTab) return false;
    if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
    if (selectedRegion !== 'all' && (p.region || '').toLowerCase() !== selectedRegion.toLowerCase()) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.region && p.region.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const categories = Array.from(new Set(profiles.map((p) => p.category).filter(Boolean)));
  const regions = Array.from(new Set(profiles.map((p) => p.region).filter(Boolean)));

  const countByStatus = {
    all: profiles.length,
    published: profiles.filter(p => p.status === 'published').length,
    draft: profiles.filter(p => p.status === 'draft').length,
    archived: profiles.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Annuaire & Boutiques Partenaires
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Recherche, édition, validation manuelle et publication en direct
          </p>
        </div>

        <Link
          to="/admin/profiles/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-pink-600/25 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          + Nouvelle Boutique
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 bg-[#120e29] p-1.5 rounded-2xl border border-purple-800/40 overflow-x-auto scrollbar-none text-xs font-semibold">
        <button
          onClick={() => setActiveStatusTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            activeStatusTab === 'all'
              ? 'bg-[#1e1745] text-white shadow'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <span>Toutes</span>
          <span className="bg-[#0a071c] px-2 py-0.5 rounded-full text-[10px] text-purple-200">
            {countByStatus.all}
          </span>
        </button>

        <button
          onClick={() => setActiveStatusTab('published')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            activeStatusTab === 'published'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Publiées</span>
          <span className="bg-[#0a071c] px-2 py-0.5 rounded-full text-[10px] text-emerald-400">
            {countByStatus.published}
          </span>
        </button>

        <button
          onClick={() => setActiveStatusTab('draft')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            activeStatusTab === 'draft'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>À Valider (Candidatures)</span>
          <span className="bg-[#0a071c] px-2 py-0.5 rounded-full text-[10px] text-pink-400 font-bold">
            {countByStatus.draft}
          </span>
        </button>

        <button
          onClick={() => setActiveStatusTab('archived')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            activeStatusTab === 'archived'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-rose-400" />
          <span>Archivées</span>
          <span className="bg-[#0a071c] px-2 py-0.5 rounded-full text-[10px] text-rose-400">
            {countByStatus.archived}
          </span>
        </button>
      </div>

      {/* Search and Secondary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1 relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche boutique, pseudo, région..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#120e29] border border-purple-800/40 focus:border-pink-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-[#120e29] border border-purple-800/40 focus:border-pink-500 rounded-xl px-3 py-2.5 text-xs text-purple-200 focus:outline-none transition"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full bg-[#120e29] border border-purple-800/40 focus:border-pink-500 rounded-xl px-3 py-2.5 text-xs text-purple-200 focus:outline-none transition"
          >
            <option value="all">Toutes les régions / départements</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Profiles Table / Card List */}
      <div className="bg-[#120e29] border border-purple-800/40 rounded-3xl overflow-hidden shadow-xl">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Store className="w-10 h-10 text-purple-400/60 mx-auto" />
            <h4 className="font-bold text-sm text-white">Aucune boutique trouvée</h4>
            <p className="text-xs text-purple-300">
              Modifiez vos filtres de recherche ou ajoutez une nouvelle boutique.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-purple-900/40">
            {filteredProfiles.map((prof) => (
              <div
                key={prof.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1a143b]/40 transition"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#0a071c] shrink-0 border border-purple-800/60 shadow-inner">
                    {prof.photos?.[0]?.url ? (
                      <img
                        src={prof.photos[0].url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 m-4 text-purple-400" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate">
                        {prof.name}
                      </h3>
                      {prof.username && (
                        <span className="text-xs text-pink-400 font-mono">
                          @{prof.username}
                        </span>
                      )}
                      {prof.featured && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Top Farmz
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-purple-300">
                      <span className="font-semibold text-white">{prof.region || prof.city || 'National'}</span>
                      <span>•</span>
                      <span className="text-purple-300">{prof.category}</span>
                      <span>•</span>
                      <span className="text-pink-400 font-bold flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                        {prof.votes || 0} votes
                      </span>
                    </div>

                    {prof.description && (
                      <p className="text-xs text-purple-300/80 line-clamp-1">
                        {prof.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Status badge & Action buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-purple-900/40">
                  {/* Status Indicator */}
                  <div>
                    {prof.status === 'published' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Publiée
                      </span>
                    ) : prof.status === 'draft' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        En attente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <Archive className="w-3.5 h-3.5" />
                        Archivée
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {prof.status === 'published' && (
                      <Link
                        to={`/profile/${prof.id}`}
                        target="_blank"
                        className="p-2 bg-[#1b153d] hover:bg-purple-900/60 text-purple-300 hover:text-white rounded-xl transition"
                        title="Voir fiche publique"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <Link
                      to={`/admin/profiles/${prof.id}/edit`}
                      className="flex items-center gap-1 px-3 py-2 bg-[#1b153d] hover:bg-purple-900/60 text-purple-200 text-xs font-semibold rounded-xl border border-purple-800/40 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Modifier
                    </Link>

                    {prof.status === 'draft' && (
                      <button
                        onClick={() => handleOpenAction('publish', prof)}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Valider & Publier
                      </button>
                    )}

                    {prof.status === 'published' && (
                      <button
                        onClick={() => handleOpenAction('unpublish', prof)}
                        className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition"
                      >
                        Dépublier
                      </button>
                    )}

                    {prof.status !== 'archived' && (
                      <button
                        onClick={() => handleOpenAction('archive', prof)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition"
                        title="Archiver"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        type={modalType}
        itemName={selectedProfile?.name}
        onConfirm={handleConfirmAction}
        onCancel={() => setModalOpen(false)}
        isLoading={isActionLoading}
      />
    </div>
  );
};
