import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Globe,
  Instagram,
  Mail,
  Phone,
  Clock,
  Heart,
  Award,
  MapPin
} from 'lucide-react';
import { Profile, ProfilePhoto, CustomField } from '../../types';
import { 
  getAdminProfileById, 
  createProfile, 
  updateProfile, 
  publishProfile 
} from '../../services/firebase/profiles';
import { uploadProfilePhoto, deleteProfilePhotoFromStorage } from '../../services/firebase/storage';
import { PhotoUploader, PendingPhoto } from '../../components/admin/PhotoUploader';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { FRENCH_DEPARTMENTS, getCitiesForDepartment } from '../../data/frenchLocations';
import { SUPPORTED_COUNTRIES, getAllPopularCitiesForCountry, getAllRegionsForCountry } from '../../data/europeanLocations';

const PRESET_CATEGORIES = [
  '2x STATIC',
  'FROZEN SIFT',
  'DRY SIFT',
  'Extractions & Concentrés',
  'Farmz & Terpènes',
  'Fleurs & Top Shelf',
  'Gourmet & Edibles',
  'Autre'
];

export const AdminProfileFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('France');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('Paris IDF');
  const [secteur, setSecteur] = useState('');
  const [serviceModes, setServiceModes] = useState({
    clickAndCollect: true,
    livraisonLocale: true,
    envoiPostal: true,
  });
  const [category, setCategory] = useState('2x STATIC');
  const [customCategory, setCustomCategory] = useState('');
  const [votes, setVotes] = useState(0);
  const [badge, setBadge] = useState('');
  const [featured, setFeatured] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published' | 'archived'>('draft');

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Social Links
  const [telegram, setTelegram] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [instagram, setInstagram] = useState('');
  const [potato, setPotato] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Custom Fields
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Photos
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);

  // Publish Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  useEffect(() => {
    async function loadExisting() {
      if (!id) return;
      setIsLoadingProfile(true);
      try {
        const prof = await getAdminProfileById(id);
        if (prof) {
          setName(prof.name || '');
          setUsername(prof.username || '');
          setDescription(prof.description || '');
          setCountry(prof.country || 'France');
          setCity(prof.city || '');
          setRegion(prof.region || 'Paris IDF');
          setSecteur(prof.secteur || '');
          if (prof.serviceModes) {
            setServiceModes(prof.serviceModes);
          }
          setVotes(prof.votes || 0);
          setBadge(prof.badge || '');
          
          if (PRESET_CATEGORIES.includes(prof.category)) {
            setCategory(prof.category);
          } else {
            setCategory('Autre');
            setCustomCategory(prof.category || '');
          }

          setFeatured(Boolean(prof.featured));
          setCurrentStatus(prof.status || 'draft');
          setTags(prof.tags || []);
          setTelegram(prof.socialLinks?.telegram || '');
          setTelegramBot(prof.socialLinks?.telegramBot || '');
          setInstagram(prof.socialLinks?.instagram || '');
          setPotato(prof.socialLinks?.potato || '');
          setSnapchat(prof.socialLinks?.snapchat || '');
          setWebsite(prof.socialLinks?.website || '');
          setEmail(prof.socialLinks?.email || '');
          setPhone(prof.socialLinks?.phone || '');
          setCustomFields(prof.customFields || []);

          if (prof.photos && prof.photos.length > 0) {
            const formatted: PendingPhoto[] = prof.photos.map((p, idx) => ({
              id: `existing-${idx}`,
              previewUrl: p.url,
              existingPhoto: p,
              isPrimary: Boolean(p.isPrimary),
              order: p.order || idx,
            }));
            setPhotos(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to load profile for editing:', err);
        setErrorMessage('Impossible de charger la boutique.');
      } finally {
        setIsLoadingProfile(false);
      }
    }

    if (isEditing) {
      loadExisting();
    }
  }, [id, isEditing]);

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const handleUpdateCustomField = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][key] = val;
    setCustomFields(updated);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Le nom de la boutique est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSubmitProgress('Enregistrement des données...');

    try {
      const finalCategory = category === 'Autre' && customCategory.trim() ? customCategory.trim() : category;

      let targetProfileId = id;

      if (!isEditing) {
        // Step 1: Create Draft Profile
        targetProfileId = await createProfile(
          {
            name: name.trim(),
            username: username.trim(),
            description: description.trim(),
            country: country.trim(),
            city: city.trim(),
            region: region.trim(),
            secteur: secteur.trim(),
            serviceModes,
            category: finalCategory,
            photos: [],
            featured,
            votes,
            badge: badge.trim(),
            tags,
            socialLinks: {
              telegram: telegram.trim() || undefined,
              telegramBot: telegramBot.trim() || undefined,
              instagram: instagram.trim() || undefined,
              potato: potato.trim() || undefined,
              snapchat: snapchat.trim() || undefined,
              website: website.trim() || undefined,
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
            },
            customFields: customFields.filter(f => f.label.trim() && f.value.trim()),
          },
          user?.uid
        );
      }

      if (!targetProfileId) {
        throw new Error('Identifiant boutique invalide.');
      }

      // Step 2: Handle Photos upload to Firebase Storage
      const uploadedPhotos: ProfilePhoto[] = [];

      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        if (item.existingPhoto) {
          uploadedPhotos.push({
            ...item.existingPhoto,
            order: i,
            isPrimary: item.isPrimary,
          });
        } else if (item.file) {
          setSubmitProgress(`Téléversement de la photo ${i + 1}/${photos.length}...`);
          const uploaded = await uploadProfilePhoto(
            targetProfileId,
            item.file,
            i,
            item.isPrimary,
            (pct) => {
              setPhotos((prev) =>
                prev.map((p, idx) => (idx === i ? { ...p, uploadProgress: pct } : p))
              );
            }
          );
          uploadedPhotos.push(uploaded);
        }
      }

      // Step 3: Update Firestore Document with all photos & fields
      setSubmitProgress('Mise à jour finale de la boutique...');
      await updateProfile(
        targetProfileId,
        {
          name: name.trim(),
          username: username.trim(),
          description: description.trim(),
          country: country.trim(),
          city: city.trim(),
          region: region.trim(),
          secteur: secteur.trim(),
          serviceModes,
          category: finalCategory,
          photos: uploadedPhotos,
          featured,
          votes,
          badge: badge.trim(),
          tags,
          socialLinks: {
            telegram: telegram.trim() || undefined,
            telegramBot: telegramBot.trim() || undefined,
            instagram: instagram.trim() || undefined,
            potato: potato.trim() || undefined,
            snapchat: snapchat.trim() || undefined,
            website: website.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          },
          customFields: customFields.filter(f => f.label.trim() && f.value.trim()),
        },
        user?.uid
      );

      navigate('/admin/profiles');
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
      setSubmitProgress(null);
    }
  };

  const handleManualPublish = async () => {
    if (!id) return;
    try {
      await publishProfile(id, user?.uid);
      setCurrentStatus('published');
      setPublishModalOpen(false);
    } catch (err: any) {
      console.error('Publish error:', err);
      setErrorMessage(err.message || 'Échec de la publication.');
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-purple-300">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
        <p className="text-xs font-medium">Chargement des données de la boutique...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top bar with back link and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-900/40">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/profiles"
            className="p-2 bg-[#120e29] hover:bg-[#1a143b] text-purple-300 rounded-xl border border-purple-800/40 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {isEditing ? `Modifier : ${name || 'Boutique'}` : 'Ajouter une Boutique Partenaire'}
            </h1>
            <p className="text-xs text-purple-300">
              {isEditing
                ? 'Mise à jour en direct dans Firebase Firestore'
                : 'La boutique sera initialement créée en statut Brouillon (draft)'}
            </p>
          </div>
        </div>

        {/* Status Pill & Fast Publish Button if editing */}
        {isEditing && (
          <div className="flex items-center gap-2">
            {currentStatus === 'published' ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Statut : Publiée en live
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Valider & Publier
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress banner */}
      {submitProgress && (
        <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-2xl text-pink-300 text-xs flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span className="font-semibold">{submitProgress}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Identity */}
        <div className="bg-[#120e29] border border-purple-800/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            1. Informations de la Boutique
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Nom de la Boutique *
              </label>
              <input
                id="profile-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Luffy 31 Shop"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Identifiant / Canal Telegram
              </label>
              <div className="relative">
                <span className="text-purple-400 text-xs font-mono absolute left-3.5 top-1/2 -translate-y-1/2">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                  placeholder="luffy31_shop"
                  className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Pays de la Boutique
              </label>
              <select
                value={country}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  setCountry(newCountry);
                  const cities = getAllPopularCitiesForCountry(newCountry);
                  if (cities.length > 0) {
                    setCity(cities[0]);
                  }
                  const regions = getAllRegionsForCountry(newCountry);
                  if (regions.length > 0) {
                    setRegion(regions[0]);
                    setSecteur(regions[0]);
                  }
                }}
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-semibold"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Région / Secteur ({country})
              </label>
              {country === 'France' ? (
                <select
                  value={region}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    setRegion(newDept);
                    const cities = getCitiesForDepartment(newDept);
                    if (cities.length > 0 && !city) {
                      setCity(cities[0]);
                    }
                  }}
                  className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                >
                  <optgroup label="Grandes Régions & Métropoles">
                    <option value="75 Paris (Île-de-France)">75 Paris (Île-de-France)</option>
                    <option value="13 Bouches-du-Rhône (Marseille / Aix)">13 Bouches-du-Rhône (Marseille / Aix)</option>
                    <option value="69 Rhône (Lyon / Villeurbanne)">69 Rhône (Lyon / Villeurbanne)</option>
                    <option value="31 Haute-Garonne (Toulouse)">31 Haute-Garonne (Toulouse)</option>
                    <option value="06 Alpes-Maritimes (Nice / Cannes)">06 Alpes-Maritimes (Nice / Cannes)</option>
                    <option value="33 Gironde (Bordeaux)">33 Gironde (Bordeaux)</option>
                    <option value="59 Nord (Lille / Dunkerque)">59 Nord (Lille / Dunkerque)</option>
                    <option value="44 Loire-Atlantique (Nantes)">44 Loire-Atlantique (Nantes)</option>
                    <option value="34 Hérault (Montpellier)">34 Hérault (Montpellier)</option>
                    <option value="67 Bas-Rhin (Strasbourg)">67 Bas-Rhin (Strasbourg)</option>
                    <option value="France (National)">France (National / Expédition)</option>
                  </optgroup>
                  <optgroup label="Tous les Départements de France">
                    {FRENCH_DEPARTMENTS.map((d) => (
                      <option key={d.code} value={`${d.code} ${d.name} (${d.region})`}>
                        {d.code} - {d.name} ({d.region})
                      </option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setSecteur(e.target.value);
                  }}
                  className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
                >
                  {getAllRegionsForCountry(country).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Ville Principale
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Paris, Madrid, Bruxelles, Genève, Berlin..."
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
              {getAllPopularCitiesForCountry(country).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {getAllPopularCitiesForCountry(country).slice(0, 10).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                        city === c
                          ? 'bg-pink-600/30 border-pink-500/50 text-pink-300 font-bold'
                          : 'bg-purple-950/60 border-purple-800/40 text-purple-300 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Secteur (Ex: 75 & IDF, Catalogne, Bruxelles Centre...)
              </label>
              <input
                type="text"
                value={secteur}
                onChange={(e) => setSecteur(e.target.value)}
                placeholder="Ex: 75 & IDF"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            {/* Mode(s) de service */}
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-purple-900/40">
              <label className="block text-xs font-bold text-slate-200">
                Modes de service disponibles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 bg-[#0a071c] border border-purple-800/50 rounded-xl cursor-pointer hover:border-purple-600 transition">
                  <input
                    type="checkbox"
                    checked={serviceModes.clickAndCollect}
                    onChange={(e) => setServiceModes({ ...serviceModes, clickAndCollect: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-500 bg-[#120e29] border-purple-700"
                  />
                  <span className="text-xs text-white font-medium">📍 Click & Collect</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-[#0a071c] border border-purple-800/50 rounded-xl cursor-pointer hover:border-purple-600 transition">
                  <input
                    type="checkbox"
                    checked={serviceModes.livraisonLocale}
                    onChange={(e) => setServiceModes({ ...serviceModes, livraisonLocale: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-500 bg-[#120e29] border-purple-700"
                  />
                  <span className="text-xs text-white font-medium">🚚 Livraison Locale</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-[#0a071c] border border-purple-800/50 rounded-xl cursor-pointer hover:border-purple-600 transition">
                  <input
                    type="checkbox"
                    checked={serviceModes.envoiPostal}
                    onChange={(e) => setServiceModes({ ...serviceModes, envoiPostal: e.target.checked })}
                    className="w-4 h-4 rounded text-pink-500 bg-[#120e29] border-purple-700"
                  />
                  <span className="text-xs text-white font-medium">✈️ Envoi Postal</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition"
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                Nombre de Votes (Score de classement)
              </label>
              <input
                type="number"
                min="0"
                value={votes}
                onChange={(e) => setVotes(parseInt(e.target.value) || 0)}
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-200 mb-1.5">
              Description / Prestations
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Présentation des strains, filtrations, terpènes, garanties et rapidité..."
              className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl p-3 text-xs text-white placeholder-purple-400/40 focus:outline-none transition resize-y"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0a071c] rounded-2xl border border-purple-800/50 hover:border-purple-600 transition">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-pink-500 bg-[#120e29] border-purple-700 focus:ring-pink-500"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Mettre cette boutique en Vedette (Top Farmz)
                </span>
                <span className="text-[11px] text-purple-300 block mt-0.5">
                  Mise en avant sur le podium et affichage prioritaire.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 2: Photos Storage Upload */}
        <div className="bg-[#120e29] border border-purple-800/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            2. Galerie & Logo Boutique (Firebase Storage)
          </h2>

          <PhotoUploader
            photos={photos}
            onChange={setPhotos}
            disabled={isSubmitting}
          />
        </div>

        {/* SECTION 3: Tags & Keywords */}
        <div className="bg-[#120e29] border border-purple-800/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            3. Tags & Spécialités
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Ajouter un tag (ex: Express 24h, Certifié, 2x Static)"
              className="flex-1 bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-[#1d1742] hover:bg-purple-900/60 text-purple-200 text-xs font-semibold rounded-xl border border-purple-800/50 transition"
            >
              + Ajouter
            </button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#0a071c] border border-purple-800 text-purple-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="p-0.5 text-purple-400 hover:text-rose-400 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Social & Links */}
        <div className="bg-[#120e29] border border-purple-800/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            4. Contact & Réseaux
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-400" />
                Lien ou Canal Telegram
              </label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="https://t.me/username ou username"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                Bot Telegram
              </label>
              <input
                type="text"
                value={telegramBot}
                onChange={(e) => setTelegramBot(e.target.value)}
                placeholder="@pseudo_bot ou lien"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username ou username"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <span>🥔</span>
                Potato
              </label>
              <input
                type="text"
                value={potato}
                onChange={(e) => setPotato(e.target.value)}
                placeholder="lien m.pt.im..."
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <span>👻</span>
                Snapchat
              </label>
              <input
                type="text"
                value={snapchat}
                onChange={(e) => setSnapchat(e.target.value)}
                placeholder="@pseudo ou lien"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-200 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Site Web
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://perkvibesfarmz.com"
                className="w-full bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-400/40 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: Dynamic Custom Fields */}
        <div className="bg-[#120e29] border border-purple-800/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              5. Informations Complémentaires (Garanties, Délais...)
            </h2>
            <button
              type="button"
              onClick={handleAddCustomField}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1d1742] hover:bg-purple-900/60 text-purple-200 text-xs font-semibold rounded-xl border border-purple-800/50 transition"
            >
              <Plus className="w-3.5 h-3.5 text-pink-400" />
              Ajouter
            </button>
          </div>

          {customFields.length === 0 ? (
            <p className="text-xs text-purple-400/60 italic">
              Aucun champ personnalisé (ex: Délai livraison, Note Trustpilot...).
            </p>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Libellé (ex: Temps de réponse)"
                    value={field.label}
                    onChange={(e) => handleUpdateCustomField(idx, 'label', e.target.value)}
                    className="w-1/3 bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Valeur (ex: < 10 minutes)"
                    value={field.value}
                    onChange={(e) => handleUpdateCustomField(idx, 'value', e.target.value)}
                    className="flex-1 bg-[#0a071c] border border-purple-800/60 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(idx)}
                    className="p-2 text-purple-400 hover:text-rose-400 rounded-lg hover:bg-purple-900/40 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/profiles"
            className="w-full sm:w-auto px-6 py-3 bg-[#1d1742] hover:bg-purple-900/50 text-purple-300 font-semibold text-xs rounded-2xl transition text-center"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-pink-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Enregistrer les Modifications' : 'Créer la Boutique (Brouillon)'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal for validation */}
      <ConfirmationModal
        isOpen={publishModalOpen}
        type="publish"
        itemName={name}
        onConfirm={handleManualPublish}
        onCancel={() => setPublishModalOpen(false)}
      />
    </div>
  );
};
