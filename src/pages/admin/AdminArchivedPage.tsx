import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  Users, 
  ArrowLeft 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Profile } from '../../types';
import { 
  subscribeAdminProfiles, 
  restoreProfile, 
  deleteProfilePermanently 
} from '../../services/firebase/profiles';
import { ConfirmationModal, ConfirmationType } from '../../components/admin/ConfirmationModal';

export const AdminArchivedPage: React.FC = () => {
  const [archivedProfiles, setArchivedProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfirmationType>('restore');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAdminProfiles(
      (items) => {
        const archived = items.filter((p) => p.status === 'archived');
        setArchivedProfiles(archived);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading archives:', err);
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
      if (modalType === 'restore') {
        await restoreProfile(selectedProfile.id);
      } else if (modalType === 'delete_permanent') {
        await deleteProfilePermanently(selectedProfile.id, selectedProfile.photos);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/profiles"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Profils Archivés / Corbeille
            </h1>
            <p className="text-xs text-slate-400">
              Profils retirés de la vue publique. Possibilité de restauration ou suppression définitive.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-rose-400 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-800/40 font-semibold">
          {archivedProfiles.length} archivé{archivedProfiles.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {archivedProfiles.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Archive className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-bold text-sm text-white">La corbeille est vide</h4>
            <p className="text-xs text-slate-400">
              Aucun profil archivé pour le moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {archivedProfiles.map((prof) => (
              <div
                key={prof.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 opacity-60">
                    {prof.photos?.[0]?.url ? (
                      <img
                        src={prof.photos[0].url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 m-3 text-slate-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white truncate line-through opacity-75">
                      {prof.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {[prof.city, prof.country].filter(Boolean).join(' • ')} • <span className="text-slate-500">{prof.category}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenAction('restore', prof)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/30 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurer
                  </button>

                  <button
                    onClick={() => handleOpenAction('delete_permanent', prof)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer Définitivement
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
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
