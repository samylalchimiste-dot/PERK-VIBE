import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Send, 
  ShieldCheck, 
  Share2, 
  Check, 
  Minus,
  Plus,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Product, BrandSettings, ProductPricingTier } from '../../types';
import { getProduct, subscribeBrandSettings, DEFAULT_BRAND_SETTINGS, subscribeProducts } from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { VideoPlayerOverlay } from '../../components/common/VideoPlayerOverlay';
import { hapticFeedback, setupTelegramBackButton } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  
  // Media mode: default to 'video' if videoUrl exists, else 'photo'
  const [activeMedia, setActiveMedia] = useState<'video' | 'photo'>('video');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Quantity selector & Tiers state (Screenshots 1 & 2)
  const [selectedTier, setSelectedTier] = useState<ProductPricingTier | null>(null);
  const [cartQuantity, setCartQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

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
    setCartQuantity(1);

    getProduct(id).then((p) => {
      setProduct(p);
      if (p) {
        // As requested by user: once entering the product, the video is launched directly first
        if (p.videoUrl) {
          setActiveMedia('video');
        } else {
          setActiveMedia('photo');
        }

        // Initialize default pricing tier
        const tiers = computePricingTiers(p);
        if (tiers.length > 0) {
          setSelectedTier(tiers[0]);
        }
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Error fetching product:', err);
      setIsLoading(false);
    });
  }, [id]);

  // Load related products ("VOUS AIMEREZ AUSSI")
  useEffect(() => {
    if (!product) return;
    const unsub = subscribeProducts((prods) => {
      const related = prods
        .filter((p) => p.id !== product.id && p.status === 'published' && p.categoryId === product.categoryId)
        .slice(0, 6);
      setRelatedProducts(related);
    }, { publishedOnly: true });

    return () => unsub();
  }, [product]);

  // Helper to get or compute pricing tiers: [5g, 10g, 25g, 50g, 100g]
  // Calculates automatically based on price per gram (ex: 3€/g => 5g=15€, 10g=30€, 25g=75€, 50g=150€, 100g=300€)
  const computePricingTiers = (p: Product): ProductPricingTier[] => {
    if (p.pricingTiers && p.pricingTiers.length > 0) {
      return p.pricingTiers;
    }
    // Price per gram (default: 3€/g if not specified or set to 3)
    const pricePerGram = Number(p.price) > 0 ? Number(p.price) : 3;
    return [
      { weight: '5g', price: pricePerGram * 5 },
      { weight: '10g', price: pricePerGram * 10 },
      { weight: '25g', price: pricePerGram * 25 },
      { weight: '50g', price: pricePerGram * 50 },
      { weight: '100g', price: pricePerGram * 100 },
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060b13] text-zinc-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin mb-3" />
        <span className="text-xs font-mono text-cyan-300">Chargement de la pièce...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#060b13] text-zinc-100 flex flex-col pb-24">
        <Header showBack onBack={() => navigate(-1)} />
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Pièce introuvable
          </h2>
          <p className="text-xs text-zinc-400">
            Ce produit n'existe pas ou a été archivé.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs uppercase tracking-wider transition hover:bg-cyan-400"
          >
            Retourner au catalogue
          </button>
        </div>
      </div>
    );
  }

  const isSoldOut = product.stock === 'SOLD_OUT';
  const photos = product.images && product.images.length > 0 ? product.images : (product.mainImage ? [product.mainImage] : []);
  const currentPhoto = photos[selectedPhotoIndex] || product.mainImage || '';
  const tiers = computePricingTiers(product);
  const activeTier = selectedTier || tiers[0];
  const unitPrice = activeTier ? activeTier.price : (product.price || 0);
  const totalPrice = unitPrice * cartQuantity;
  const availableCount = product.availableUnits || 25;

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
        // Fallback
      }
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Add to Cart handler matching bottom bar "Ajouter au panier"
  const handleAddToCart = () => {
    hapticFeedback('medium');
    playClickSound();

    try {
      const saved = localStorage.getItem('pvf_cart');
      let cart = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(cart)) cart = [];

      const cartItemKey = `${product.id}_${activeTier?.weight || 'default'}`;
      const existingIdx = cart.findIndex((it: any) => it.cartKey === cartItemKey || (it.product?.id === product.id && it.selectedWeight === activeTier?.weight));

      if (existingIdx >= 0) {
        cart[existingIdx].quantity += cartQuantity;
      } else {
        cart.push({
          cartKey: cartItemKey,
          product: {
            ...product,
            price: unitPrice,
          },
          selectedWeight: activeTier?.weight || '5g',
          quantity: cartQuantity,
        });
      }

      localStorage.setItem('pvf_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));

      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2000);
    } catch (e) {
      console.error('Failed to add to cart:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-zinc-100 flex flex-col pb-28 selection:bg-cyan-900/60 selection:text-cyan-200">
      {/* Top Header with Back button and Title */}
      <Header showBack onBack={() => navigate(-1)} title={product.name} />

      <main className="max-w-md mx-auto px-3.5 pt-2 flex-1 w-full space-y-4">
        {/* Navigation Breadcrumb Bar & Share Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              hapticFeedback('light');
              playClickSound();
              navigate(-1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c1422] border border-cyan-500/25 text-xs font-semibold text-cyan-300 hover:text-white transition active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Retour</span>
          </button>

          <button
            onClick={handleShare}
            className="p-1.5 px-3 rounded-full bg-[#0c1422] hover:bg-[#121c30] text-cyan-300 hover:text-white border border-cyan-500/25 transition flex items-center gap-1 text-[11px] font-mono shadow-sm active:scale-95"
            title="Partager"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Lien copié' : 'Partager'}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 1. MEDIA SECTION: VIDEO LAUNCHED IN FIRST DIRECT (OR PHOTO FALLBACK)       */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          {product.videoUrl && activeMedia === 'video' ? (
            <VideoPlayerOverlay
              videoUrl={product.videoUrl}
              poster={currentPhoto}
              hasPhotos={photos.length > 0}
              onSwitchToPhotos={() => {
                setActiveMedia('photo');
              }}
            />
          ) : (
            <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#050911] border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] select-none">
              <img
                src={currentPhoto}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />

              {/* Badges Top Left */}
              <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-[#091522]/90 text-cyan-300 border border-cyan-400/40 backdrop-blur-md shadow-md">
                  Photo
                </span>
                {product.videoUrl && (
                  <button
                    onClick={() => {
                      hapticFeedback('light');
                      playClickSound();
                      setActiveMedia('video');
                    }}
                    className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-black/70 hover:bg-black/90 text-cyan-400 border border-cyan-500/40 backdrop-blur-md shadow-md flex items-center gap-1 transition active:scale-95"
                  >
                    <span>▶ Voir la vidéo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Photo Thumbnails if multiple exist and user switched to photo mode */}
          {activeMedia === 'photo' && photos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    hapticFeedback('light');
                    setSelectedPhotoIndex(idx);
                  }}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border transition-all ${
                    selectedPhotoIndex === idx
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. PRODUCT HEADER CARD: NAME & STOCK DISPONIBLE (Screenshot 1)           */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-[#09101d] border border-cyan-500/25 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              <span>{product.name}</span>
              <span className="text-base select-none">🍬🍇</span>
            </h1>
          </div>

          {/* In Stock Badge: "✅ En stock (25 dispo)" exactly as in Screenshot 1 */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#062419] border border-emerald-500/40 text-emerald-300">
              <span>✅</span>
              <span>
                {isSoldOut
                  ? 'Épuisé (0 dispo)'
                  : `En stock (${availableCount} dispo)`}
              </span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESCRIPTION CARD (Screenshot 1)                                       */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-[#09101d] border border-cyan-500/25 space-y-2 shadow-md">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>DESCRIPTION</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
            {product.description && product.description.trim() !== ''
              ? product.description
              : 'Aucune description.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 4. SÉLECTIONNEZ UNE QUANTITÉ (Screenshot 1: 5g, 10g, 25g, 50g, 100g)      */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-[#09101d] border border-cyan-500/25 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>SÉLECTIONNEZ UNE QUANTITÉ</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
              {Number(product.price) > 0 ? Number(product.price) : 3}€ / g
            </span>
          </div>

          {/* Grid of pricing options */}
          <div className="grid grid-cols-3 gap-2.5">
            {tiers.map((tier, idx) => {
              const isSelected = activeTier?.weight === tier.weight;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    hapticFeedback('medium');
                    playClickSound();
                    setSelectedTier(tier);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all duration-150 active:scale-95 flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-[#082236] border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-[#070c17] border-cyan-900/50 hover:border-cyan-700/60 text-zinc-300'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-200' : 'text-zinc-200'}`}>
                    {tier.weight}
                  </span>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-cyan-400' : 'text-cyan-500'}`}>
                    {tier.price}.00€
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. "VOUS AIMEREZ AUSSI" RELATED PRODUCTS (Screenshot 1)                   */}
        {/* ========================================================================= */}
        {relatedProducts.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#09101d] border border-cyan-500/25 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>VOUS AIMEREZ AUSSI</span>
            </div>

            {/* Horizontal or 3-column scroll matching Screenshot 1 */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {relatedProducts.map((rel) => {
                const relImage = rel.mainImage || rel.images?.[0] || '';
                return (
                  <div
                    key={rel.id}
                    onClick={() => {
                      hapticFeedback('light');
                      playClickSound();
                      navigate(`/product/${rel.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex flex-col rounded-xl overflow-hidden bg-[#070c17] border border-cyan-900/40 p-2 cursor-pointer hover:border-cyan-500/50 transition active:scale-95"
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-black/60 mb-1.5 flex items-center justify-center">
                      {relImage ? (
                        <img src={relImage} alt={rel.name} className="w-full h-full object-cover" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-cyan-500/40" />
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-white truncate leading-tight">
                      {rel.name}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      {rel.price}€/g
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 6. FIXED BOTTOM ACTION BAR: [- 1 +] & "Ajouter au panier" (Screenshots 1 & 2) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#070d18]/95 backdrop-blur-xl border-t border-cyan-500/25 px-4 py-3 shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {/* Quantity Stepper: [ -   1   + ] */}
          <div className="flex items-center justify-between bg-[#081525] border border-cyan-500/30 rounded-2xl px-3 py-2.5 w-32 shadow-inner">
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setCartQuantity((prev) => Math.max(1, prev - 1));
              }}
              className="text-cyan-400 hover:text-white p-1 transition active:scale-90"
              aria-label="Diminuer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white font-bold font-mono text-sm px-2">
              {cartQuantity}
            </span>
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light');
                setCartQuantity((prev) => prev + 1);
              }}
              className="text-cyan-400 hover:text-white p-1 transition active:scale-90"
              aria-label="Augmenter"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Big Blue "Ajouter au panier" Pill Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0ea5e9] text-white font-bold text-sm shadow-[0_4px_20px_rgba(14,165,233,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {addedToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Ajouté ({totalPrice}€) !</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-white" />
                <span>Ajouter au panier</span>
                {totalPrice > 0 && (
                  <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">
                    {totalPrice}€
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
