import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Category } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface CategoryCardProps {
  category: Category;
  count?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, count }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    hapticFeedback('light');
    playClickSound();
    navigate(`/shop?category=${category.id}`);
  };

  const bgImage = category.image || 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={handleClick}
      className="group relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer shadow-lg transition-all duration-300 active:scale-[0.98]"
    >
      {/* Background Image */}
      <img
        src={bgImage}
        alt={category.name}
        loading="lazy"
        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-60 group-hover:opacity-75"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-black/30" />

      {/* Top Count Badge */}
      {typeof count === 'number' && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-300 bg-black/60 backdrop-blur-md border border-zinc-700/60">
            {count} {count > 1 ? 'pièces' : 'pièce'}
          </span>
        </div>
      )}

      {/* Content Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between z-10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-0.5">
            Collection
          </span>
          <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-tight group-hover:translate-x-0.5 transition-transform">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5 font-normal max-w-[220px]">
              {category.description}
            </p>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white text-zinc-300 group-hover:text-zinc-950 flex items-center justify-center backdrop-blur-md transition-colors shrink-0 ml-2">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
