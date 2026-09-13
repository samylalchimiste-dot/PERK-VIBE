import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Layers, Flame, RefreshCw, ShoppingBag } from 'lucide-react';
import { Product, Category, BrandSettings } from '../../types';
import { 
  subscribeProducts, 
  subscribeCategories, 
  subscribeBrandSettings, 
  resetAndSeedPerkVibesFarmz,
  seedCatalogIfEmpty,
  DEFAULT_BRAND_SETTINGS 
} from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { BrandHero } from '../../components/public/BrandHero';
import { ProductCard } from '../../components/public/ProductCard';
import { CategoryCard } from '../../components/public/CategoryCard';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auto seed & clean old clothes on mount for PERK VIBES FARMZ
  useEffect(() => {
    resetAndSeedPerkVibesFarmz(false).catch((err) => {
      console.warn('Initial PERK VIBES FARMZ catalog check:', err);
    });
  }, []);

  // Subscriptions
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

  // Featured Products
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.featured && p.status === 'published');
  }, [products]);

  // New Arrivals
  const newArrivals = useMemo(() => {
    return products
      .filter((p) => p.status === 'published' && p.isNew)
      .slice(0, 4);
  }, [products]);

  // Product count per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      if (p.status === 'published') {
        map[p.categoryId] = (map[p.categoryId] || 0) + 1;
      }
    }
    return map;
  }, [products]);

  const handleNavigateToShop = (catId?: string) => {
    hapticFeedback('medium');
    playClickSound();
    if (catId) {
      navigate(`/shop?category=${catId}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-24 selection:bg-zinc-800 selection:text-white">
      {/* Top Luxury Navbar */}
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 flex-1 w-full space-y-8">
        {/* 1. BRAND PROFILE & COVER HERO */}
        <BrandHero
          brand={brand}
          onExploreClick={() => handleNavigateToShop()}
        />

        {/* 2. FEATURED SHOWCASE */}
        {featuredProducts.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <h2 className="font-extrabold text-sm uppercase tracking-widest text-white">
                  Sélection Exclusive
                </h2>
              </div>
              <button
                onClick={() => handleNavigateToShop()}
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1 group"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Featured Grid (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  featuredStyle
                />
              ))}
            </div>
          </section>
        )}

        {/* 3. COLLECTIONS / CATEGORIES SHOWCASE */}
        {categories.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-300" />
                <h2 className="font-extrabold text-sm uppercase tracking-widest text-white">
                  Collections & Univers
                </h2>
              </div>
              <button
                onClick={() => {
                  hapticFeedback('light');
                  navigate('/collections');
                }}
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1 group"
              >
                <span>Explorer</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  count={categoryCounts[cat.id] || 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* 4. NEW ARRIVALS */}
        {newArrivals.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-zinc-300" />
                <h2 className="font-extrabold text-sm uppercase tracking-widest text-white">
                  Nouveautés Récentes
                </h2>
              </div>
              <button
                onClick={() => handleNavigateToShop()}
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1 group"
              >
                <span>Catalogue</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. PERK VIBES FARMZ FOOTER NOTE */}
        <section className="p-6 rounded-3xl bg-[#111114] border border-zinc-800/80 text-center space-y-3">
          <div className="w-10 h-10 rounded-full mx-auto bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              {brand.brandName || 'PERK VIBES FARMZ'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Chaque batch est méticuleusement curé et expédié dans un conditionnement hermétique sous vide. Commandes traitées en direct via notre messagerie Telegram sécurisée.
            </p>
          </div>

          <button
            onClick={() => handleNavigateToShop()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold tracking-wider uppercase border border-zinc-700/80 transition"
          >
            <span>Consulter l'ensemble du menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
