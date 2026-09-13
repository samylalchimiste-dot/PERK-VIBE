import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { Product, Category, BrandSettings } from '../../types';
import { 
  subscribeProducts, 
  subscribeCategories, 
  subscribeBrandSettings,
  DEFAULT_BRAND_SETTINGS 
} from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { ProductCard } from '../../components/public/ProductCard';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubBrand = subscribeBrandSettings(setBrand);
    const unsubCats = subscribeCategories(setCategories);
    const unsubProds = subscribeProducts((list) => {
      setProducts(list);
      setIsLoading(false);
    }, { publishedOnly: true });

    return () => {
      unsubBrand();
      unsubCats();
      unsubProds();
    };
  }, []);

  // Update selected category if url param changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleSelectCategory = (catId: string) => {
    hapticFeedback('light');
    playClickSound();
    setSelectedCategory(catId);
    if (catId === 'ALL') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: catId });
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
        return false;
      }
      // Only available filter
      if (onlyAvailable && p.stock === 'SOLD_OUT') {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesCat = p.categoryName?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, onlyAvailable, searchQuery]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-24 selection:bg-zinc-800 selection:text-white">
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 flex-1 w-full space-y-4">
        {/* Title & Stats */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-white">
              Menu & Extractions
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {filteredProducts.length} {filteredProducts.length > 1 ? 'variétés disponibles' : 'variété disponible'}
            </p>
          </div>

          <button
            onClick={() => {
              hapticFeedback('light');
              setOnlyAvailable(!onlyAvailable);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition border ${
              onlyAvailable
                ? 'bg-white text-zinc-950 font-bold border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {onlyAvailable ? '✓ En Stock' : 'Tout afficher'}
          </button>
        </div>

        {/* Minimal Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un strain, terpène, micron, batch..."
            className="w-full bg-[#111114] border border-zinc-800/90 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Category Pill Tabs (ALL + CATEGORIES) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 text-xs">
          <button
            onClick={() => handleSelectCategory('ALL')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap font-mono text-[11px] uppercase tracking-wider transition ${
              selectedCategory === 'ALL'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'bg-[#111114] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            TOUT
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap font-mono text-[11px] uppercase tracking-wider transition ${
                  isActive
                    ? 'bg-white text-zinc-950 font-bold shadow-md'
                    : 'bg-[#111114] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 pt-1">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-[#111114] rounded-3xl border border-zinc-800/80 p-6">
            <div className="w-12 h-12 rounded-full mx-auto bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Aucune pièce trouvée
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Aucun article ne correspond aux filtres sélectionnés.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
                setOnlyAvailable(false);
              }}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-700 transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
