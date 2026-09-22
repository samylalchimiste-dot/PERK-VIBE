import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingBag, PlusCircle, Sparkles } from 'lucide-react';
import { Product, Category, BrandSettings } from '../../types';
import { 
  subscribeProducts, 
  subscribeCategories, 
  subscribeBrandSettings, 
  ensureCanonicalCategories,
  DEFAULT_BRAND_SETTINGS 
} from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { BrandCrestLogo } from '../../components/common/BrandCrestLogo';
import { ProductCard } from '../../components/public/ProductCard';
import { CategoryFilterBar } from '../../components/public/CategoryFilterBar';
import { getTelegramUser, hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const catalogSectionRef = useRef<HTMLDivElement>(null);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFarm, setSelectedFarm] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Retrieve Telegram user info or default to 'Yory' as seen in Screenshot 1
  const tgUser = useMemo(() => {
    const u = getTelegramUser();
    return {
      name: u?.first_name || u?.username || 'Yory',
      initial: (u?.first_name?.[0] || u?.username?.[0] || 'Y').toUpperCase(),
    };
  }, []);

  // Ensure canonical categories (2X STATIC, WPFF, DRY SIFT, FROZEN SIFT) exist
  useEffect(() => {
    ensureCanonicalCategories().catch((err) => {
      console.warn('Category init warning:', err);
    });
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const unsubBrand = subscribeBrandSettings(setBrand);
    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods);
      setIsLoading(false);
    }, { publishedOnly: true });
    const unsubCategories = subscribeCategories(setCategories);

    return () => {
      unsubBrand();
      unsubProducts();
      unsubCategories();
    };
  }, []);

  // Filter products by selected category and farm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const pCat = (p.categoryName || '').toLowerCase().trim();
        const sel = selectedCategory.toLowerCase().trim();
        const matchId = p.categoryId === selectedCategory;
        const matchName = pCat === sel || pCat.includes(sel) || sel.includes(pCat);
        if (!matchId && !matchName) return false;
      }

      // Farm filter
      if (selectedFarm !== 'ALL') {
        const origin = (p.details?.['Origine'] || '').toLowerCase();
        if (!origin.includes(selectedFarm.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, selectedFarm]);

  const handleScrollToCatalog = () => {
    hapticFeedback('medium');
    playClickSound();
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 flex flex-col pb-28 selection:bg-amber-900/60 selection:text-amber-200">
      {/* 1. TOP HEADER (Matching Screenshot 1) */}
      <Header />

      <main className="max-w-md mx-auto px-3.5 pt-2 flex-1 w-full space-y-4">
        {/* ========================================================================= */}
        {/* 2. HERO SECTION — EXACT VISUAL IDENTITY OF SCREENSHOT 1                   */}
        {/* ========================================================================= */}
        <section className="relative pt-2 pb-4 flex flex-col items-center text-center overflow-hidden">
          {/* Cybernetic Tech Halo Background Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none opacity-40">
            <div className="w-full h-full rounded-full border border-amber-500/20 animate-[spin_40s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full border border-dashed border-amber-400/25 animate-[spin_25s_linear_infinite_reverse]" />
            <div className="absolute inset-16 rounded-full border border-amber-500/30" />
            <div className="absolute inset-0 bg-radial-gradient from-amber-500/15 via-transparent to-transparent blur-2xl" />
          </div>

          {/* Centered Brand Crest Logo (Robot helmet / Connoisseur shield in golden rings) */}
          <div className="relative z-10 mb-2">
            {brand.profileImage ? (
              <div className="w-24 h-24 rounded-full p-1 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.4)] overflow-hidden bg-zinc-950">
                <img
                  src={brand.profileImage}
                  alt={brand.brandName || 'Cartel Del Farmez'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <BrandCrestLogo size="xl" showGlow={true} />
            )}
          </div>

          {/* Gold Script / Cursive Serif Accent: "PETITE SÉRIE" */}
          <div 
            className="text-amber-400 font-serif italic text-base sm:text-lg tracking-wider mt-3 z-10 drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            PETITE SÉRIE
          </div>

          {/* Giant Stencil / Block Typography: CARTEL / DEL / FARMEZ */}
          <div 
            className="font-black text-4xl sm:text-5xl uppercase tracking-wider text-white leading-[0.92] my-2 select-none z-10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Bebas Neue', 'Montserrat', sans-serif" }}
          >
            <div className="tracking-[0.1em] text-zinc-100">CARTEL</div>
            <div className="tracking-[0.1em] text-white">DEL</div>
            <div className="tracking-[0.14em] text-amber-400">FARMEZ</div>
          </div>

          {/* Subtitle: COLLECTION PREMIUM */}
          <div className="text-[10px] sm:text-[11px] tracking-[0.35em] font-extrabold uppercase text-zinc-300 z-10 select-none pt-1">
            COLLECTION PREMIUM
          </div>

          {/* High-Contrast Amber Action Button: EXPLORER ↗ */}
          <button
            type="button"
            onClick={handleScrollToCatalog}
            className="mt-6 px-9 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(251,191,36,0.6)] hover:shadow-[0_0_35px_rgba(251,191,36,0.8)] flex items-center justify-center gap-2 transition active:scale-95 z-10 cursor-pointer"
          >
            <span>EXPLORER</span>
            <span className="text-sm font-black">↗</span>
          </button>

          {/* Scroll Down Prompt: ⌄ DÉFILER */}
          <button
            type="button"
            onClick={handleScrollToCatalog}
            className="flex flex-col items-center justify-center gap-0.5 text-zinc-500 hover:text-zinc-300 text-[9px] font-bold tracking-[0.25em] uppercase mt-4 transition cursor-pointer z-10"
          >
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 animate-bounce" />
            <span>DÉFILER</span>
          </button>

          {/* User Welcome Floating Capsule Card (Matching Screenshot 1) */}
          <div className="w-full rounded-2xl bg-[#090d16]/90 border border-amber-500/35 p-3.5 flex items-center gap-3 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.7)] mt-6 text-left z-10">
            {/* User Initial Badge in Gold Circle */}
            <div className="w-11 h-11 rounded-full border-2 border-amber-400/90 bg-amber-500/10 flex items-center justify-center text-amber-400 font-black text-base shadow-[0_0_12px_rgba(251,191,36,0.35)] shrink-0">
              {tgUser.initial}
            </div>
            <div className="flex flex-col truncate">
              <div className="text-[10px] font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>BIENVENUE</span>
              </div>
              <div className="text-base font-black text-white tracking-wide truncate">
                {tgUser.name}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. MENU & CATALOGUE SECTION                                              */}
        {/* ========================================================================= */}
        <div ref={catalogSectionRef} id="catalogue" className="pt-2 space-y-4">
          {/* Section Indicator & Dynamic Product Count */}
          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#090d16] border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>{products.length} {products.length <= 1 ? 'produit' : 'produits'}</span>
            </div>

            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setSelectedCategory('ALL');
                }}
                className="text-[11px] text-zinc-400 hover:text-amber-300 transition underline underline-offset-2"
              >
                Afficher tout
              </button>
            )}
          </div>

          {/* Categories Horizontal Filter Bar & Dropdown Selectors */}
          <CategoryFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedFarm={selectedFarm}
            onSelectFarm={setSelectedFarm}
            productCount={products.length}
          />

          {/* 2-Column Product Grid */}
          <section className="pt-1">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-2xl bg-[#0a0f1b] border border-zinc-800/80 aspect-[3/4] p-3 space-y-2">
                    <div className="w-full aspect-square bg-zinc-800/60 rounded-xl" />
                    <div className="h-3 bg-zinc-800/60 rounded-md w-3/4" />
                    <div className="h-4 bg-zinc-800/60 rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              /* Clean Empty State — No mock products */
              <div className="rounded-2xl bg-[#090d16] border border-amber-500/25 p-6 text-center space-y-3.5 my-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-zinc-100">
                    {selectedCategory !== 'ALL' || selectedFarm !== 'ALL'
                      ? 'Aucun produit dans cette sélection'
                      : 'Catalogue Cartel Del Farmez vide (0 produit)'}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    {selectedCategory !== 'ALL' || selectedFarm !== 'ALL'
                      ? 'Changez de catégorie ou réinitialisez le filtre.'
                      : 'Tous les produits de test ont été définitivement retirés. Vous pouvez ajouter vos véritables extractions depuis le panneau Admin.'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  {selectedCategory !== 'ALL' || selectedFarm !== 'ALL' ? (
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setSelectedCategory('ALL');
                        setSelectedFarm('ALL');
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition"
                    >
                      Réinitialiser les filtres
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        playClickSound();
                        navigate('/admin/products');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black transition shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Ajouter un produit réel (Admin)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 4. BOTTOM NAVIGATION (7 Tabs matching Screenshot 1 & 2) */}
      <BottomNav />
    </div>
  );
};
