import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { Product, Category, BrandSettings, ProductStockStatus, ProductPublishStatus } from '../../types';
import { TELEGRAM_BOT_CONFIG } from '../telegram/telegramBotConfig';

export const PRODUCTS_COLLECTION = 'products';
export const CATEGORIES_COLLECTION = 'categories';
export const SETTINGS_COLLECTION = 'brandSettings';
export const BRAND_SETTINGS_DOC_ID = 'main';

// Default PERK VIBES FARMZ Brand Settings
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: 'PERK VIBES FARMZ',
  tagline: 'Connoisseur Farm & Top-Shelf Extractions',
  description: 'Sélection exclusive de filtrations d\'exception : Dry Sift de précision, Frozen Sift cryogénique et 2x Static 99% trichome heads.',
  profileImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=400&q=80',
  coverImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1600&q=80',
  currency: '€',
  heroCtaText: 'Explorer le Menu',
  badgeText: 'Drop Exclusif 2026',
  contactLinks: {
    telegram: 'https://t.me/F2nOfficiel_Bot',
    botUsername: TELEGRAM_BOT_CONFIG.botUsername || 'F2nOfficiel_Bot',
    botUrl: TELEGRAM_BOT_CONFIG.botUrl || 'https://t.me/F2nOfficiel_Bot',
    whatsapp: '',
    instagram: '@perkvibesfarmz',
    channel: 'https://t.me/F2nOfficiel_Bot',
  },
};

// ==========================================
// BRAND SETTINGS API
// ==========================================

export function subscribeBrandSettings(callback: (settings: BrandSettings) => void): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, BRAND_SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as BrandSettings;
        // If the stored name is still the old one, merge with PERK VIBES FARMZ
        const isOldName = !data.brandName || data.brandName === 'F2N' || data.brandName === 'F2N PARIS';
        callback({
          ...DEFAULT_BRAND_SETTINGS,
          ...data,
          brandName: isOldName ? DEFAULT_BRAND_SETTINGS.brandName : data.brandName,
          tagline: isOldName ? DEFAULT_BRAND_SETTINGS.tagline : (data.tagline || DEFAULT_BRAND_SETTINGS.tagline),
          description: isOldName ? DEFAULT_BRAND_SETTINGS.description : (data.description || DEFAULT_BRAND_SETTINGS.description),
          contactLinks: {
            ...DEFAULT_BRAND_SETTINGS.contactLinks,
            ...(data.contactLinks || {}),
          },
        });
      } else {
        setDoc(docRef, DEFAULT_BRAND_SETTINGS).catch((err) => {
          console.warn('Could not auto-init brand settings in Firestore:', err);
        });
        callback(DEFAULT_BRAND_SETTINGS);
      }
    },
    (err) => {
      console.warn('Firestore settings listener fallback:', err);
      callback(DEFAULT_BRAND_SETTINGS);
    }
  );
}

export async function getBrandSettings(): Promise<BrandSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BRAND_SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_BRAND_SETTINGS, ...(snap.data() as BrandSettings) };
    }
    return DEFAULT_BRAND_SETTINGS;
  } catch (err) {
    console.error('Error fetching brand settings:', err);
    return DEFAULT_BRAND_SETTINGS;
  }
}

export async function updateBrandSettings(settings: Partial<BrandSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, BRAND_SETTINGS_DOC_ID);
  await setDoc(docRef, { ...settings, updatedAt: Date.now() }, { merge: true });
}

// ==========================================
// CATEGORIES API (DRY SIFT / FROZEN SIFT / 2X STATIC)
// ==========================================

export function subscribeCategories(callback: (categories: Category[]) => void): () => void {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(colRef, orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Category[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Category, 'id'>),
        });
      });
      // Safety filter: ensure no old clothing category leaks
      const filtered = list.filter((c) => {
        const nameLower = (c.name || '').toLowerCase();
        return !nameLower.includes('prêt') && !nameLower.includes('accessoire') && !nameLower.includes('sneaker') && !nameLower.includes('vêtement');
      });
      callback(filtered);
    },
    (error) => {
      console.error('Firestore categories subscription error:', error);
      // Fallback in case of index delay
      getDocs(colRef).then((snap) => {
        const list: Category[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Category, 'id'>) });
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        const filtered = list.filter((c) => {
          const nameLower = (c.name || '').toLowerCase();
          return !nameLower.includes('prêt') && !nameLower.includes('accessoire') && !nameLower.includes('sneaker') && !nameLower.includes('vêtement');
        });
        callback(filtered);
      }).catch((e) => console.error(e));
    }
  );
}

export async function createCategory(cat: Omit<Category, 'id'>): Promise<string> {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...cat,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(docRef);
}

// ==========================================
// PRODUCTS API
// ==========================================

export function subscribeProducts(
  callback: (products: Product[]) => void,
  options?: { categoryId?: string; publishedOnly?: boolean }
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  let q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      let list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Product, 'id'>),
        });
      });

      // Filter in memory to avoid needing complex Firestore composite indexes
      if (options?.publishedOnly) {
        list = list.filter((p) => p.status === 'published');
      }
      if (options?.categoryId && options.categoryId !== 'ALL') {
        list = list.filter((p) => p.categoryId === options.categoryId);
      }

      // Safety filter: ensure no old clothing products leak
      const CLOTHING_TERMS = ['veste', 'bomber', 'hoodie', 'pantalon', 'cargo', 'sacoche', 'sneakers', 't-shirt', 'tee-shirt', 'casquette', 'survêtement', 'survetement', 'f2n'];
      list = list.filter((p) => {
        const cat = (p.categoryName || '').toUpperCase();
        const isFarmzCat = cat.includes('DRY') || cat.includes('FROZEN') || cat.includes('STATIC');
        if (isFarmzCat) return true;
        const text = `${p.name} ${p.categoryName || ''} ${p.description || ''}`.toLowerCase();
        return !CLOTHING_TERMS.some((term) => text.includes(term));
      });

      // Sort: Featured first, then order, then createdAt desc
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      callback(list);
    },
    (error) => {
      console.error('Firestore products subscription error:', error);
    }
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
  } catch (err) {
    console.error(`Error getting product ${id}:`, err);
    return null;
  }
}

export async function createProduct(prod: Omit<Product, 'id'>): Promise<string> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...prod,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Deletes ALL products from Firestore collection
 */
export async function deleteAllProducts(): Promise<number> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const snap = await getDocs(colRef);
  let count = 0;
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, docSnap.id));
    count++;
  }
  return count;
}

// ==========================================
// IMAGE UPLOADER
// ==========================================

export async function uploadCatalogImage(
  file: File,
  folder: string = 'catalog',
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storage, `${folder}/${timestamp}_${cleanFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.warn('Firebase Storage upload failed, falling back to compressed DataURL:', error);
          compressImageToDataURL(file).then(resolve).catch(reject);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (e) {
            compressImageToDataURL(file).then(resolve).catch(reject);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Fallback direct compression due to storage error:', err);
    return compressImageToDataURL(file);
  }
}

export async function compressImageToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressed);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// PURGE OLD CLOTHES & SEED PERK VIBES FARMZ
// ==========================================

const OLD_CLOTHING_KEYWORDS = [
  'veste', 'bomber', 'hoodie', 'sweat', 'sacoche', 't-shirt', 'tshirt',
  'casquette', 'cargo', 'pantalon', 'pret-a-porter', 'maroquinerie', 'sneakers', 'couture', 'f2n'
];

/**
 * Removes ONLY legacy products (non-farmz products)
 */
export async function purgeOldProductsOnly(): Promise<number> {
  const colProducts = collection(db, PRODUCTS_COLLECTION);
  const prodsSnap = await getDocs(colProducts);
  let count = 0;
  for (const prodDoc of prodsSnap.docs) {
    const p = prodDoc.data() as Product;
    const cat = (p.categoryName || '').toUpperCase();
    const isFarmz = cat.includes('DRY') || cat.includes('FROZEN') || cat.includes('STATIC');
    const combined = `${p.name} ${p.categoryName || ''} ${p.description || ''}`.toLowerCase();
    const hasClothing = OLD_CLOTHING_KEYWORDS.some((kw) => combined.includes(kw));

    if (!isFarmz || hasClothing) {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, prodDoc.id));
      count++;
    }
  }
  return count;
}

/**
 * Wipes all products and categories completely
 */
export async function purgeAllProductsAndCategories(): Promise<{ deletedProds: number; deletedCats: number }> {
  const colProducts = collection(db, PRODUCTS_COLLECTION);
  const colCategories = collection(db, CATEGORIES_COLLECTION);
  const prodsSnap = await getDocs(colProducts);
  const catsSnap = await getDocs(colCategories);

  let deletedProds = 0;
  for (const docSnap of prodsSnap.docs) {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, docSnap.id));
    deletedProds++;
  }

  let deletedCats = 0;
  for (const docSnap of catsSnap.docs) {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, docSnap.id));
    deletedCats++;
  }

  return { deletedProds, deletedCats };
}

export async function resetAndSeedPerkVibesFarmz(force: boolean = false): Promise<boolean> {
  try {
    const colProducts = collection(db, PRODUCTS_COLLECTION);
    const colCategories = collection(db, CATEGORIES_COLLECTION);

    const prodsSnap = await getDocs(colProducts);
    const catsSnap = await getDocs(colCategories);

    // Check if any old clothing product or old category exists
    let hasOldClothing = false;
    prodsSnap.forEach((d) => {
      const p = d.data() as Product;
      const combined = `${p.name} ${p.categoryName || ''} ${p.description || ''}`.toLowerCase();
      if (OLD_CLOTHING_KEYWORDS.some((kw) => combined.includes(kw))) {
        hasOldClothing = true;
      }
    });

    catsSnap.forEach((d) => {
      const c = d.data() as Category;
      const name = (c.name || '').toLowerCase();
      if (name.includes('prêt') || name.includes('accessoires') || name.includes('sneakers') || name.includes('limité')) {
        hasOldClothing = true;
      }
    });

    const isMissingCategories = catsSnap.size < 3;
    const isEmpty = prodsSnap.empty;

    if (!force && !hasOldClothing && !isEmpty && !isMissingCategories) {
      // Already running clean PERK VIBES FARMZ catalog
      return false;
    }

    console.log('🔄 Cleaning old products/categories and seeding PERK VIBES FARMZ catalog...');

    // 1. Delete old products if clothing detected or force
    if (hasOldClothing || force) {
      for (const prodDoc of prodsSnap.docs) {
        await deleteDoc(doc(db, PRODUCTS_COLLECTION, prodDoc.id));
      }
      for (const catDoc of catsSnap.docs) {
        await deleteDoc(doc(db, CATEGORIES_COLLECTION, catDoc.id));
      }
    }

    // 2. Insert the 3 EXACT Categories requested: DRY SIFT, FROZEN SIFT, 2x STATIC
    const categoriesData: Array<Omit<Category, 'id'>> = [
      {
        name: 'DRY SIFT',
        slug: 'dry-sift',
        description: 'Tamisage mécanique de précision, trichomes dorés et profil terpénique brut ultra parfumé.',
        image: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=800&q=80',
        order: 1,
      },
      {
        name: 'FROZEN SIFT',
        slug: 'frozen-sift',
        description: 'Extraction à froid cryogénique sur biomasse fraîche, texture bader crémeuse et terpènes vivants.',
        image: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80',
        order: 2,
      },
      {
        name: '2x STATIC',
        slug: '2x-static',
        description: 'Double purification statique isolant 99% de têtes glandulaires sans matière végétale. Pureté absolue.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        order: 3,
      },
    ];

    const categoryIds: Record<string, string> = {};
    for (const cat of categoriesData) {
      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        ...cat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      categoryIds[cat.name] = docRef.id;
    }

    // 3. Insert PERK VIBES FARMZ Products for DRY SIFT, FROZEN SIFT, 2x STATIC
    const productsData: Array<Omit<Product, 'id'>> = [
      // --- DRY SIFT ---
      {
        name: 'Tangie Papaya 120u / 73u',
        description: 'Dry sift de précision issu de la récolte 2026 Perk Vibes Farmz. Tamisage soigné révélant un sable doré fondant à température ambiante. Explosion aromatique de zestes d\'oranges douces, mangue et papaye mûre.',
        price: 50,
        currency: '€',
        categoryId: categoryIds['DRY SIFT'] || '',
        categoryName: 'DRY SIFT',
        images: [
          'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
        stock: 'AVAILABLE',
        status: 'published',
        featured: true,
        isNew: true,
        order: 1,
        sku: 'PVF-DS-001',
        details: {
          'Filtration': 'Tamisage mécanique 120u - 73u',
          'Profil Terpénique': 'Agrumes doux, papaye mûre & gaz subtil',
          'Texture': 'Sable doré crémeux à température ambiante',
          'Origine': 'Perk Vibes Farmz - Batch #26A',
          'Conservation': 'Conserver au frais (8°C - 12°C)',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: 'Forbidden Zkittlez 105u Ultra Clean',
        description: 'Sélection pure souche terpénique. Tamisage fin 105 microns sans débris végétal. Profil de bonbon tropical acidulé avec un arrière-goût de fruits de la passion et de diesel délicat.',
        price: 45,
        currency: '€',
        categoryId: categoryIds['DRY SIFT'] || '',
        categoryName: 'DRY SIFT',
        images: [
          'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
        stock: 'AVAILABLE',
        status: 'published',
        featured: false,
        isNew: true,
        order: 2,
        sku: 'PVF-DS-002',
        details: {
          'Filtration': '105u Sélectif',
          'Profil Terpénique': 'Fruits rouges acidulés, bonbon tropical',
          'Texture': 'Semi-cured, terpène ring naturel au doigt',
          'Origine': 'Perk Vibes Farmz - Batch #26B',
          'Conservation': 'Lieu sec et tempéré',
        },
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      },
      {
        name: 'Biscotti Mintz Cold Cure 90u',
        description: 'Dry sift maturé à basse température pendant 21 jours. Texture résineuse crémeuse et onctueuse. Notes lourdes de biscuit vanillé, menthe fraîche poivrée et fond de café chocolaté.',
        price: 55,
        currency: '€',
        categoryId: categoryIds['DRY SIFT'] || '',
        categoryName: 'DRY SIFT',
        images: [
          'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1000&q=80',
        stock: 'LOW_STOCK',
        status: 'published',
        featured: true,
        isNew: false,
        order: 3,
        sku: 'PVF-DS-003',
        details: {
          'Filtration': '90u Single Source',
          'Profil Terpénique': 'Pâtisserie vanillée, menthe poivrée, diesel',
          'Texture': 'Cold cure crémeux suintant',
          'Origine': 'Perk Vibes Farmz - Batch #25Z',
          'Conservation': 'Frigo conseillé (4°C - 8°C)',
        },
        createdAt: Date.now() - 10000,
        updatedAt: Date.now() - 10000,
      },

      // --- FROZEN SIFT ---
      {
        name: 'Melonade Sherbet Fresh Cut Cryo',
        description: 'Frozen sift élaboré à partir de fleurs congelées à -40°C dès la récolte. Préserve l\'intégralité des monoterpènes volatils. Parfum vibrant de melon d\'Espagne mûr et de sorbet citron crémeux.',
        price: 75,
        currency: '€',
        categoryId: categoryIds['FROZEN SIFT'] || '',
        categoryName: 'FROZEN SIFT',
        images: [
          'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
        stock: 'AVAILABLE',
        status: 'published',
        featured: true,
        isNew: true,
        order: 4,
        sku: 'PVF-FS-001',
        details: {
          'Process': 'Fresh Frozen -40°C sous atmosphère inerte',
          'Microns': '90u - 120u Live Heads',
          'Profil Terpénique': 'Melon givré, zeste de citron, pâte sucrée',
          'Texture': 'Bader ultra brillant et onctueux',
          'Conservation': 'Obligatoire au frais (4°C)',
        },
        createdAt: Date.now() - 15000,
        updatedAt: Date.now() - 15000,
      },
      {
        name: 'GMO x Trop Cookies Live Bader',
        description: 'Un crossover surpuissant associant le funk terreux aillé de la GMO à la fraîcheur d\'agrumes de la Trop Cookies. Séparation cryogénique assurant une pureté maximale des têtes de résine.',
        price: 80,
        currency: '€',
        categoryId: categoryIds['FROZEN SIFT'] || '',
        categoryName: 'FROZEN SIFT',
        images: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
        stock: 'AVAILABLE',
        status: 'published',
        featured: false,
        isNew: true,
        order: 5,
        sku: 'PVF-FS-002',
        details: {
          'Process': '100% Fresh Frozen Single Farm',
          'Microns': '73u Full Spectrum',
          'Profil Terpénique': 'Ail musqué, clémentine pressée, funk intense',
          'Texture': 'Sauce terpénique & micro-cristaux',
          'Conservation': 'Frigo (4°C - 8°C)',
        },
        createdAt: Date.now() - 20000,
        updatedAt: Date.now() - 20000,
      },
      {
        name: 'Peach Ozz 90u First Wash Jam',
        description: 'Premier passage cryogénique exclusif. Affiné en warm cure sous pression pour libérer une nappe terpénique translucide. Arôme inimitable de bonbon à la pêche et thé glacé floral.',
        price: 85,
        currency: '€',
        categoryId: categoryIds['FROZEN SIFT'] || '',
        categoryName: 'FROZEN SIFT',
        images: [
          'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
        stock: 'LOW_STOCK',
        status: 'published',
        featured: true,
        isNew: false,
        order: 6,
        sku: 'PVF-FS-003',
        details: {
          'Process': 'Cryo Sift First Wash & Warm Jam Curing',
          'Microns': '90u Strictly Isolated',
          'Profil Terpénique': 'Pêche blanche sucrée, fleur d\'oranger',
          'Texture': 'Jam limpide et ultra parfumé',
          'Conservation': 'Frigo (4°C - 8°C)',
        },
        createdAt: Date.now() - 25000,
        updatedAt: Date.now() - 25000,
      },

      // --- 2x STATIC ---
      {
        name: 'Wedding Cake x Gelato 33 2x Static 99%',
        description: 'Le summum de la purification statique. Double passage sous champ électrostatique de précision éliminant 99% des résidus foliaires. Têtes de trichomes translucides fondant instantanément en bulles dorées sans résidu.',
        price: 90,
        currency: '€',
        categoryId: categoryIds['2x STATIC'] || '',
        categoryName: '2x STATIC',
        images: [
          'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
        stock: 'AVAILABLE',
        status: 'published',
        featured: true,
        isNew: true,
        order: 7,
        sku: 'PVF-ST-001',
        details: {
          'Technologie': 'Double isolation statique 2x de précision',
          'Pureté': '99% têtes glandulaires isolées',
          'Melt': 'Full Melt 6 étoiles instantané',
          'Profil Terpénique': 'Gâteau vanillé onctueux, gelato crémeux gazeux',
          'Origine': 'Perk Vibes Farmz Reserve',
        },
        createdAt: Date.now() - 30000,
        updatedAt: Date.now() - 30000,
      },
      {
        name: 'Zkittlez 2x Static Terp Clean',
        description: 'Double purification statique sur génétique Zkittlez originale. Une pureté organoleptique absolue : chaque bouffée restitue le profil du fruit frais sans la moindre amertume végétale.',
        price: 95,
        currency: '€',
        categoryId: categoryIds['2x STATIC'] || '',
        categoryName: '2x STATIC',
        images: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
        stock: 'AVAILABLE',
        status: 'published',
        featured: true,
        isNew: true,
        order: 8,
        sku: 'PVF-ST-002',
        details: {
          'Technologie': 'Double passage électrostatique cryo',
          'Pureté': 'Têtes de trichomes translucides purifiées',
          'Melt': 'Bulle à la moindre flamme douce',
          'Profil Terpénique': 'Arc-en-ciel de fruits tropicaux et bonbon fruité',
          'Origine': 'Perk Vibes Farmz',
        },
        createdAt: Date.now() - 35000,
        updatedAt: Date.now() - 35000,
      },
      {
        name: 'RS11 (Rainbow Sherbert #11) 2x Static Reserve',
        description: 'Édition confidentielle 2x Static. La quintessence de la RS11 avec un profil terpénique de sherbert gazeux et notes de pinède citronnée. Très recherché par les passionnés.',
        price: 100,
        currency: '€',
        categoryId: categoryIds['2x STATIC'] || '',
        categoryName: '2x STATIC',
        images: [
          'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=1000&q=80',
        ],
        mainImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1000&q=80',
        stock: 'SOLD_OUT',
        status: 'published',
        featured: false,
        isNew: false,
        order: 9,
        sku: 'PVF-ST-003',
        details: {
          'Technologie': 'Double statique ultra select 2x',
          'Pureté': '99.5% têtes de résine pures',
          'Melt': 'Full Melt zéro résidu',
          'Profil Terpénique': 'Sherbert gazeux, agrumes exotiques, pinède',
          'Origine': 'Perk Vibes Farmz - Réserve privée',
        },
        createdAt: Date.now() - 40000,
        updatedAt: Date.now() - 40000,
      },
    ];

    for (const prod of productsData) {
      await addDoc(colProducts, {
        ...prod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Update Brand Settings to PERK VIBES FARMZ
    await setDoc(doc(db, SETTINGS_COLLECTION, BRAND_SETTINGS_DOC_ID), DEFAULT_BRAND_SETTINGS, { merge: true });

    console.log('✅ PERK VIBES FARMZ catalog successfully seeded with DRY SIFT, FROZEN SIFT and 2x STATIC!');
    return true;
  } catch (err) {
    console.error('Error seeding PERK VIBES FARMZ catalog:', err);
    return false;
  }
}

// Backward compatibility alias
export const seedCatalogIfEmpty = () => resetAndSeedPerkVibesFarmz(false);
