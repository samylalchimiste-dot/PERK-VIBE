import React, { useState, useMemo } from 'react';
import { X, MapPin, Search, Check, Globe } from 'lucide-react';
import { SUPPORTED_COUNTRIES, CountryLocation } from '../../data/europeanLocations';
import { FRENCH_DEPARTMENTS } from '../../data/frenchLocations';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface LocationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  onSelectLocation: (loc: string) => void;
}

export const LocationFilterModal: React.FC<LocationFilterModalProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('ALL');
  const [activeView, setActiveView] = useState<'cities' | 'regions'>('cities');

  const currentCountry = useMemo(() => {
    return SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode);
  }, [selectedCountryCode]);

  // Aggregate all cities based on selected country or all
  const availableCities = useMemo(() => {
    let list: { city: string; country: string; flag: string }[] = [];
    if (selectedCountryCode === 'ALL') {
      SUPPORTED_COUNTRIES.forEach((c) => {
        c.popularCities.forEach((city) => {
          list.push({ city, country: c.name, flag: c.flag });
        });
      });
    } else if (currentCountry) {
      currentCountry.popularCities.forEach((city) => {
        list.push({ city, country: currentCountry.name, flag: currentCountry.flag });
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.city.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q)
    );
  }, [selectedCountryCode, currentCountry, searchQuery]);

  // Aggregate regions
  const availableRegions = useMemo(() => {
    let list: { region: string; country: string; flag: string }[] = [];
    if (selectedCountryCode === 'ALL') {
      SUPPORTED_COUNTRIES.forEach((c) => {
        c.popularRegions.forEach((reg) => {
          list.push({ region: reg, country: c.name, flag: c.flag });
        });
      });
    } else if (currentCountry) {
      currentCountry.popularRegions.forEach((reg) => {
        list.push({ region: reg, country: currentCountry.name, flag: currentCountry.flag });
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.region.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q)
    );
  }, [selectedCountryCode, currentCountry, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (loc: string) => {
    hapticFeedback('medium');
    playClickSound();
    onSelectLocation(loc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060412]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#120e29] border border-purple-800/50 w-full max-w-md rounded-3xl p-5 shadow-2xl text-slate-100 space-y-4 max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-150 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-500 flex items-center justify-center text-white text-sm">
              🌍
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Filtrer par Pays & Villes
              </h3>
              <p className="text-[11px] text-purple-300">
                France, Espagne, Belgique, Suisse, Allemagne
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full bg-purple-950/60 border border-purple-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Country Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedCountryCode('ALL');
              hapticFeedback('light');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition border shrink-0 flex items-center gap-1.5 ${
              selectedCountryCode === 'ALL'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-500 shadow-md shadow-pink-900/30'
                : 'bg-[#0d0921] text-purple-200 border-purple-900/40 hover:bg-purple-900/30 hover:text-white'
            }`}
          >
            <span className="text-base">🌍</span>
            <span>Tous les pays</span>
          </button>

          {SUPPORTED_COUNTRIES.map((c) => {
            const isSel = selectedCountryCode === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setSelectedCountryCode(c.code);
                  hapticFeedback('light');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition border shrink-0 flex items-center gap-2 ${
                  isSel
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-500 shadow-md shadow-pink-900/30'
                    : 'bg-[#0d0921] text-purple-200 border-purple-900/40 hover:bg-purple-900/30 hover:text-white'
                }`}
              >
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une ville (Paris, Madrid, Bruxelles, Genève, Berlin...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0921] border border-purple-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        {/* Tabs: Villes Populaires vs Régions / Secteurs */}
        <div className="grid grid-cols-2 bg-[#090619] p-1 rounded-xl border border-purple-900/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveView('cities')}
            className={`py-1.5 rounded-lg transition ${
              activeView === 'cities'
                ? 'bg-purple-900/70 text-white shadow'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            🏙️ Villes Populaires ({availableCities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('regions')}
            className={`py-1.5 rounded-lg transition ${
              activeView === 'regions'
                ? 'bg-purple-900/70 text-white shadow'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            📍 Secteurs / Régions ({availableRegions.length})
          </button>
        </div>

        {/* Quick Reset button */}
        <button
          type="button"
          onClick={() => handleSelect('Tous')}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-between ${
            selectedLocation === 'Tous'
              ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
              : 'bg-[#151033] text-purple-200 border-purple-900/40 hover:bg-purple-900/40'
          }`}
        >
          <span>🌍 Tous les pays & toutes les villes</span>
          {selectedLocation === 'Tous' && <Check className="w-4 h-4 text-pink-400" />}
        </button>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {activeView === 'cities' ? (
            availableCities.map((item, idx) => {
              const isSelected = selectedLocation.toLowerCase() === item.city.toLowerCase();
              return (
                <button
                  key={`${item.country}-${item.city}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item.city)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                    isSelected
                      ? 'bg-pink-500/15 border-pink-500/40 text-pink-300 font-bold'
                      : 'bg-[#0e0a24] border-purple-900/30 text-purple-200/90 hover:bg-purple-900/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.flag}</span>
                    <div>
                      <div className="font-bold text-white text-xs">{item.city}</div>
                      <div className="text-[10px] text-purple-400">{item.country}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                </button>
              );
            })
          ) : (
            availableRegions.map((item, idx) => {
              const isSelected = selectedLocation.toLowerCase().includes(item.region.toLowerCase());
              return (
                <button
                  key={`${item.country}-${item.region}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item.region)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                    isSelected
                      ? 'bg-pink-500/15 border-pink-500/40 text-pink-300 font-bold'
                      : 'bg-[#0e0a24] border-purple-900/30 text-purple-200/90 hover:bg-purple-900/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.flag}</span>
                    <div>
                      <div className="font-bold text-white text-xs">{item.region}</div>
                      <div className="text-[10px] text-purple-400">{item.country}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                </button>
              );
            })
          )}

          {availableCities.length === 0 && activeView === 'cities' && (
            <div className="text-center py-6 text-xs text-purple-400">
              Aucune ville trouvée pour cette recherche.
            </div>
          )}

          {availableRegions.length === 0 && activeView === 'regions' && (
            <div className="text-center py-6 text-xs text-purple-400">
              Aucun secteur trouvé pour cette recherche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
