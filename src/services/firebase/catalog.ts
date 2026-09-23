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
import { db, storage, app } from './config';
import { uploadMediaToFirestore } from './mediaStore';
import { Product, Category, BrandSettings, ProductStockStatus, ProductPublishStatus } from '../../types';
import { TELEGRAM_BOT_CONFIG } from '../telegram/telegramBotConfig';

export const PRODUCTS_COLLECTION = 'products';
export const CATEGORIES_COLLECTION = 'categories';
export const SETTINGS_COLLECTION = 'brandSettings';
export const BRAND_SETTINGS_DOC_ID = 'main';

// Default TRICOME LAB Brand Settings
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: 'TRICOME LAB',
  tagline: 'Connoisseur Farm & Top-Shelf Extractions',
  description: 'Sélection exclusive de filtrations d\'exception : Dry Sift de précision, Frozen Sift cryogénique et 2x Static 99% trichome heads.',
  profileImage: '',
  coverImage: '',
  currency: '€',
  heroCtaText: 'Explorer le Menu',
  badgeText: 'Collection 2026',
  contactLinks: {
    telegram: 'https://t.me/F2nOfficiel_Bot',
    botUsername: TELEGRAM_BOT_CONFIG.botUsername || 'F2nOfficiel_Bot',
    botUrl: TELEGRAM_BOT_CONFIG.botUrl || 'https://t.me/F2nOfficiel_Bot',
    whatsapp: '',
    instagram: '@tricomelab',
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
        // If the stored name is still an old one, update to TRICOME LAB
        const isOldName = !data.brandName || 
          data.brandName === 'F2N' || 
          data.brandName === 'F2N PARIS' || 
          data.brandName === 'PERK VIBES FARMZ' || 
          data.brandName === 'TRICHOME MONTANE' || 
          data.brandName === 'Cartel Del Farmez' ||
          data.brandName.includes('Cartel');

        if (isOldName) {
          updateDoc(docRef, {
            brandName: 'TRICOME LAB',
            updatedAt: serverTimestamp(),
          }).catch((err) => console.warn('Could not auto-migrate brandName:', err));
        }
        callback({
          ...DEFAULT_BRAND_SETTINGS,
          ...data,
          brandName: isOldName ? 'TRICOME LAB' : data.brandName,
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

// Cache for instant product sheet opening
const productsMemoryCache = new Map<string, Product>();

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
        const item: Product = {
          id: docSnap.id,
          ...(docSnap.data() as Omit<Product, 'id'>),
        };
        list.push(item);
        // Pre-populate memory cache
        productsMemoryCache.set(item.id, item);
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
  // Check memory cache first for 0ms response
  if (productsMemoryCache.has(id)) {
    return productsMemoryCache.get(id)!;
  }
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const prod = { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
    productsMemoryCache.set(id, prod);
    return prod;
  } catch (err) {
    console.error(`Error getting product ${id}:`, err);
    return null;
  }
}

// Clean helper to remove any undefined fields before sending to Firestore
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      clean[key] = cleanFirestoreData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export async function createProduct(prod: Omit<Product, 'id'>): Promise<string> {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const data = cleanFirestoreData({
    ...prod,
    createdAt: prod.createdAt || Date.now(),
    updatedAt: Date.now(),
  });
  const docRef = await addDoc(colRef, data);
  return docRef.id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const data = cleanFirestoreData({
    ...updates,
    updatedAt: Date.now(),
  });
  await updateDoc(docRef, data);
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
// MEDIA UPLOADER (PHOTOS & VIDEOS TO FIREBASE STORAGE)
// ==========================================

/**
 * Uploads an image or video file directly to Firebase Storage and returns
 * the persistent Firebase HTTPS download URL (not a local blob or data URL).
 */
export async function uploadCatalogMedia(
  file: File,
  folder: string = 'catalog',
  onProgress?: (progress: number) => void,
  timeoutMs: number = 30000
): Promise<string> {
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `${folder}/${timestamp}_${cleanFileName}`;

  // Set explicit content type so Firebase Storage serves it properly
  const isVideo = file.type?.startsWith('video/') || /\.(mp4|mov|webm|avi|m4v)$/i.test(file.name);
  const contentType = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');

  const metadata = {
    contentType,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  };

  const executeUploadOnStorage = (storageInstance: any): Promise<string> => {
    const storageRef = ref(storageInstance, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try {
            uploadTask.cancel();
          } catch {
            // ignore
          }
          const timeoutErr: any = new Error('Délai d\'attente dépassé lors de l\'envoi vers Firebase Storage.');
          timeoutErr.code = 'storage/timeout';
          reject(timeoutErr);
        }
      }, timeoutMs);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (finished) return;
          const total = snapshot.totalBytes || 1;
          const progress = Math.min(100, Math.round((snapshot.bytesTransferred / total) * 100));
          if (onProgress) onProgress(progress);
        },
        (error: any) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          console.warn('Firebase Storage upload error:', error);
          reject(error);
        },
        async () => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Fichier sauvegardé sur Firebase Storage avec succès:', downloadUrl);
            resolve(downloadUrl);
          } catch (e: any) {
            console.warn('Impossible de récupérer l\'URL de téléchargement Firebase:', e);
            reject(e);
          }
        }
      );
    });
  };

  try {
    return await executeUploadOnStorage(storage);
  } catch (err: any) {
    // If bucket not found (404), try fallback appspot.com bucket
    const is404 = err?.status_ === 404 || err?.code === 'storage/bucket-not-found' || (err?.code === 'storage/unknown' && err?.status_ === 404);
    if (is404) {
      try {
        const fallbackStorage = (await import('firebase/storage')).getStorage(app, 'gen-lang-client-0263232160.appspot.com');
        return await executeUploadOnStorage(fallbackStorage);
      } catch (fallbackErr: any) {
        console.warn('Fallback appspot.com bucket also not ready:', fallbackErr);
      }
    }

    let friendlyMessage = err?.message || 'Erreur inconnue Firebase Storage';
    if (is404) {
      friendlyMessage = 'Firebase Storage n\'est pas encore activé sur votre console Firebase (Erreur 404 : Bucket introuvable). Rendez-vous sur console.firebase.google.com > Stockage / Storage et cliquez sur "Commencer".';
    } else if (err?.code === 'storage/unauthorized') {
      friendlyMessage = 'Accès refusé par les règles Firebase Storage. Activez les règles d\'écriture (storage.rules) sur Firebase Console.';
    }

    const enhancedErr: any = new Error(friendlyMessage);
    enhancedErr.originalError = err;
    enhancedErr.isStorageNotActivated = is404;
    enhancedErr.code = err?.code || 'storage/error';
    throw enhancedErr;
  }
}

export async function uploadCatalogImage(
  file: File,
  folderOrProgress?: string | ((progress: number) => void),
  onProgress?: (progress: number) => void
): Promise<string> {
  const folder = typeof folderOrProgress === 'string' ? folderOrProgress : 'catalog/images';
  const progressCb = typeof folderOrProgress === 'function' ? folderOrProgress : onProgress;

  if (progressCb) progressCb(25);

  // 1. Immediately create optimized lightweight local Data URL (~30KB-50KB, fits in Firestore easily)
  const localHdDataUrl = await compressImageToDataURL(file, 720, 0.68);
  if (progressCb) progressCb(60);

  // 2. Attempt Firebase Storage with a FAST 1.5-second timeout
  try {
    const storageUrl = await uploadCatalogMedia(file, folder, progressCb, 1500);
    if (progressCb) progressCb(100);
    return storageUrl;
  } catch (storageErr) {
    // If Firebase Storage is unavailable or timed out, smoothly fallback to lightweight data URL
    if (progressCb) progressCb(100);
    return localHdDataUrl;
  }
}

export async function uploadCatalogVideo(
  file: File,
  folderOrProgress?: string | ((progress: number) => void),
  onProgress?: (progress: number) => void
): Promise<string> {
  const progressCb = typeof folderOrProgress === 'function' ? folderOrProgress : onProgress;
  if (progressCb) progressCb(10);
  
  // Directly save video to Firestore in dedicated media_items chunk collection
  return await uploadMediaToFirestore(file, progressCb);
}

export async function compressImageToDataURL(file: File, maxWidth: number = 720, quality: number = 0.68): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = maxWidth;
        const MAX_HEIGHT = maxWidth;
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

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
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

export const CANONICAL_CATEGORIES = [
  { name: '2X STATIC', slug: '2x-static', order: 1, description: 'Double purification électrostatique ultra pure' },
  { name: 'WPFF', slug: 'wpff', order: 2, description: 'Whole Plant Fresh Frozen Live Rosin' },
  { name: 'DRY SIFT', slug: 'dry-sift', order: 3, description: 'Dry Sift traditionnel de précision & tamisage fin' },
  { name: 'FROZEN SIFT', slug: 'frozen-sift', order: 4, description: 'Frozen Sift extractions cryogéniques' },
];

export function normalizeCategoryName(raw: string): string | null {
  const upper = raw.toUpperCase().trim();
  if (upper.includes('STATIC') || upper === '2X STATIC') return '2X STATIC';
  if (upper.includes('WPFF') || upper.includes('WPPF')) return 'WPFF';
  if (upper.includes('DRY SIFT') || upper === 'DRY') return 'DRY SIFT';
  if (upper.includes('FROZEN SIFT') || upper === 'FROZEN') return 'FROZEN SIFT';
  return null;
}

/**
 * Ensures ONLY the 4 canonical categories (2X STATIC, WPFF, DRY SIFT, FROZEN SIFT) exist without duplicates.
 * Removes old "Dry", "Frozen", clothing or other obsolete categories.
 */
export async function ensureCanonicalCategories(): Promise<void> {
  try {
    const colCategories = collection(db, CATEGORIES_COLLECTION);
    const catsSnap = await getDocs(colCategories);

    const existingByName = new Map<string, string>();
    const toDelete: string[] = [];

    catsSnap.forEach((docSnap) => {
      const data = docSnap.data() as Category;
      const rawName = (data.name || '').trim();
      const norm = normalizeCategoryName(rawName);

      // If it doesn't match the 4 canonical names, or is already present, delete it
      if (!norm) {
        toDelete.push(docSnap.id);
        return;
      }

      if (existingByName.has(norm)) {
        toDelete.push(docSnap.id);
      } else {
        existingByName.set(norm, docSnap.id);
        // If the document has an old name like 'Dry' or 'Frozen', update it to the exact canonical name
        if (data.name !== norm) {
          updateDoc(doc(db, CATEGORIES_COLLECTION, docSnap.id), {
            name: norm,
            updatedAt: serverTimestamp(),
          }).catch(console.warn);
        }
      }
    });

    for (const id of toDelete) {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    }

    for (const cat of CANONICAL_CATEGORIES) {
      if (!existingByName.has(cat.name)) {
        await addDoc(colCategories, {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          order: cat.order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.error('Error ensuring canonical categories:', err);
  }
}

export async function resetAndSeedPerkVibesFarmz(force: boolean = false): Promise<boolean> {
  try {
    const colProducts = collection(db, PRODUCTS_COLLECTION);
    const colCategories = collection(db, CATEGORIES_COLLECTION);

    // Ensure categories are clean
    await ensureCanonicalCategories();

    // If force or first load, purge all products so catalog is completely empty
    if (force) {
      await deleteAllProducts();
    }

    await setDoc(doc(db, SETTINGS_COLLECTION, BRAND_SETTINGS_DOC_ID), DEFAULT_BRAND_SETTINGS, { merge: true });
    return true;
  } catch (err) {
    console.error('Error resetAndSeedPerkVibesFarmz:', err);
    return false;
  }
}

// Backward compatibility
export const seedCatalogIfEmpty = () => ensureCanonicalCategories();

/**
 * One-time purge of demo products - safe guard: never executes if already executed,
 * and only deletes mock/legacy demo clothing items, never touching newly added products
 */
export async function purgeAllMockProductsOnce(): Promise<void> {
  const PURGED_KEY = 'pvf_mock_products_purged_final_v2';
  if (typeof window !== 'undefined' && localStorage.getItem(PURGED_KEY)) return;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PURGED_KEY, 'true');
    }
  } catch (err) {
    console.warn('Could not auto purge demo products:', err);
  }
}

