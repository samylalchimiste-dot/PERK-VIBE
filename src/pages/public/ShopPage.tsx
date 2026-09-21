import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, ShoppingBag } from 'lucide-react';
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
import { CategoryFilterBar } from '../../components/public/CategoryFilterBar';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedFarm, setSelectedFarm] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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
  }, [products, selectedCategory, selectedFarm, searchQuery]);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col pb-24 selection:bg-cyan-900 selection:text-white">
      <Header title="Catalogue" />

      <main className="max-w-md mx-auto px-3.5 pt-3 flex-1 w-full space-y-4">
        {/* Dynamic Counter */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0c1424] border border-cyan-900/60 text-cyan-300 text-xs font-semibold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{filteredProducts.length} {filteredProducts.length <= 1 ? 'produit' : 'produits'}</span>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-slate-400 hover:text-cyan-300 transition"
            >
              Effacer la recherche
            </button>
          )}
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit, variété, batch..."
            className="w-full bg-[#0c1322] border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Bar */}
        <CategoryFilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          selectedFarm={selectedFarm}
          onSelectFarm={setSelectedFarm}
          productCount={filteredProducts.length}
        />

        {/* Product Grid (2 columns) */}
        <section className="pt-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl bg-[#0c121e] border border-slate-800/80 aspect-[3/4] p-3 space-y-2">
                  <div className="w-full aspect-square bg-slate-800/60 rounded-xl" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-800/60 rounded-md w-1/2" />
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
            <div className="rounded-2xl bg-[#0c1322] border border-slate-800/80 p-8 text-center space-y-3 my-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0e192c] border border-cyan-900/60 flex items-center justify-center mx-auto text-cyan-400">
                <ShoppingBag className="w-6 h-6 stroke-[1.6]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-100">Aucun produit trouvé</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Modifiez vos filtres de recherche ou réinitialisez la catégorie.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedFarm('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};
