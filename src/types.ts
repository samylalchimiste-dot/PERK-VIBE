// ==========================================
// CATALOGUE & MENU TYPES (Cartel Del Farmez)
// ==========================================

export type ProductStockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'SOLD_OUT';
export type ProductPublishStatus = 'published' | 'hidden';

export interface ProductPhoto {
  url: string;
  storagePath?: string;
  isPrimary?: boolean;
  order?: number;
  caption?: string;
}

export interface ProductPricingTier {
  weight: string; // e.g. '5g', '10g', '25g', '50g', '100g'
  price: number; // e.g. 60, 120, 260
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  pricingTiers?: ProductPricingTier[];
  availableUnits?: number; // e.g. 25
  categoryId: string;
  categoryName?: string;
  images: string[];
  mainImage: string;
  videoUrl?: string;
  videos?: string[];
  stock: ProductStockStatus;
  status: ProductPublishStatus;
  featured: boolean;
  isNew: boolean;
  order?: number;
  details?: Record<string, string>;
  sku?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
}

export interface BrandSettings {
  brandName: string;
  tagline: string;
  description: string;
  profileImage: string;
  coverImage: string;
  currency: string;
  contactLinks: {
    telegram?: string;
    botUsername?: string;
    botUrl?: string;
    whatsapp?: string;
    instagram?: string;
    channel?: string;
  };
  heroCtaText?: string;
  badgeText?: string;
}

// ==========================================
// LEGACY TYPES (Preserved for compatibility)
// ==========================================

export interface ProfilePhoto {
  url: string;
  storagePath: string;
  isPrimary: boolean;
  order: number;
  caption?: string;
}

export type ProfileStatus = 'draft' | 'published' | 'archived';

export interface CustomField {
  label: string;
  value: string;
}

export interface ServiceModes {
  clickAndCollect: boolean;
  livraisonLocale: boolean;
  envoiPostal: boolean;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  description: string;
  country: string;
  city: string;
  region?: string; // e.g. "Paris IDF", "31 Haute-Garonne", "69 Rhône"
  secteur?: string; // e.g. "75 & IDF", "Paris & Banlieue"
  category: string;
  photos: ProfilePhoto[];
  avatarUrl?: string; // Logo / Photo de profil dédiée
  bannerUrl?: string; // Photo d'arrière-plan / Bannière vitrine
  featured: boolean;
  status: ProfileStatus;
  votes?: number;
  views?: number;
  badge?: string; // e.g. "Top Farmz", "Vérifié PVF"
  createdAt: any;
  updatedAt: any;
  publishedAt?: any;
  archivedAt?: any;
  createdBy?: string;
  updatedBy?: string;
  tags?: string[];
  serviceModes?: ServiceModes;
  socialLinks?: {
    telegram?: string;
    telegramBot?: string;
    instagram?: string;
    potato?: string;
    snapchat?: string;
    website?: string;
    phone?: string;
    email?: string;
  };
  customFields?: CustomField[];
}

export interface AdminUser {
  uid: string;
  email: string | null;
  role: 'owner' | 'admin';
  active: boolean;
  displayName?: string;
  createdAt?: any;
}

export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  totalVotes?: number;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  country?: string;
  city?: string;
  region?: string;
  featuredOnly?: boolean;
}

export interface ShopSubmission {
  name: string;
  country?: string; // France, Espagne, Belgique, Suisse, Allemagne
  city: string;
  secteur: string;
  serviceModes: ServiceModes;
  telegram: string;
  telegramBot?: string;
  instagram?: string;
  potato?: string;
  snapchat?: string;
  photoUrl?: string; // Photo de profil / Logo
  bannerUrl?: string; // Photo d'arrière-plan / Bannière vitrine
  description?: string;
}


