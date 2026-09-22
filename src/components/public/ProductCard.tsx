import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';
import { Product } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface ProductCardProps {
  product: Product;
  featuredStyle?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, featuredStyle = false }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState<number>(() => {
    const saved = localStorage.getItem(`pvf_fav_${product.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    return localStorage.getItem(`pvf_is_liked_${product.id}`) === 'true';
  });

  const isSoldOut = product.stock === 'SOLD_OUT';
  const isLowStock = product.stock === 'LOW_STOCK';
  const mainImage = product.mainImage || product.images?.[0] || '';

  const handleClick = () => {
    hapticFeedback('light');
    playClickSound();
    navigate(`/product/${product.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('medium');
    const nextLiked = !isLiked;
    const nextLikes = nextLiked ? likes + 1 : Math.max(0, likes - 1);
    setIsLiked(nextLiked);
    setLikes(nextLikes);
    localStorage.setItem(`pvf_fav_${product.id}`, nextLikes.toString());
    localStorage.setItem(`pvf_is_liked_${product.id}`, nextLiked.toString());
  };

  const categoryLabel = (product.categoryName || 'EXTRACTION').toUpperCase();
  const farmLabel = (product.details?.['Origine'] || 'Perk Vibes Farmz').replace('Perk Vibes Farmz - ', '');

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#0c121e] border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
        featuredStyle ? 'shadow-[0_4px_20px_rgba(6,182,212,0.1)]' : 'shadow-md'
      }`}
    >
      {/* Product Image Box */}
      <div className="relative w-full aspect-square overflow-hidden bg-[#060a12] flex items-center justify-center">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105 ${
              isSoldOut ? 'opacity-50 grayscale' : 'opacity-95'
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="w-8 h-8 text-cyan-500/50 mb-2" />
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Subtle Dark Gradient at base of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c121e] via-transparent to-transparent opacity-80 pointer-events-none" />

        {/* Star Badge (Top-Left) */}
        {product.featured && (
          <div className="absolute top-2 left-2 z-10">
            <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        )}

        {/* Favorite / Like Heart Button (Top-Right) */}
        <button
          type="button"
          onClick={handleLike}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-[#0c121e]/80 hover:bg-[#0c121e] backdrop-blur-md border border-slate-700/60 text-slate-300 transition active:scale-90"
        >
          <Heart
            className={`w-3 h-3 transition-colors ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-slate-300'
            }`}
          />
          <span className="text-[10px] font-mono font-medium">{likes}</span>
        </button>

        {/* Sold Out / Low Stock Indicator */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-10 pointer-events-none">
            <span className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-[10px] font-bold uppercase tracking-wider">
              Épuisé
            </span>
          </div>
        )}
      </div>

      {/* Product Information Section */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div className="space-y-1">
          {/* Category Tag (🏷️ FROZEN) */}
          <div className="flex items-center gap-1 text-[10px] font-medium text-cyan-400">
            <span>🏷️</span>
            <span className="truncate tracking-wide">{categoryLabel}</span>
          </div>

          {/* Farm Tag (🏪 Farm) */}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
            <span>🏪</span>
            <span className="truncate">{farmLabel}</span>
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-200 transition line-clamp-1 pt-0.5">
            {product.name}
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 flex items-center justify-between">
          <div className="inline-flex items-baseline px-2.5 py-1 rounded-xl bg-[#0e192c] border border-cyan-900/60 text-cyan-300 font-bold text-xs tracking-tight">
            <span>{product.price}</span>
            <span className="text-[10px] ml-0.5 font-normal">{product.currency || '€'}/g</span>
          </div>

          {/* Discreet stock dot */}
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSoldOut
                  ? 'bg-slate-600'
                  : isLowStock
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-[9px]">
              {isSoldOut ? 'Rupture' : 'Dispo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
