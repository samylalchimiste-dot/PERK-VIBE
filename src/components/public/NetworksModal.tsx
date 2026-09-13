import React from 'react';
import { X, Send, Globe, MessageSquare, ShieldCheck, Users, ExternalLink, Sparkles } from 'lucide-react';
import { openTelegramLink, hapticFeedback } from '../../services/telegram/telegramService';

interface NetworksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworksModal: React.FC<NetworksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const networks = [
    {
      title: 'Canal Officiel PERK VIBES FARMZ',
      handle: '@PerkVibesFarmz',
      desc: 'Drops officiels, nouveaux arrivages Static, Frozen & Dry',
      link: 'https://t.me/F2nOfficiel_Bot',
      icon: Send,
      badge: 'Principal',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Communauté & Chat Farmz',
      handle: '@PerkVibes_Chat',
      desc: 'Échanges en direct entre connaisseurs et retours de dégustation',
      link: 'https://t.me/F2nOfficiel_Bot',
      icon: MessageSquare,
      badge: 'Live Chat',
      color: 'from-purple-600 to-indigo-600',
    },
    {
      title: 'Support & Bot Commandes',
      handle: '@F2nOfficiel_Bot',
      desc: 'Prise de commande directe, catalogue et assistance sécurisée',
      link: 'https://t.me/F2nOfficiel_Bot',
      icon: ShieldCheck,
      badge: '24/7',
      color: 'from-cyan-500 to-blue-600',
    },
  ];

  const handleOpen = (link: string) => {
    hapticFeedback('medium');
    openTelegramLink(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060412]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#120e29] border border-purple-800/50 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-purple-950/60 border border-purple-800/40 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-purple-900/40">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">
              Réseaux Officiels PERK VIBES FARMZ
            </h3>
            <p className="text-[11px] text-purple-300">
              Rejoignez tous les canaux officiels de la farm
            </p>
          </div>
        </div>

        {/* List of Channels */}
        <div className="space-y-3 pt-1">
          {networks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => handleOpen(item.link)}
                className="group bg-[#171233]/80 hover:bg-[#201947] border border-purple-900/50 hover:border-purple-600/60 rounded-2xl p-3.5 transition cursor-pointer flex items-center justify-between gap-3 shadow-md shadow-purple-950/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-white truncate group-hover:text-pink-300 transition">
                        {item.title}
                      </h4>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-950 border border-purple-700/50 text-purple-300">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                      {item.handle}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="p-2 bg-purple-950 text-purple-300 group-hover:text-white rounded-xl border border-purple-800/40 group-hover:border-pink-500/40 transition shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Warning */}
        <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-800/30 text-[10px] text-purple-300/80 leading-relaxed text-center">
          🔒 Attention aux faux comptes : vérifiez toujours que les identifiants correspondent exactement aux canaux listés ici.
        </div>
      </div>
    </div>
  );
};
