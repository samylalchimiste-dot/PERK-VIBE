import React, { useState, useRef } from 'react';
import { 
  X, 
  Store, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  Send,
  ShieldCheck,
  MapPin,
  Truck,
  Plane,
  ChevronLeft
} from 'lucide-react';
import { ShopSubmission, ServiceModes } from '../../types';
import { submitBoutiqueApplication } from '../../services/firebase/profiles';
import { SUPPORTED_COUNTRIES, getAllPopularCitiesForCountry, getAllRegionsForCountry } from '../../data/europeanLocations';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playVoteSound, playClickSound } from '../../services/audio/soundService';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('France');
  const [city, setCity] = useState('');
  const [secteur, setSecteur] = useState('');
  
  // Modes de service checkboxes
  const [serviceModes, setServiceModes] = useState<ServiceModes>({
    clickAndCollect: true,
    livraisonLocale: true,
    envoiPostal: true,
  });

  // Social & contact handles
  const [telegram, setTelegram] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [instagram, setInstagram] = useState('');
  const [potato, setPotato] = useState('');
  const [snapchat, setSnapchat] = useState('');

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleServiceMode = (mode: keyof ServiceModes) => {
    hapticFeedback('light');
    setServiceModes((prev) => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La photo du logo ne doit pas dépasser 5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      hapticFeedback('medium');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom de la boutique.');
      return;
    }

    // Check at least one service mode is checked
    if (!serviceModes.clickAndCollect && !serviceModes.livraisonLocale && !serviceModes.envoiPostal) {
      setError('Veuillez cocher au moins un mode de service.');
      return;
    }

    // Check at least one contact is provided
    if (!telegram.trim() && !telegramBot.trim() && !instagram.trim() && !potato.trim() && !snapchat.trim()) {
      setError('Veuillez renseigner au moins un canal de contact (Telegram, Bot, Instagram, Potato ou Snapchat).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submission: ShopSubmission = {
        name: name.trim(),
        country: country.trim(),
        city: city.trim(),
        secteur: secteur.trim(),
        serviceModes,
        telegram: telegram.trim(),
        telegramBot: telegramBot.trim(),
        instagram: instagram.trim(),
        potato: potato.trim(),
        snapchat: snapchat.trim(),
        photoUrl: logoPreview || undefined,
        description: `Boutique ${name.trim()} - ${city.trim() || country.trim()} (${secteur.trim() || 'Tous secteurs'}).`,
      };

      await submitBoutiqueApplication(submission);
      setIsSuccess(true);
      hapticFeedback('heavy');
      playVoteSound();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err?.message || 'Erreur lors de l\'envoi de la candidature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setName('');
    setCountry('France');
    setCity('');
    setSecteur('');
    setServiceModes({
      clickAndCollect: true,
      livraisonLocale: true,
      envoiPostal: true,
    });
    setTelegram('');
    setTelegramBot('');
    setInstagram('');
    setPotato('');
    setSnapchat('');
    setLogoPreview(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060312]/90 backdrop-blur-md flex flex-col justify-start overflow-y-auto">
      {/* Top Header bar matching screenshot */}
      <div className="sticky top-0 z-20 bg-[#0c0822]/95 backdrop-blur-xl border-b border-purple-900/40 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition px-1 py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Fermer</span>
        </button>

        <div className="text-center">
          <div className="font-extrabold text-xs tracking-wider text-amber-400 uppercase">Cartel Del Farmez</div>
          <div className="text-[10px] text-purple-300">menu & farm app</div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-w-md w-full mx-auto p-4 sm:p-5 flex-1 space-y-4 pb-20">
        {isSuccess ? (
          <div className="bg-[#120c2e] border border-purple-800/60 rounded-3xl p-6 shadow-2xl text-center space-y-4 my-6 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-white">
                Candidature Envoyée !
              </h3>
              <p className="text-xs text-purple-200/90 leading-relaxed max-w-xs mx-auto">
                Votre demande pour <span className="text-pink-400 font-bold">"{name}"</span> a été transmise avec succès à l'administration.
              </p>
            </div>

            <div className="p-4 bg-[#0a061c] rounded-2xl border border-purple-800/40 text-[11px] text-purple-300 text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Processus de validation Cartel Del Farmez :</span>
              </div>
              <ul className="space-y-1.5 text-purple-300/90 list-disc list-inside">
                <li>Examen des informations de la boutique et des réseaux.</li>
                <li>Validation manuelle immédiate par l'administrateur.</li>
                <li>Mise en ligne en direct sur le classement public !</li>
              </ul>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl transition shadow-xl shadow-pink-600/30"
            >
              Retourner au classement
            </button>
          </div>
        ) : (
          <>
            {/* Title & Description matching screenshot */}
            <div className="space-y-1 pt-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🛒</span>
                <span>Inscrire ma boutique</span>
              </h2>
              <p className="text-xs text-purple-300/80 leading-relaxed">
                Propose ta boutique au classement Cartel Del Farmez. Chaque demande est examinée et validée manuellement par l'équipe avant d'être mise en ligne.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Nom de la boutique */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Nom de la boutique <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : MA BOUTIQUE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Pays <span className="text-pink-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUPPORTED_COUNTRIES.map((c) => {
                    const isSelected = country.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountry(c.name);
                          // Suggest first popular region if sector empty
                          if (!secteur && c.popularRegions.length > 0) {
                            setSecteur(c.popularRegions[0]);
                          }
                          hapticFeedback('light');
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500/80 text-white shadow-md shadow-pink-950/40'
                            : 'bg-[#120c2e]/70 border-purple-900/40 text-purple-300 hover:text-white hover:bg-[#18103d]'
                        }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 2: Ville */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    Ville
                  </label>
                  <span className="text-[10px] text-purple-400">
                    {country}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={`Ex : ${country === 'Espagne' ? 'MADRID ou BARCELONE' : country === 'Belgique' ? 'BRUXELLES ou LIÈGE' : country === 'Suisse' ? 'GENÈVE ou LAUSANNE' : country === 'Allemagne' ? 'BERLIN ou MUNICH' : 'PARIS'}`}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />

                {/* Popular city quick suggestion chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                  <span className="text-[10px] text-purple-400 font-semibold shrink-0">Populaires :</span>
                  {getAllPopularCitiesForCountry(country).slice(0, 7).map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => {
                        setCity(cName);
                        hapticFeedback('light');
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border shrink-0 transition ${
                        city.toLowerCase() === cName.toLowerCase()
                          ? 'bg-pink-600/30 text-pink-300 border-pink-500/60 font-bold'
                          : 'bg-[#150f36] text-purple-300 border-purple-800/40 hover:text-white'
                      }`}
                    >
                      {cName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Secteur */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Secteur / Région
                </label>
                <input
                  type="text"
                  placeholder={country === 'Espagne' ? 'Ex : Catalogne / Madrid' : country === 'Belgique' ? 'Ex : Bruxelles & Banlieue' : country === 'Suisse' ? 'Ex : Suisse Romande' : country === 'Allemagne' ? 'Ex : Bavière / Berlin' : 'Ex : 75 & IDF'}
                  value={secteur}
                  onChange={(e) => setSecteur(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />

                {/* Popular regions quick suggestion chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-1 scrollbar-none">
                  {getAllRegionsForCountry(country).slice(0, 4).map((rName) => (
                    <button
                      key={rName}
                      type="button"
                      onClick={() => {
                        setSecteur(rName);
                        hapticFeedback('light');
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border shrink-0 transition ${
                        secteur.toLowerCase() === rName.toLowerCase()
                          ? 'bg-purple-600/30 text-purple-200 border-purple-500/60 font-bold'
                          : 'bg-[#150f36] text-purple-300 border-purple-800/40 hover:text-white'
                      }`}
                    >
                      {rName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Mode(s) de service * — coche au moins une case */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-200">
                  Mode(s) de service <span className="text-pink-500">*</span> <span className="text-purple-300 font-normal">— coche au moins une case</span>
                </label>

                {/* Card 1: Click & Collect */}
                <div
                  onClick={() => toggleServiceMode('clickAndCollect')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                    serviceModes.clickAndCollect
                      ? 'bg-[#150d36] border-purple-600/80 shadow-md shadow-purple-950/40'
                      : 'bg-[#0f0a26]/70 border-purple-900/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                    serviceModes.clickAndCollect
                      ? 'bg-white text-[#0f0a26] border-white'
                      : 'bg-transparent border-purple-600/50'
                  }`}>
                    {serviceModes.clickAndCollect && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <span>📍</span>
                    <span>Click & Collect</span>
                  </span>
                </div>

                {/* Card 2: Livraison Locale */}
                <div
                  onClick={() => toggleServiceMode('livraisonLocale')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                    serviceModes.livraisonLocale
                      ? 'bg-[#150d36] border-purple-600/80 shadow-md shadow-purple-950/40'
                      : 'bg-[#0f0a26]/70 border-purple-900/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                    serviceModes.livraisonLocale
                      ? 'bg-white text-[#0f0a26] border-white'
                      : 'bg-transparent border-purple-600/50'
                  }`}>
                    {serviceModes.livraisonLocale && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <span>🚚</span>
                    <span>Livraison Locale</span>
                  </span>
                </div>

                {/* Card 3: Envoi Postal suivi */}
                <div
                  onClick={() => toggleServiceMode('envoiPostal')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition select-none ${
                    serviceModes.envoiPostal
                      ? 'bg-[#150d36] border-purple-600/80 shadow-md shadow-purple-950/40'
                      : 'bg-[#0f0a26]/70 border-purple-900/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                    serviceModes.envoiPostal
                      ? 'bg-white text-[#0f0a26] border-white'
                      : 'bg-transparent border-purple-600/50'
                  }`}>
                    {serviceModes.envoiPostal && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <span>✈️</span>
                    <span>Envoi Postal suivi</span>
                  </span>
                </div>
              </div>

              {/* Field 5: Telegram */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-200">
                  Telegram
                </label>
                <input
                  type="text"
                  placeholder="@pseudo ou lien"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Field 6: Bot Telegram */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Bot Telegram
                </label>
                <input
                  type="text"
                  placeholder="@pseudo_bot ou lien"
                  value={telegramBot}
                  onChange={(e) => setTelegramBot(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Field 7: Instagram */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Instagram
                </label>
                <input
                  type="text"
                  placeholder="@pseudo ou lien"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Field 8: Potato */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Potato
                </label>
                <input
                  type="text"
                  placeholder="lien m.pt.im..."
                  value={potato}
                  onChange={(e) => setPotato(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Field 9: Snapchat */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Snapchat
                </label>
                <input
                  type="text"
                  placeholder="@pseudo ou lien"
                  value={snapchat}
                  onChange={(e) => setSnapchat(e.target.value)}
                  className="w-full bg-[#120c2e]/90 border border-purple-800/60 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-400/40 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Field 10: Logo de la boutique (optionnel) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-200">
                  Logo de la boutique <span className="text-purple-300 font-normal">(optionnel)</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                {logoPreview ? (
                  <div className="relative rounded-2xl border border-purple-700/60 bg-[#120c2e] p-3 flex items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo boutique"
                      className="w-14 h-14 rounded-xl object-cover border border-purple-800/50 shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-bold text-white truncate">Logo sélectionné</div>
                      <div className="text-[11px] text-emerald-400">Prêt pour envoi</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 text-purple-400 hover:text-rose-400 rounded-xl hover:bg-purple-900/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-700/50 hover:border-purple-500/80 bg-[#100b28]/60 hover:bg-[#150e33] rounded-2xl p-6 text-center cursor-pointer transition space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 group-hover:text-pink-400 mx-auto transition">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs sm:text-sm text-white">
                        Ajouter un logo
                      </div>
                      <div className="text-[11px] text-purple-300/70">
                        PNG, JPG ou WebP · carré idéal
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 11: Button '✅ Envoyer ma candidature' */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:opacity-95 text-white font-extrabold text-sm rounded-2xl transition shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Envoi de la candidature...</span>
                    </>
                  ) : (
                    <span>✅ Envoyer ma candidature</span>
                  )}
                </button>
              </div>

              {/* Field 12: Notice bottom text */}
              <div className="text-[11px] text-purple-300/70 leading-relaxed text-center px-2 pt-1 pb-2">
                ⚠️ En envoyant ta demande, tu acceptes de recevoir un message privé avec la réponse. Si tu n'as jamais ouvert le bot, fais /start une fois pour autoriser l'envoi.
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
