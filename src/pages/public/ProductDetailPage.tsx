import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Share2, 
  Check, 
  Package, 
  Info, 
  Clock, 
  MessageCircle, 
  Lock,
  Video,
  Play
} from 'lucide-react';
import { Product, BrandSettings } from '../../types';
import { getProduct, subscribeBrandSettings, DEFAULT_BRAND_SETTINGS, subscribeProducts } from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { ProductCard } from '../../components/public/ProductCard';
import { hapticFeedback, setupTelegramBackButton } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [activeMedia, setActiveMedia] = useState<'photo' | 'video'>('photo');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details');

  // Touch swipe support on main gallery
  const touchStartX = useRef<number | null>(null);

  // Setup Telegram back button
  useEffect(() => {
    const cleanup = setupTelegramBackButton(() => {
      hapticFeedback('light');
      playClickSound();
      navigate(-1);
    });
    return cleanup;
  }, [navigate]);

  useEffect(() => {
    const unsubBrand = subscribeBrandSettings(setBrand);
    return () => unsubBrand();
  }, []);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setSelectedPhotoIndex(0);

    getProduct(id).then((p) => {
      setProduct(p);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error fetching product:', err);
      setIsLoading(false);
    });
  }, [id]);

  // Load related products
  useEffect(() => {
    if (!product) return;
    const unsub = subscribeProducts((prods) => {
      const related = prods
        .filter((p) => p.id !== product.id && p.status === 'published' && p.categoryId === product.categoryId)
        .slice(0, 4);
      setRelatedProducts(related);
    }, { publishedOnly: true });

    return () => unsub();
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-white animate-spin mb-3" />
        <span className="text-xs font-mono text-zinc-400">Chargement de la pièce...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-24">
        <Header showBack onBack={() => navigate('/shop')} />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Pièce introuvable
          </h2>
          <p className="text-xs text-zinc-400">
            Ce produit n'existe pas ou a été archivé.
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition hover:bg-zinc-200"
          >
            Retourner au catalogue
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const isSoldOut = product.stock === 'SOLD_OUT';
  const isLowStock = product.stock === 'LOW_STOCK';
  const photos = product.images && product.images.length > 0 ? product.images : [product.mainImage];
  const currentPhoto = photos[selectedPhotoIndex] || photos[0];

  const handlePrevPhoto = () => {
    hapticFeedback('light');
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = () => {
    hapticFeedback('light');
    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNextPhoto();
      } else {
        handlePrevPhoto();
      }
    }
    touchStartX.current = null;
  };

  const handleShare = async () => {
    hapticFeedback('light');
    playClickSound();
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — ${brand.brandName || 'TRICHOME MONTANE'}`,
          text: `Découvrez ${product.name} sur le menu officiel ${brand.brandName || 'TRICHOME MONTANE'}`,
          url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Direct Telegram Bot Order Handler
  const handleOrderTelegram = () => {
    if (isSoldOut) return;
    hapticFeedback('medium');
    playClickSound();

    const botUsername = brand.contactLinks?.botUsername || 'F2nOfficiel_Bot';
    const cleanUsername = botUsername.replace(/^@/, '');
    const refCode = product.sku || product.id.slice(0, 8);
    const message = encodeURIComponent(
      `Bonjour Trichome Montane, je souhaite commander :\n\n• Produit : ${product.name}\n• Référence : ${refCode}\n• Prix : ${product.price} ${product.currency || '€'}\n\nEst-il toujours disponible pour envoi / livraison ?`
    );

    // Deep link directly into Telegram
    const telegramUrl = `https://t.me/${cleanUsername}?text=${message}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  // WhatsApp order secondary handler if configured
  const handleOrderWhatsApp = () => {
    if (isSoldOut || !brand.contactLinks?.whatsapp) return;
    hapticFeedback('light');
    const cleanPhone = brand.contactLinks.whatsapp.replace(/[^0-9]/g, '');
    const refCode = product.sku || product.id.slice(0, 8);
    const message = encodeURIComponent(
      `Bonjour Trichome Montane, je souhaite commander : ${product.name} (Réf : ${refCode}) au prix de ${product.price} ${product.currency || '€'}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-28 selection:bg-zinc-800 selection:text-white">
      <Header showBack onBack={() => navigate(-1)} title={product.name} />

      <main className="max-w-md mx-auto px-4 pt-3 flex-1 w-full space-y-5">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              hapticFeedback('light');
              navigate('/shop');
            }}
            className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Menu TRICHOME MONTANE</span>
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition flex items-center gap-1 text-[11px] font-mono"
            title="Partager"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Lien copié' : 'Partager'}</span>
          </button>
        </div>

        {/* 1. HERO PHOTO / VIDEO GALLERY */}
        <div className="space-y-3">
          {activeMedia === 'video' && product.videoUrl ? (
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-black border border-zinc-800/90 shadow-2xl flex items-center justify-center group">
              <video
                src={product.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />

              {/* Badges Top Left */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-black/80 text-emerald-400 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  Vidéo Officielle Batch
                </span>
              </div>

              {/* Switch back to photo button */}
              <button
                onClick={() => {
                  hapticFeedback('light');
                  setActiveMedia('photo');
                }}
                className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white text-xs font-mono uppercase tracking-wider border border-zinc-700 backdrop-blur-md transition active:scale-95"
              >
                ← Voir photos
              </button>
            </div>
          ) : (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shadow-2xl group select-none"
            >
              <img
                src={currentPhoto}
                alt={product.name}
                className={`w-full h-full object-cover object-center transition-all duration-500 ${
                  isSoldOut ? 'opacity-60 grayscale' : 'opacity-100'
                }`}
              />

              {/* Subtle Gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

              {/* Badges Top Left */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-1.5 z-10">
                {isSoldOut ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-black/80 text-zinc-400 border border-zinc-700 backdrop-blur-md">
                    SOLD OUT · ÉPUISÉ
                  </span>
                ) : isLowStock ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/50 backdrop-blur-md">
                    Stock Limité
                  </span>
                ) : product.isNew ? (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white text-zinc-950 shadow-md">
                    Nouveau
                  </span>
                ) : null}

                {product.featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-black/70 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Top Shelf
                  </span>
                )}
              </div>

              {/* Direct Video Trigger Button if Video available */}
              {product.videoUrl && (
                <button
                  onClick={() => {
                    hapticFeedback('medium');
                    playClickSound();
                    setActiveMedia('video');
                  }}
                  className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-xl transition active:scale-95 animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Vidéo Batch</span>
                </button>
              )}

              {/* Arrows for Desktop / Tablet */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition active:scale-90"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition active:scale-90"
                    aria-label="Photo suivante"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Photo Counter Pill Bottom Right */}
              {photos.length > 1 && (
                <div className="absolute bottom-4 right-4 z-10">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono tracking-widest text-zinc-300 bg-black/70 backdrop-blur-md border border-zinc-700/70">
                    {selectedPhotoIndex + 1} / {photos.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Miniatures Thumbnails Bar with Video option */}
          {(photos.length > 1 || product.videoUrl) && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    hapticFeedback('light');
                    setActiveMedia('photo');
                    setSelectedPhotoIndex(idx);
                  }}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border transition-all ${
                    activeMedia === 'photo' && selectedPhotoIndex === idx
                      ? 'border-white ring-2 ring-white/30 scale-105'
                      : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}

              {/* Video Thumbnail Tile */}
              {product.videoUrl && (
                <button
                  onClick={() => {
                    hapticFeedback('medium');
                    playClickSound();
                    setActiveMedia('video');
                  }}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border transition-all flex flex-col items-center justify-center bg-zinc-900 ${
                    activeMedia === 'video'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105 text-emerald-400 bg-emerald-950/30'
                      : 'border-zinc-800 text-zinc-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Play className="w-5 h-5 mb-0.5 fill-current" />
                  <span className="text-[9px] font-mono uppercase font-bold">Vidéo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. PRODUCT MAIN INFO */}
        <div className="p-5 rounded-3xl bg-[#111114] border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="uppercase tracking-widest">
              {product.categoryName || 'TRICHOME MONTANE'}
            </span>
            {product.sku && (
              <span className="text-zinc-500">RÉF : {product.sku}</span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase leading-snug">
            {product.name}
          </h1>

          {/* Price & Stock status */}
          <div className="flex items-baseline justify-between pt-1 border-t border-zinc-800/80">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono tracking-tight">
                {product.price}
              </span>
              <span className="text-sm font-mono text-zinc-400">
                {product.currency || '€'}
              </span>
            </div>

            {/* Stock indicator badge */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSoldOut
                    ? 'bg-zinc-600'
                    : isLowStock
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span
                className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                  isSoldOut
                    ? 'text-zinc-500'
                    : isLowStock
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {isSoldOut ? 'SOLD OUT' : isLowStock ? 'Stock Faible' : 'En Stock'}
              </span>
            </div>
          </div>

          {/* Short description */}
          {product.description && (
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-2 font-normal">
              {product.description}
            </p>
          )}
        </div>

        {/* 3. ORDER / CONTACT ACTION BAR */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-zinc-700/80 space-y-3 shadow-xl">
          {isSoldOut ? (
            <div className="text-center py-2 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Pièce actuellement indisponible</span>
              </div>
              <button
                disabled
                className="w-full py-3.5 px-6 rounded-2xl bg-zinc-800/50 text-zinc-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-zinc-700/30"
              >
                SOLD OUT — ÉPUISÉ
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Primary Telegram Order Button */}
              <button
                onClick={handleOrderTelegram}
                className="w-full group py-4 px-6 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2.5"
              >
                <Send className="w-4 h-4 text-zinc-950 group-hover:translate-x-0.5 transition-transform" />
                <span>Commander via Telegram</span>
              </button>

              {/* Secondary WhatsApp contact if available */}
              {brand.contactLinks?.whatsapp && (
                <button
                  onClick={handleOrderWhatsApp}
                  className="w-full py-3 px-6 rounded-2xl bg-[#1a1a20] hover:bg-[#22222a] text-zinc-200 hover:text-white font-semibold text-xs tracking-wider uppercase border border-zinc-700 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Contacter sur WhatsApp</span>
                </button>
              )}

              <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-zinc-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Commande directe vérifiée</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Livraison sécurisée</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 4. PRODUCT DETAILS TABS */}
        <div className="rounded-3xl bg-[#111114] border border-zinc-800/80 overflow-hidden">
          <div className="flex border-b border-zinc-800/80 text-xs font-mono">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-center transition ${
                activeTab === 'details'
                  ? 'bg-zinc-800/60 text-white font-bold border-b-2 border-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Caractéristiques
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex-1 py-3 text-center transition ${
                activeTab === 'shipping'
                  ? 'bg-zinc-800/60 text-white font-bold border-b-2 border-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Expédition
            </button>
            <button
              onClick={() => setActiveTab('care')}
              className={`flex-1 py-3 text-center transition ${
                activeTab === 'care'
                  ? 'bg-zinc-800/60 text-white font-bold border-b-2 border-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Conservation
            </button>
          </div>

          <div className="p-5 text-xs text-zinc-300 leading-relaxed">
            {activeTab === 'details' && (
              <div className="space-y-2">
                {product.details && Object.keys(product.details).length > 0 ? (
                  Object.entries(product.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1.5 border-b border-zinc-800/60 last:border-b-0">
                      <span className="text-zinc-500 font-mono">{key}</span>
                      <span className="text-zinc-200 font-medium text-right">{value}</span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-1.5">
                    <p>• Extraction premium 100% têtes de trichomes pures.</p>
                    <p>• Tamisage et affinage sous contrôle strict {brand.brandName || 'TRICHOME MONTANE'}.</p>
                    <p>• Batch numéroté certifié sans matière végétale.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-2">
                <p>• **Traitement express** : Votre sélection est préparée immédiatement dès validation sur Telegram.</p>
                <p>• **Conditionnement sous vide & isotherme** : Pots en verre scellés sous vide, enveloppe thermique avec sachet de régulation pour protéger 100% des terpènes.</p>
                <p>• **Discrétion totale** : Colis rigide anonyme sans odeur ni mention extérieure.</p>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="space-y-2">
                <p>• **Température idéale** : Conserver entre 4°C et 8°C (bac à légumes ou cave à vin) pour figer les terpènes volatils.</p>
                <p>• **Condensation** : Laisser le pot revenir à température ambiante 10-15 minutes avant ouverture pour éviter la condensation d'humidité.</p>
                <p>• **Protection UV** : Conserver à l'abri complet de la lumière directe et refermer hermétiquement après chaque utilisation.</p>
              </div>
            )}
          </div>
        </div>

        {/* 5. RELATED PRODUCTS ("VOUS AIMEREZ AUSSI") */}
        {relatedProducts.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-white">
              Dans la même collection
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
