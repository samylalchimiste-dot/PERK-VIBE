import React from 'react';
import { AlertTriangle, CheckCircle, Trash2, X, Archive, RotateCcw, Send } from 'lucide-react';

export type ConfirmationType = 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete_permanent';

interface Props {
  isOpen: boolean;
  type: ConfirmationType;
  title?: string;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<Props> = ({
  isOpen,
  type,
  title,
  itemName,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'publish':
        return {
          title: title || 'Validation Manuelle — Publication',
          message: `Publier ce profil ${itemName ? `"${itemName}"` : ''} ? Il deviendra visible instantanément par tous les utilisateurs de la Mini App.`,
          confirmText: 'Oui, Publier le Profil',
          confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25',
          icon: <Send className="w-6 h-6 text-emerald-400" />,
          iconBg: 'bg-emerald-500/10 border-emerald-500/30',
        };
      case 'unpublish':
        return {
          title: title || 'Dépublier le Profil',
          message: `Dépublier ce profil ${itemName ? `"${itemName}"` : ''} ? Il repassera en statut Brouillon (draft) et ne sera plus visible du public.`,
          confirmText: 'Dépublier (Vers Brouillon)',
          confirmBtnClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          iconBg: 'bg-amber-500/10 border-amber-500/30',
        };
      case 'archive':
        return {
          title: title || 'Archiver le Profil',
          message: `Archiver ce profil ${itemName ? `"${itemName}"` : ''} ? Il sera retiré de la vue publique et placé dans la corbeille / archives administratives.`,
          confirmText: 'Archiver le Profil',
          confirmBtnClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25',
          icon: <Archive className="w-6 h-6 text-rose-400" />,
          iconBg: 'bg-rose-500/10 border-rose-500/30',
        };
      case 'restore':
        return {
          title: title || 'Restaurer le Profil',
          message: `Restaurer ce profil ${itemName ? `"${itemName}"` : ''} depuis les archives vers le statut Brouillon ?`,
          confirmText: 'Restaurer en Brouillon',
          confirmBtnClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25',
          icon: <RotateCcw className="w-6 h-6 text-blue-400" />,
          iconBg: 'bg-blue-500/10 border-blue-500/30',
        };
      case 'delete_permanent':
        return {
          title: title || 'Suppression Définitive',
          message: `Supprimer DÉFINITIVEMENT ce profil ${itemName ? `"${itemName}"` : ''} ainsi que tous ses fichiers stockés dans Firebase Storage ? Cette opération est irréversible.`,
          confirmText: 'Supprimer Définitivement',
          confirmBtnClass: 'bg-red-700 hover:bg-red-600 text-white shadow-red-700/30',
          icon: <Trash2 className="w-6 h-6 text-rose-400" />,
          iconBg: 'bg-rose-500/10 border-rose-500/30',
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border shrink-0 ${config.iconBg}`}>
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-tight">
              {config.title}
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {config.message}
            </p>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2 ${config.confirmBtnClass} ${
              isLoading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {isLoading ? 'Traitement...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
