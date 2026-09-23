import React, { useState, useEffect } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { Category, Product, BrandSettings } from '../../types';
import { 
  subscribeCategories, 
  subscribeProducts, 
  subscribeBrandSettings,
  DEFAULT_BRAND_SETTINGS 
} from '../../services/firebase/catalog';
import { Header } from '../../components/common/Header';
import { BottomNav } from '../../components/common/BottomNav';
import { CategoryCard } from '../../components/public/CategoryCard';

export const CollectionsPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);

  useEffect(() => {
    const unsubCats = subscribeCategories(setCategories);
    const unsubProds = subscribeProducts(setProducts, { publishedOnly: true });
    const unsubBrand = subscribeBrandSettings(setBrand);

    return () => {
      unsubCats();
      unsubProds();
      unsubBrand();
    };
  }, []);

  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    }
    return map;
  }, [products]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-24 selection:bg-zinc-800 selection:text-white">
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 flex-1 w-full space-y-5">
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px] uppercase tracking-widest mb-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{brand.brandName || 'TRICOME LAB'}</span>
          </div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white">
            Gammes & Filtrations
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            Explorez les 3 méthodes d'extraction d'élite : Dry Sift de précision, Frozen Sift cryogénique et 2x Static 99% pure heads.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              count={categoryCounts[cat.id] || 0}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
