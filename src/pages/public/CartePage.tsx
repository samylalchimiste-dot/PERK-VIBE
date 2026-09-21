import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Store, 
  Crosshair, 
  MapPin, 
  Send, 
  Clock, 
  ShieldCheck, 
  Layers,
  Sparkles
} from 'lucide-react';
import { BottomNav } from '../../components/common/BottomNav';
import { BrandCrestLogo } from '../../components/common/BrandCrestLogo';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';
import L from 'leaflet';

export interface MoroccanCitySpot {
  id: string;
  city: string;
  region: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  hours: string;
  coverage: string[];
  details: string;
  speed: string;
  radiusMeters: number;
}

export const MOROCCAN_CITIES: MoroccanCitySpot[] = [
  {
    id: 'casablanca',
    city: 'Casablanca',
    region: 'Grand Casablanca',
    name: 'Casablanca Hub Express',
    type: 'Point de retrait & coursier 24/7',
    lat: 33.5731,
    lng: -7.5898,
    hours: '24h/24 & 7j/7',
    coverage: ['Anfa', 'Maârif', 'Gauthier', 'Aïn Diab', 'Bourgogne', 'Californie', 'Bouskoura', 'Sidi Maârouf'],
    details: 'Livraison express ultra-rapide sur tout Casablanca et sa périphérie. Remise discrète en mains propres ou point relais sécurisé.',
    speed: '< 35 min',
    radiusMeters: 16000,
  },
  {
    id: 'rabat',
    city: 'Rabat & Salé',
    region: 'Rabat-Salé-Kénitra',
    name: 'Rabat Capitale & Salé Privé',
    type: 'Service VIP & Drop Express',
    lat: 34.0209,
    lng: -6.8416,
    hours: '11h00 - 02h00 (7j/7)',
    coverage: ['Agdal', 'Hassan', 'Hay Riad', 'Souissi', 'Marina Bouregreg', 'Harhoura', 'Salé Ville'],
    details: 'Zone couverte : Agdal, Hay Riad, Souissi, centre-ville et Marina. Dispatch prioritaire sur l\'axe Rabat-Salé.',
    speed: '< 40 min',
    radiusMeters: 14000,
  },
  {
    id: 'marrakech',
    city: 'Marrakech',
    region: 'Marrakech-Safi',
    name: 'Marrakech Ocre Conciergerie',
    type: 'Livraison VIP & Villas / Riads',
    lat: 31.6295,
    lng: -7.9811,
    hours: '12h00 - 04h00 (7j/7)',
    coverage: ['Guéliz', 'Hivernage', 'Majorelle', 'Palmeraie', 'Targa', 'Route de l\'Ourika', 'Médina'],
    details: 'Service premium dédié aux hôtels, riads, villas privées et résidences sur Guéliz, Hivernage et Palmeraie.',
    speed: '< 30 min',
    radiusMeters: 15000,
  },
  {
    id: 'tanger',
    city: 'Tanger',
    region: 'Tanger-Tétouan-Al Hoceïma',
    name: 'Tanger Détroit Hub',
    type: 'Point Relais & Drop Express',
    lat: 35.7595,
    lng: -5.8340,
    hours: '12h00 - 02h00 (7j/7)',
    coverage: ['Malabata', 'Marshan', 'Centre-ville', 'Iberia', 'Marina Bay', 'Achakkar', 'Boukhalef'],
    details: 'Couverture complète de la baie de Tanger, corniche Malabata, centre et abords du détroit.',
    speed: '< 40 min',
    radiusMeters: 14000,
  },
  {
    id: 'fes',
    city: 'Fès',
    region: 'Fès-Meknès',
    name: 'Fès Impériale Drop',
    type: 'Point de retrait & livraison directe',
    lat: 34.0331,
    lng: -5.0003,
    hours: '12h00 - 00h00 (7j/7)',
    coverage: ['Ville Nouvelle', 'Champs de Course', 'Route d\'Imouzzer', 'Narjiss', 'Atlas', 'Mont Fleuri'],
    details: 'Dispatch rapide sur Ville Nouvelle, Champs de Course et grands boulevards de Fès.',
    speed: '< 45 min',
    radiusMeters: 13000,
  },
  {
    id: 'agadir',
    city: 'Agadir & Taghazout',
    region: 'Souss-Massa',
    name: 'Agadir Baie & Taghazout Bay',
    type: 'Livraison Côté Océan & VIP',
    lat: 30.4278,
    lng: -9.5981,
    hours: '12h00 - 01h00 (7j/7)',
    coverage: ['Marina', 'Baie des Palmiers', 'Talborjt', 'Sonaba', 'Taghazout Bay', 'Tamraght', 'Aourir'],
    details: 'Service direct sur la baie d\'Agadir, Marina et la côte surf de Taghazout / Tamraght.',
    speed: '< 45 min',
    radiusMeters: 18000,
  },
  {
    id: 'meknes',
    city: 'Meknès',
    region: 'Fès-Meknès',
    name: 'Meknès Ismaïlia Hub',
    type: 'Point Relais & Coursier',
    lat: 33.8938,
    lng: -5.5516,
    hours: '13h00 - 23h00 (7j/7)',
    coverage: ['Hamria', 'Belle Vue', 'Plaisance', 'Bassatine', 'Marjane'],
    details: 'Livraison rapide sur le secteur Hamria et axes principaux de Meknès.',
    speed: '< 45 min',
    radiusMeters: 11000,
  },
  {
    id: 'tetouan',
    city: 'Tétouan & Martil',
    region: 'Tanger-Tétouan-Al Hoceïma',
    name: 'Tétouan Côte Tamuda',
    type: 'Livraison Express & Stations Balnéaires',
    lat: 35.5889,
    lng: -5.3626,
    hours: '12h00 - 01h00 (7j/7)',
    coverage: ['Centre Wilaya', 'Martil', 'Cabo Negro', 'M\'diq', 'Marina Smir', 'Rincon'],
    details: 'Présence renforcée sur Tétouan ville et toute la côte Martil / Cabo Negro / M\'diq.',
    speed: '< 40 min',
    radiusMeters: 15000,
  },
  {
    id: 'oujda',
    city: 'Oujda & Saïdia',
    region: 'L\'Oriental',
    name: 'Oujda Oriental Hub',
    type: 'Service Express Régional',
    lat: 34.6867,
    lng: -1.9114,
    hours: '13h00 - 23h00 (7j/7)',
    coverage: ['Centre-ville', 'Boulevard Al Qods', 'Saïdia Marina', 'Berkane'],
    details: 'Livraison discrète sur Oujda centre et liaisons régulières vers Berkane et Saïdia.',
    speed: '< 50 min',
    radiusMeters: 16000,
  },
  {
    id: 'nador',
    city: 'Nador',
    region: 'L\'Oriental',
    name: 'Nador Marchica Drop',
    type: 'Point de retrait & livraison',
    lat: 35.1667,
    lng: -2.9333,
    hours: '13h00 - 23h00 (7j/7)',
    coverage: ['Marchica Bay', 'Centre Nador', 'Selouane', 'Beni Ensar'],
    details: 'Remise en mains propres sécurisée autour de la lagune Marchica et Nador.',
    speed: '< 50 min',
    radiusMeters: 12000,
  },
  {
    id: 'kenitra',
    city: 'Kénitra',
    region: 'Rabat-Salé-Kénitra',
    name: 'Kénitra & Mehdia Plage',
    type: 'Point Relais & Coursier',
    lat: 34.2610,
    lng: -6.5802,
    hours: '12h00 - 00h00 (7j/7)',
    coverage: ['Centre-ville', 'Mimosa', 'Bir Rami', 'Mehdia Plage', 'Alliance Darna'],
    details: 'Livraison express sur Kénitra centre, zones résidentielles et bord de mer Mehdia.',
    speed: '< 40 min',
    radiusMeters: 12000,
  },
  {
    id: 'essaouira',
    city: 'Essaouira',
    region: 'Marrakech-Safi',
    name: 'Essaouira Mogador Hub',
    type: 'Service VIP & Plage',
    lat: 31.5085,
    lng: -9.7595,
    hours: '12h00 - 23h00 (7j/7)',
    coverage: ['Médina', 'Front de Mer', 'Borj', 'Sidi Kaouki', 'Ghazoua'],
    details: 'Remise rapide sur la ville des alizés et le spot de surf de Sidi Kaouki.',
    speed: '< 45 min',
    radiusMeters: 12000,
  },
  {
    id: 'eljadida',
    city: 'El Jadida',
    region: 'Casablanca-Settat',
    name: 'El Jadida Mazagan Hub',
    type: 'Point de retrait & Conciergerie',
    lat: 33.2316,
    lng: -8.5007,
    hours: '13h00 - 23h00 (7j/7)',
    coverage: ['Cité Portugaise', 'Mazagan Resort', 'Sidi Bouzid', 'Centre-ville'],
    details: 'Couverture d\'El Jadida centre, Mazagan Beach Resort et Sidi Bouzid.',
    speed: '< 45 min',
    radiusMeters: 13000,
  },
  {
    id: 'alhoceima',
    city: 'Al Hoceïma',
    region: 'Tanger-Tétouan-Al Hoceïma',
    name: 'Al Hoceïma Baie Méditerranée',
    type: 'Livraison Directe & VIP',
    lat: 35.2517,
    lng: -3.9372,
    hours: '13h00 - 23h00 (7j/7)',
    coverage: ['Calabonita', 'Quemado', 'Centre-ville', 'Mirador', 'Tala Youssef'],
    details: 'Livraison sur toutes les corniches et baies d\'Al Hoceïma.',
    speed: '< 40 min',
    radiusMeters: 10000,
  },
  {
    id: 'dakhla',
    city: 'Dakhla',
    region: 'Dakhla-Oued Ed-Dahab',
    name: 'Dakhla Lagon Conciergerie',
    type: 'Service VIP & Lagon',
    lat: 23.7136,
    lng: -15.9348,
    hours: '12h00 - 23h00 (7j/7)',
    coverage: ['Lagon Kitesurf', 'PK25', 'Centre Dakhla', 'Corniche', 'Lassarga'],
    details: 'Livraison exclusive camps kitesurf, hôtels et centre-ville de Dakhla.',
    speed: '< 45 min',
    radiusMeters: 18000,
  },
];

const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];
const MOROCCO_DEFAULT_ZOOM = 6;

type MapTheme = 'dark' | 'satellite' | 'streets';

export const CartePage: React.FC = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayersRef = useRef<L.Layer[]>([]);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const coverageCircleRef = useRef<L.Circle | null>(null);

  const [selectedSpot, setSelectedSpot] = useState<MoroccanCitySpot>(MOROCCAN_CITIES[0]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<string>('all');
  const [currentTheme, setCurrentTheme] = useState<MapTheme>('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Function to apply tile layers without ANY "API KEY REQUIRED" watermark
  const applyTileLayer = (map: L.Map, theme: MapTheme) => {
    // Remove existing tile layers
    currentTileLayersRef.current.forEach((layer) => {
      map.removeLayer(layer);
    });
    currentTileLayersRef.current = [];

    if (theme === 'dark') {
      // 100% Free ESRI Dark Gray Base - ZERO KEY, ZERO WATERMARK
      const baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: '',
        }
      );
      // ESRI Dark Gray Reference (Labels with Moroccan cities and provinces)
      const labelLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
          attribution: '',
        }
      );

      baseLayer.addTo(map);
      labelLayer.addTo(map);
      currentTileLayersRef.current = [baseLayer, labelLayer];
    } else if (theme === 'satellite') {
      // ESRI World Satellite Imagery - ZERO KEY, ZERO WATERMARK
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: '',
        }
      );
      satLayer.addTo(map);
      currentTileLayersRef.current = [satLayer];
    } else {
      // OpenStreetMap - ZERO KEY, ZERO WATERMARK
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '',
      });
      osmLayer.addTo(map);
      currentTileLayersRef.current = [osmLayer];
    }
  };

  // Custom marker icon creation with prominent yellow pins and city labels
  const createCustomIcon = (cityName: string, isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-trichome-morocco-marker',
      html: `
        <div style="position: relative; width: ${isSelected ? 54 : 42}px; height: ${isSelected ? 64 : 52}px; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;">
          <!-- Pulsing Wave -->
          <div style="position: absolute; width: ${isSelected ? 54 : 40}px; height: ${isSelected ? 54 : 40}px; border-radius: 50%; background: ${isSelected ? 'rgba(251, 191, 36, 0.45)' : 'rgba(251, 191, 36, 0.2)'}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          
          <!-- Golden Shield Pin -->
          <svg viewBox="0 0 36 46" width="${isSelected ? 46 : 36}" height="${isSelected ? 56 : 46}" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.95)); z-index: 10;">
            <path d="M18 0 C8 0 0 8 0 18 C0 31.5 18 46 18 46 C18 46 36 31.5 36 18 C36 8 28 0 18 0 Z" fill="${isSelected ? '#f59e0b' : '#fbbf24'}" stroke="#b45309" stroke-width="1.8" />
            <circle cx="18" cy="18" r="7" fill="#09090b" />
            <circle cx="18" cy="18" r="3.5" fill="${isSelected ? '#fbbf24' : '#ffffff'}" />
          </svg>
          
          <!-- Legible City Name Badge -->
          <div style="position: absolute; bottom: -20px; white-space: nowrap; background: rgba(5,6,8,0.95); border: 1.5px solid ${isSelected ? '#fbbf24' : 'rgba(251,191,36,0.6)'}; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 900; color: ${isSelected ? '#ffffff' : '#fef08a'}; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.9); z-index: 20;">
            ${cityName}
          </div>
        </div>
      `,
      iconSize: [isSelected ? 54 : 42, isSelected ? 64 : 52],
      iconAnchor: [isSelected ? 27 : 21, isSelected ? 56 : 46],
    });
  };

  // Draw or update the coverage circle on selected city
  const updateCoverageCircle = (map: L.Map, spot: MoroccanCitySpot) => {
    if (coverageCircleRef.current) {
      map.removeLayer(coverageCircleRef.current);
      coverageCircleRef.current = null;
    }

    const circle = L.circle([spot.lat, spot.lng], {
      radius: spot.radiusMeters,
      color: '#f59e0b',
      weight: 1.5,
      opacity: 0.8,
      fillColor: '#fbbf24',
      fillOpacity: 0.12,
      dashArray: '4, 8',
    }).addTo(map);

    coverageCircleRef.current = circle;
  };

  // Initialize Leaflet Map centered on Morocco
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: MOROCCO_CENTER,
      zoom: MOROCCO_DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      minZoom: 5,
      maxZoom: 18,
    });
    mapInstanceRef.current = map;

    // Apply Default Dark Tile Layer (No watermark)
    applyTileLayer(map, 'dark');

    // Add Markers for all Moroccan cities
    const markers: { [key: string]: L.Marker } = {};
    MOROCCAN_CITIES.forEach((spot) => {
      const isSelected = spot.id === selectedSpot.id;
      const marker = L.marker([spot.lat, spot.lng], {
        icon: createCustomIcon(spot.city.split(' ')[0], isSelected),
        title: spot.name,
      }).addTo(map);

      marker.on('click', () => {
        hapticFeedback('medium');
        playClickSound();
        setSelectedSpot(spot);
        setActiveFilterId(spot.id);
        setIsDetailOpen(true);
        updateCoverageCircle(map, spot);
        map.flyTo([spot.lat, spot.lng], 12, { duration: 1.2 });
      });

      markers[spot.id] = marker;
    });
    markersRef.current = markers;

    // Draw initial coverage circle
    updateCoverageCircle(map, selectedSpot);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when selected city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    Object.keys(markersRef.current).forEach((id) => {
      const spot = MOROCCAN_CITIES.find((s) => s.id === id);
      if (spot) {
        const isSelected = spot.id === selectedSpot.id;
        markersRef.current[id].setIcon(createCustomIcon(spot.city.split(' ')[0], isSelected));
      }
    });

    updateCoverageCircle(mapInstanceRef.current, selectedSpot);
  }, [selectedSpot]);

  // Handle switching map tile theme
  const handleChangeTheme = (theme: MapTheme) => {
    hapticFeedback('light');
    playClickSound();
    setCurrentTheme(theme);
    setShowLayerMenu(false);
    if (mapInstanceRef.current) {
      applyTileLayer(mapInstanceRef.current, theme);
    }
  };

  // Handle selecting city from carousel or list
  const handleSelectCity = (spot: MoroccanCitySpot) => {
    hapticFeedback('medium');
    playClickSound();
    setSelectedSpot(spot);
    setActiveFilterId(spot.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.lat, spot.lng], 12, { duration: 1.2 });
    }
  };

  const handleResetMorocco = () => {
    hapticFeedback('light');
    playClickSound();
    setActiveFilterId('all');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(MOROCCO_CENTER, MOROCCO_DEFAULT_ZOOM, { duration: 1.2 });
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#050608] text-white flex flex-col overflow-hidden select-none">
      {/* 1. TOP HEADER */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 pt-3 pb-2 max-w-md mx-auto pointer-events-auto">
        {/* Back Button Pill */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback('light');
            playClickSound();
            navigate(-1);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#090d16]/95 hover:bg-[#121929] border border-amber-500/40 text-zinc-200 text-xs font-semibold backdrop-blur-xl shadow-lg transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400 -ml-0.5" />
          <span>Retour</span>
        </button>

        {/* Centered Crest Logo */}
        <div className="w-11 h-11 flex items-center justify-center -my-1">
          <BrandCrestLogo size="sm" showGlow={true} />
        </div>

        {/* All Morocco Quick View Button */}
        <button
          type="button"
          onClick={handleResetMorocco}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#090d16]/95 hover:bg-[#121929] border border-amber-500/40 text-amber-300 text-xs font-semibold backdrop-blur-xl shadow-lg transition active:scale-95 cursor-pointer"
        >
          <span>🇲🇦</span>
          <span className="text-[11px] font-mono font-bold">MAROC</span>
        </button>
      </header>

      {/* 2. TOP HORIZONTAL MOROCCAN CITIES CAROUSEL */}
      <div className="absolute top-14 left-0 right-0 z-20 pointer-events-auto px-3 max-w-md mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth">
          {/* All Morocco Pill */}
          <button
            type="button"
            onClick={handleResetMorocco}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              activeFilterId === 'all'
                ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] font-black'
                : 'bg-[#090d16]/90 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <span>🇲🇦</span>
            <span>Tout le Maroc</span>
          </button>

          {/* Moroccan City Buttons */}
          {MOROCCAN_CITIES.map((spot) => {
            const isActive = activeFilterId === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => handleSelectCity(spot)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] font-black'
                    : 'bg-[#090d16]/90 text-zinc-300 hover:text-white border border-zinc-800 font-semibold'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-zinc-950' : 'bg-amber-400'}`} />
                <span>{spot.city}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CURRENT ACTIVE CITY FLOATING CARD (TOP-LEFT) */}
      <div className="absolute top-26 left-3.5 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            hapticFeedback('medium');
            playClickSound();
            setIsDetailOpen(true);
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#090d16]/95 hover:bg-[#101726] border border-amber-500/50 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.85)] text-left transition active:scale-98 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Store className="w-4 h-4 stroke-[2.2]" />
          </div>

          <div>
            <div className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
              <span>{selectedSpot.city}</span>
              <span className="text-[10px] text-amber-400">⚡</span>
            </div>
            <div className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Livraison active ({selectedSpot.speed})</span>
            </div>
          </div>
        </button>
      </div>

      {/* 4. MAP LAYER SELECTOR (TOP-RIGHT) */}
      <div className="absolute top-26 right-3.5 z-20 pointer-events-auto">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-10 h-10 rounded-2xl bg-[#090d16]/95 hover:bg-[#101726] border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_10px_25px_rgba(0,0,0,0.85)] backdrop-blur-xl transition active:scale-95 cursor-pointer"
            title="Changer le style de carte"
          >
            <Layers className="w-4.5 h-4.5" />
          </button>

          {showLayerMenu && (
            <div className="absolute top-12 right-0 w-36 rounded-2xl bg-[#090d16]/98 border border-amber-500/40 p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-2xl space-y-1 z-30">
              <button
                type="button"
                onClick={() => handleChangeTheme('dark')}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  currentTheme === 'dark' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Mode Sombre</span>
                {currentTheme === 'dark' && <span>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleChangeTheme('satellite')}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  currentTheme === 'satellite' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Satellite</span>
                {currentTheme === 'satellite' && <span>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleChangeTheme('streets')}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  currentTheme === 'streets' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span>Plan Routier</span>
                {currentTheme === 'streets' && <span>✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. LEAFLET MAP CANVAS — FREE OF ANY WATERMARK OR API KEY */}
      <div className="flex-1 w-full h-full relative z-10">
        <div ref={mapContainerRef} className="w-full h-full bg-[#050608]" />
      </div>

      {/* 6. FLOATING CONTROLS: RE-CENTER & OPEN DETAILS */}
      <div className="absolute bottom-22 right-4 z-20 pointer-events-auto flex flex-col gap-2">
        {/* Recenter City Button */}
        <button
          type="button"
          onClick={() => handleSelectCity(selectedSpot)}
          className="w-11 h-11 rounded-full bg-[#090d16]/95 hover:bg-[#121929] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_4px_25px_rgba(0,0,0,0.9)] backdrop-blur-xl transition active:scale-95 cursor-pointer"
          title={`Centrer sur ${selectedSpot.city}`}
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* View Details Button */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback('medium');
            playClickSound();
            setIsDetailOpen(true);
          }}
          className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 border border-amber-300 flex items-center justify-center text-zinc-950 shadow-[0_4px_25px_rgba(251,191,36,0.6)] transition active:scale-95 cursor-pointer"
          title="Détails de la ville"
        >
          <MapPin className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* 7. MOROCCAN CITY DETAILS MODAL SHEET */}
      {isDetailOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#090d16] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Handle bar */}
            <div className="w-12 h-1 rounded-full bg-zinc-700 mx-auto -mt-1 sm:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <MapPin className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🇲🇦</span>
                    <h3 className="font-black text-lg text-white tracking-wide">{selectedSpot.city}</h3>
                  </div>
                  <p className="text-xs text-amber-400 font-medium">{selectedSpot.region}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Status & Service Details */}
            <div className="bg-[#050811] border border-zinc-800/90 rounded-2xl p-4 space-y-3 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Zone Marocaine Active</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                  ⚡ {selectedSpot.speed}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-zinc-300">
                {selectedSpot.details}
              </p>

              {/* Covered Neighborhoods */}
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Secteurs & Quartiers Desservis :
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedSpot.coverage.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-md bg-[#0e1627] border border-amber-500/20 text-zinc-200 text-[11px] font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] pt-2 border-t border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Disponibilité : <strong className="text-zinc-200">{selectedSpot.hours}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleSelectCity(selectedSpot);
                  setIsDetailOpen(false);
                }}
                className="w-full py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span>Centrer la ville</span>
              </button>

              <a
                href={`https://t.me/F2nOfficiel_Bot?start=order_${selectedSpot.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hapticFeedback('medium')}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 text-xs font-black transition shadow-[0_0_20px_rgba(245,158,11,0.45)] flex items-center justify-center gap-1.5 text-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Commander ({selectedSpot.city.split(' ')[0]})</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 8. BOTTOM NAVIGATION */}
      <BottomNav />
    </div>
  );
};
