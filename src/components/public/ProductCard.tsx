import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Tag, Eye } from 'lucide-react';
import { Product } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface ProductCardProps {
  product: Product;
  featuredStyle?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, featuredStyle = false }) => {
  const navigate = useNavigate();

  const isSoldOut = product.stock === 'SOLD_OUT';
  const isLowStock = product.stock === 'LOW_STOCK';
  const mainImage = product.mainImage || product.images?.[0] || 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80';

  const handleClick = () => {
    hapticFeedback('light');
    playClickSound();
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-[#111114] border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 cursor-pointer select-none active:scale-[0.98] ${
        featuredStyle ? 'shadow-xl' : 'shadow-md'
      }`}
    >
      {/* Product Image Frame */}
      <div className={`relative w-full overflow-hidden bg-zinc-950 ${featuredStyle ? 'aspect-[4/5]' : 'aspect-square'}`}>
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
            isSoldOut ? 'opacity-50 grayscale' : 'opacity-95'
          }`}
        />

        {/* Dark subtle gradient at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-80 pointer-events-none" />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {isSoldOut ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-400 border border-zinc-700/80 backdrop-blur-md">
                Épuisé
              </span>
            ) : isLowStock ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                Stock Limité
              </span>
            ) : product.isNew ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/95 text-zinc-950 shadow-md backdrop-blur-md">
                Nouveau
              </span>
            ) : null}

            {product.featured && !isSoldOut && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Sélection PVF
              </span>
            )}
          </div>
        </div>

        {/* Hover Quick Action Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 pointer-events-none">
          <div className="p-2 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Category & Availability Dot */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
            <span className="uppercase tracking-widest truncate">
              {product.categoryName || 'PERK VIBES FARMZ'}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSoldOut
                    ? 'bg-zinc-600'
                    : isLowStock
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-[10px] text-zinc-400">
                {isSoldOut ? 'Épuisé' : isLowStock ? 'Stock Faible' : 'Disponible'}
              </span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-sm sm:text-base text-zinc-100 group-hover:text-white transition line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.description && (
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-normal">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-base sm:text-lg text-white font-mono tracking-tight">
              {product.price}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {product.currency || '€'}
            </span>
          </div>

          <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition">
            Voir la pièce →
          </span>
        </div>
      </div>
    </div>
  );
};
