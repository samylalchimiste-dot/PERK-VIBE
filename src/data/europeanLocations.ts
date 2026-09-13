export interface CountryLocation {
  code: string;
  name: string;
  flag: string;
  popularCities: string[];
  popularRegions: string[];
}

export const SUPPORTED_COUNTRIES: CountryLocation[] = [
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    popularCities: [
      'Paris',
      'Marseille',
      'Lyon',
      'Toulouse',
      'Nice',
      'Nantes',
      'Montpellier',
      'Strasbourg',
      'Bordeaux',
      'Lille',
      'Rennes',
      'Toulon',
      'Grenoble',
      'Dijon',
      'Rouen',
      'Cannes'
    ],
    popularRegions: [
      '75 & Île-de-France',
      '69 & Rhône-Alpes',
      '13 & PACA / Côte d\'Azur',
      '31 & Occitanie / Toulouse',
      '33 & Gironde / Bordeaux',
      '59 & Hauts-de-France / Lille',
      '44 & Pays de la Loire',
      'France Entière (Envoi suivi)'
    ]
  },
  {
    code: 'ES',
    name: 'Espagne',
    flag: '🇪🇸',
    popularCities: [
      'Madrid',
      'Barcelone',
      'Valence',
      'Séville',
      'Saragosse',
      'Malaga',
      'Murcie',
      'Palma de Majorque',
      'Las Palmas',
      'Bilbao',
      'Alicante',
      'Cordoue',
      'Valladolid',
      'Vigo',
      'Gijón',
      'Grenade',
      'Marbella',
      'Ibiza'
    ],
    popularRegions: [
      'Madrid & Comunidad',
      'Catalogne / Barcelone',
      'Andalousie (Séville, Malaga, Marbella)',
      'Communauté Valencienne (Valence, Alicante)',
      'Îles Baléares (Palma, Ibiza)',
      'Pays Basque (Bilbao, San Sebastián)',
      'Îles Canaries',
      'Espagne Entière (Envoi)'
    ]
  },
  {
    code: 'BE',
    name: 'Belgique',
    flag: '🇧🇪',
    popularCities: [
      'Bruxelles',
      'Anvers',
      'Gand',
      'Charleroi',
      'Liège',
      'Bruges',
      'Namur',
      'Louvain',
      'Mons',
      'Alost',
      'Malines',
      'La Louvière',
      'Courtrai',
      'Hasselt',
      'Ostende',
      'Tournai',
      'Verviers'
    ],
    popularRegions: [
      'Bruxelles-Capitale',
      'Flandre / Anvers & Gand',
      'Wallonie / Liège & Namur',
      'Hainaut (Charleroi, Mons)',
      'Brabant Flamand / Louvain',
      'Belgique Entière (Envoi)'
    ]
  },
  {
    code: 'CH',
    name: 'Suisse',
    flag: '🇨🇭',
    popularCities: [
      'Genève',
      'Zurich',
      'Bâle',
      'Lausanne',
      'Berne',
      'Winterthour',
      'Lucerne',
      'Saint-Gall',
      'Lugano',
      'Bienne',
      'Thoune',
      'Fribourg',
      'Neuchâtel',
      'Sion',
      'Montreux',
      'Yverdon-les-Bains'
    ],
    popularRegions: [
      'Suisse Romande (Genève, Lausanne, Fribourg, Valais)',
      'Canton de Genève',
      'Canton de Vaud (Lausanne)',
      'Canton de Zurich',
      'Canton de Berne',
      'Canton de Bâle',
      'Tessin (Lugano)',
      'Suisse Entière (Envoi)'
    ]
  },
  {
    code: 'DE',
    name: 'Allemagne',
    flag: '🇩🇪',
    popularCities: [
      'Berlin',
      'Munich',
      'Francfort',
      'Hambourg',
      'Cologne',
      'Stuttgart',
      'Düsseldorf',
      'Leipzig',
      'Dortmund',
      'Essen',
      'Brême',
      'Dresde',
      'Hanovre',
      'Nuremberg',
      'Duisbourg',
      'Bochum',
      'Wuppertal',
      'Bonn'
    ],
    popularRegions: [
      'Berlin & Brandebourg',
      'Bavière (Munich, Nuremberg)',
      'Rhénanie-du-Nord-Westphalie (Cologne, Düsseldorf, Dortmund)',
      'Hesse (Francfort)',
      'Bade-Wurtemberg (Stuttgart)',
      'Hambourg',
      'Saxe (Leipzig, Dresde)',
      'Allemagne Entière (Envoi)'
    ]
  }
];

export function getCountryByCode(code: string): CountryLocation | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.code === code || c.name.toLowerCase() === code.toLowerCase());
}

export function getAllPopularCitiesForCountry(countryNameOrCode: string): string[] {
  const found = SUPPORTED_COUNTRIES.find(c => 
    c.name.toLowerCase() === countryNameOrCode.toLowerCase() || 
    c.code.toLowerCase() === countryNameOrCode.toLowerCase()
  );
  return found ? found.popularCities : [];
}

export function getAllRegionsForCountry(countryNameOrCode: string): string[] {
  const found = SUPPORTED_COUNTRIES.find(c => 
    c.name.toLowerCase() === countryNameOrCode.toLowerCase() || 
    c.code.toLowerCase() === countryNameOrCode.toLowerCase()
  );
  return found ? found.popularRegions : [];
}
