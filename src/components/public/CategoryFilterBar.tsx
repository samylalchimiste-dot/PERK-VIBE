import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Store } from 'lucide-react';
import { Category } from '../../types';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface CategoryFilterBarProps {
  categories: Category[];
  selectedCategory: string; // 'ALL' or category id or category name
  onSelectCategory: (catId: string) => void;
  selectedFarm?: string;
  onSelectFarm?: (farm: string) => void;
  productCount?: number;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedFarm = 'ALL',
  onSelectFarm,
  productCount = 0,
}) => {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isFarmMenuOpen, setIsFarmMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const farmMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (farmMenuRef.current && !farmMenuRef.current.contains(event.target as Node)) {
        setIsFarmMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Canonical categories strictly requested by user: 2X STATIC, WPFF, DRY SIFT, FROZEN SIFT
  const canonicalOrder = ['2X STATIC', 'WPFF', 'DRY SIFT', 'FROZEN SIFT'];

  const uniqueCategories = React.useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];

    // Map each of the 4 canonical categories strictly once
    for (const canon of canonicalOrder) {
      const match = categories.find((c) => {
        const n = (c.name || '').toUpperCase().trim();
        if (canon === '2X STATIC') return n.includes('STATIC');
        if (canon === 'WPFF') return n.includes('WPFF') || n.includes('WPPF');
        if (canon === 'DRY SIFT') return n === 'DRY SIFT' || n === 'DRY';
        if (canon === 'FROZEN SIFT') return n === 'FROZEN SIFT' || n === 'FROZEN';
        return false;
      });

      if (match) {
        list.push({ id: match.id, name: canon });
      } else {
        list.push({ id: canon.toLowerCase().replace(/\s+/g, '-'), name: canon });
      }
    }

    return list;
  }, [categories]);

  const handleCategoryClick = (catId: string) => {
    hapticFeedback('light');
    playClickSound();
    onSelectCategory(catId);
    setIsCategoryMenuOpen(false);
  };

  const getActiveCategoryName = () => {
    if (selectedCategory === 'ALL') return 'Toutes';
    const found = uniqueCategories.find(
      (c) => c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase()
    );
    return found ? found.name : 'Catégories';
  };

  const isCatActive = (catId: string, catName: string) => {
    if (selectedCategory === 'ALL') return false;
    return (
      selectedCategory === catId ||
      selectedCategory.toLowerCase() === catName.toLowerCase() ||
      (catName === '2X STATIC' && selectedCategory.toLowerCase().includes('static')) ||
      (catName === 'WPFF' && (selectedCategory.toLowerCase().includes('wpff') || selectedCategory.toLowerCase().includes('wppf'))) ||
      (catName === 'DRY SIFT' && selectedCategory.toLowerCase().includes('dry')) ||
      (catName === 'FROZEN SIFT' && selectedCategory.toLowerCase().includes('frozen'))
    );
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Top Filter Buttons: [ Catégories ⌵ ] and [ Farms ⌵ ] */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Dropdown Catégories */}
        <div className="relative flex-1" ref={categoryMenuRef}>
          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setIsCategoryMenuOpen(!isCategoryMenuOpen);
              setIsFarmMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#0c1322] hover:bg-[#111a2f] border border-slate-800 text-xs font-semibold text-slate-200 transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-cyan-400">🏷️</span>
              <span className="truncate">{getActiveCategoryName()}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isCategoryMenuOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {/* Clean Dropdown Menu for Categories */}
          {isCategoryMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] z-50 rounded-2xl bg-[#0b111e] border border-cyan-900/60 shadow-[0_10px_30px_rgba(0,0,0,0.6)] py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => handleCategoryClick('ALL')}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition ${
                  selectedCategory === 'ALL'
                    ? 'text-cyan-300 bg-cyan-950/40 font-semibold'
                    : 'text-slate-300 hover:bg-[#121c32]'
                }`}
              >
                <span>Toutes les catégories</span>
                {selectedCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              <div className="h-px bg-slate-800/80 my-1" />

              {uniqueCategories.map((cat) => {
                const active = isCatActive(cat.id, cat.name);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition ${
                      active
                        ? 'text-cyan-300 bg-cyan-950/40 font-semibold'
                        : 'text-slate-300 hover:bg-[#121c32]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {active && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dropdown Farms - TRICHOME MONTANE */}
        <div className="relative flex-1" ref={farmMenuRef}>
          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setIsFarmMenuOpen(!isFarmMenuOpen);
              setIsCategoryMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#090d16] hover:bg-[#0f1626] border border-amber-500/30 text-xs font-semibold text-zinc-200 transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-amber-400">⚡</span>
              <span className="truncate">
                {selectedFarm === 'ALL' ? 'Cartel Del Farmez' : selectedFarm}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-amber-400/80 transition-transform duration-200 ${
                isFarmMenuOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>

          {/* Clean Dropdown Menu for Farms */}
          {isFarmMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-full min-w-[200px] z-50 rounded-2xl bg-[#090d16] border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  onSelectFarm?.('ALL');
                  setIsFarmMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition ${
                  selectedFarm === 'ALL'
                    ? 'text-amber-300 bg-amber-950/40 font-semibold'
                    : 'text-zinc-300 hover:bg-[#121c32]'
                }`}
              >
                <span>Toutes les farms</span>
                {selectedFarm === 'ALL' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              <div className="h-px bg-zinc-800 my-1" />

              {['Cartel Del Farmez'].map((farm) => {
                const active = selectedFarm === farm;
                return (
                  <button
                    key={farm}
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      onSelectFarm?.(farm);
                      setIsFarmMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition ${
                      active
                        ? 'text-amber-300 bg-amber-950/40 font-semibold'
                        : 'text-slate-300 hover:bg-[#121c32]'
                    }`}
                  >
                    <span>{farm}</span>
                    {active && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* HORIZONTAL CATEGORY FILTER BAR: [ Toutes ] [ 2X STATIC ] [ WPFF ] [ DRY SIFT ] [ FROZEN SIFT ] */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
        {/* "Toutes" Pill */}
        <button
          type="button"
          onClick={() => handleCategoryClick('ALL')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 ${
            selectedCategory === 'ALL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-[#0d1424] hover:bg-[#121c32] text-slate-400 hover:text-slate-200 border border-slate-800/80'
          }`}
        >
          Toutes
        </button>

        {/* 4 Canonical Categories: 2X STATIC, WPFF, DRY SIFT, FROZEN SIFT */}
        {uniqueCategories.map((cat) => {
          const active = isCatActive(cat.id, cat.name);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 ${
                active
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-[#0d1424] hover:bg-[#121c32] text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
