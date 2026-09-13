import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment
} from './config';
import { Profile, ProfilePhoto, ProfileStatus, FilterOptions, DashboardStats, ShopSubmission } from '../../types';
import { deleteProfilePhotoFromStorage } from './storage';

const PROFILES_COLLECTION = 'profiles';

/**
 * Transforms Firestore document to Profile object
 */
function docToProfile(id: string, data: any): Profile {
  return {
    id,
    name: data.name || '',
    username: data.username || '',
    description: data.description || '',
    country: data.country || 'France',
    city: data.city || '',
    region: data.region || (data.city ? `${data.city} IDF` : 'France'),
    secteur: data.secteur || '',
    category: data.category || 'Général',
    photos: Array.isArray(data.photos) ? data.photos : [],
    avatarUrl: data.avatarUrl || (data.photos?.[0]?.url || ''),
    bannerUrl: data.bannerUrl || (data.photos?.[1]?.url || data.photos?.[0]?.url || ''),
    featured: Boolean(data.featured),
    status: (data.status as ProfileStatus) || 'draft',
    votes: typeof data.votes === 'number' ? data.votes : 0,
    views: typeof data.views === 'number' ? data.views : 0,
    badge: data.badge || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedAt: data.publishedAt || null,
    archivedAt: data.archivedAt || null,
    createdBy: data.createdBy || '',
    updatedBy: data.updatedBy || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    serviceModes: data.serviceModes || {
      clickAndCollect: true,
      livraisonLocale: true,
      envoiPostal: true,
    },
    socialLinks: data.socialLinks || {},
    customFields: Array.isArray(data.customFields) ? data.customFields : [],
  };
}

/**
 * PUBLIC: Subscribe to ONLY published profiles in real-time
 * Strictest requirement: users only ever see status === 'published'
 * Sorted by votes (leaderboard) & featured
 */
export function subscribePublishedProfiles(
  filters: FilterOptions,
  callback: (profiles: Profile[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, PROFILES_COLLECTION);
  // Base query: strictly where status == 'published'
  const q = query(colRef, where('status', '==', 'published'));

  return onSnapshot(
    q,
    (snapshot) => {
      let items: Profile[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docToProfile(docSnap.id, docSnap.data()));
      });

      // Sort primarily by votes (Leaderboard), then featured, then creation
      items.sort((a, b) => {
        const votesA = a.votes || 0;
        const votesB = b.votes || 0;
        if (votesB !== votesA) return votesB - votesA;
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        const timeA = a.publishedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.publishedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      // Apply client-side filters (Search term, Category, Region/Country, City, Featured)
      if (filters.search && filters.search.trim() !== '') {
        const searchLower = filters.search.toLowerCase().trim();
        items = items.filter((p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.username.toLowerCase().includes(searchLower) ||
          p.city.toLowerCase().includes(searchLower) ||
          (p.region && p.region.toLowerCase().includes(searchLower)) ||
          p.country.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)))
        );
      }

      if (filters.category && filters.category !== 'Tous' && filters.category !== 'all') {
        items = items.filter((p) => p.category.toLowerCase() === filters.category!.toLowerCase());
      }

      if (filters.region && filters.region !== 'all' && filters.region !== 'Tous') {
        items = items.filter((p) => 
          (p.region && p.region.toLowerCase().includes(filters.region!.toLowerCase())) ||
          (p.city && p.city.toLowerCase().includes(filters.region!.toLowerCase()))
        );
      }

      if (filters.country && filters.country !== 'all') {
        items = items.filter((p) => p.country.toLowerCase() === filters.country!.toLowerCase());
      }

      if (filters.city && filters.city !== 'all') {
        items = items.filter((p) => p.city.toLowerCase() === filters.city!.toLowerCase());
      }

      if (filters.featuredOnly) {
        items = items.filter((p) => p.featured);
      }

      callback(items);
    },
    (err) => {
      console.error('Error listening to published profiles:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * PUBLIC: Vote for a boutique (live vote increment)
 */
export async function voteForProfile(id: string): Promise<void> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, id);
    await updateDoc(docRef, {
      votes: increment(1),
    });
  } catch (err) {
    console.error('Error voting for profile:', err);
    throw err;
  }
}

/**
 * PUBLIC: Submit new boutique application (Inscription)
 * Saved with status = 'draft' so admin must review & validate before live publication
 */
export async function submitBoutiqueApplication(submission: ShopSubmission): Promise<string> {
  const colRef = collection(db, PROFILES_COLLECTION);
  const cleanTg = (submission.telegram || '').trim().replace(/^@/, '');
  const cleanBot = (submission.telegramBot || '').trim().replace(/^@/, '');
  const cleanInsta = (submission.instagram || '').trim().replace(/^@/, '');
  const cleanPotato = (submission.potato || '').trim();
  const cleanSnap = (submission.snapchat || '').trim().replace(/^@/, '');

  const photos: ProfilePhoto[] = [];
  if (submission.photoUrl) {
    photos.push({
      url: submission.photoUrl.trim(),
      storagePath: '',
      isPrimary: true,
      order: 0,
      caption: 'Logo / Photo de Profil',
    });
  }
  if (submission.bannerUrl) {
    photos.push({
      url: submission.bannerUrl.trim(),
      storagePath: '',
      isPrimary: !submission.photoUrl,
      order: 1,
      caption: "Photo d'Arrière-Plan / Bannière",
    });
  }

  // Construct tags based on service modes and location
  const tags: string[] = ['Candidature'];
  if (submission.serviceModes.clickAndCollect) tags.push('Click & Collect');
  if (submission.serviceModes.livraisonLocale) tags.push('Livraison Locale');
  if (submission.serviceModes.envoiPostal) tags.push('Envoi Postal');
  if (submission.secteur) tags.push(submission.secteur);

  const country = (submission.country || 'France').trim();

  const newDoc = await addDoc(colRef, {
    name: submission.name.trim(),
    username: cleanTg || cleanBot || submission.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    description: (submission.description || '').trim(),
    country,
    city: (submission.city || '').trim(),
    region: (submission.secteur || submission.city || country).trim(),
    secteur: (submission.secteur || '').trim(),
    category: 'Boutique Partenaire',
    photos,
    avatarUrl: submission.photoUrl?.trim() || '',
    bannerUrl: submission.bannerUrl?.trim() || '',
    featured: false,
    status: 'draft', // Strictly DRAFT until Admin approval
    votes: 0,
    views: 0,
    badge: 'Candidature PERK VIBES',
    serviceModes: submission.serviceModes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: null,
    archivedAt: null,
    createdBy: 'public_submission',
    updatedBy: 'public_submission',
    tags,
    socialLinks: {
      telegram: cleanTg ? (cleanTg.startsWith('http') ? cleanTg : `https://t.me/${cleanTg}`) : '',
      telegramBot: cleanBot ? (cleanBot.startsWith('http') ? cleanBot : `https://t.me/${cleanBot}`) : '',
      instagram: cleanInsta ? (cleanInsta.startsWith('http') ? cleanInsta : `https://instagram.com/${cleanInsta}`) : '',
      potato: cleanPotato ? (cleanPotato.startsWith('http') ? cleanPotato : `https://${cleanPotato}`) : '',
      snapchat: cleanSnap ? (cleanSnap.startsWith('http') ? cleanSnap : `https://snapchat.com/add/${cleanSnap}`) : '',
    },
    customFields: [
      { label: 'Statut Demande', value: 'En attente de validation admin' },
      { label: 'Secteur', value: submission.secteur || 'Non renseigné' },
      { label: 'Click & Collect', value: submission.serviceModes.clickAndCollect ? '✅ Oui' : '❌ Non' },
      { label: 'Livraison Locale', value: submission.serviceModes.livraisonLocale ? '✅ Oui' : '❌ Non' },
      { label: 'Envoi Postal suivi', value: submission.serviceModes.envoiPostal ? '✅ Oui' : '❌ Non' },
    ]
  });

  return newDoc.id;
}

/**
 * PUBLIC: Get single profile by ID. Returns null if not published or not found.
 */
export async function getPublicProfileById(id: string): Promise<Profile | null> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const profile = docToProfile(snap.id, snap.data());
    if (profile.status !== 'published') {
      return null;
    }
    return profile;
  } catch (err) {
    console.error('Error fetching profile by ID:', err);
    return null;
  }
}

/**
 * ADMIN: Get single profile by ID (any status)
 */
export async function getAdminProfileById(id: string): Promise<Profile | null> {
  try {
    const docRef = doc(db, PROFILES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return docToProfile(snap.id, snap.data());
  } catch (err) {
    console.error('Error fetching admin profile by ID:', err);
    return null;
  }
}

/**
 * ADMIN: Subscribe to all profiles (for management table, drafts, archived, stats)
 */
export function subscribeAdminProfiles(
  callback: (profiles: Profile[], stats: DashboardStats) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, PROFILES_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Profile[] = [];
      let publishedCount = 0;
      let draftsCount = 0;
      let archivedCount = 0;
      let totalVotesCount = 0;

      snapshot.forEach((docSnap) => {
        const prof = docToProfile(docSnap.id, docSnap.data());
        items.push(prof);

        if (prof.status === 'published') {
          publishedCount++;
          totalVotesCount += (prof.votes || 0);
        } else if (prof.status === 'draft') {
          draftsCount++;
        } else if (prof.status === 'archived') {
          archivedCount++;
        }
      });

      // Sort by newest created
      items.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      const stats: DashboardStats = {
        total: items.length,
        published: publishedCount,
        drafts: draftsCount,
        archived: archivedCount,
        totalVotes: totalVotesCount,
      };

      callback(items, stats);
    },
    (err) => {
      console.error('Error subscribing to admin profiles:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * ADMIN: Create a new profile.
 * STRICT RULE: Always defaults to status = 'draft'.
 * Manual validation is strictly required before publication.
 */
export async function createProfile(
  data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'publishedAt' | 'archivedAt'>,
  userUid?: string
): Promise<string> {
  const colRef = collection(db, PROFILES_COLLECTION);
  
  const formattedPhotos = (data.photos || []).map((p, idx) => ({
    ...p,
    order: idx,
    isPrimary: idx === 0 ? true : Boolean(p.isPrimary),
  }));

  const newDoc = await addDoc(colRef, {
    name: data.name.trim(),
    username: data.username.trim().replace(/^@/, ''),
    description: data.description.trim(),
    country: data.country.trim() || 'France',
    city: data.city.trim(),
    region: data.region?.trim() || (data.city ? `${data.city} IDF` : 'France'),
    secteur: data.secteur?.trim() || '',
    category: data.category.trim() || 'Général',
    photos: formattedPhotos,
    featured: Boolean(data.featured),
    status: 'draft', // Strictly DRAFT upon creation
    votes: typeof data.votes === 'number' ? data.votes : 0,
    views: 0,
    badge: data.badge || '',
    serviceModes: data.serviceModes || {
      clickAndCollect: true,
      livraisonLocale: true,
      envoiPostal: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt: null,
    archivedAt: null,
    createdBy: userUid || 'admin',
    updatedBy: userUid || 'admin',
    tags: data.tags || [],
    socialLinks: data.socialLinks || {},
    customFields: data.customFields || [],
  });

  return newDoc.id;
}

/**
 * ADMIN: Update existing profile
 */
export async function updateProfile(
  id: string,
  data: Partial<Profile>,
  userUid?: string
): Promise<void> {
  const docRef = doc(db, PROFILES_COLLECTION, id);

  const payload: any = {
    updatedAt: serverTimestamp(),
    updatedBy: userUid || 'admin',
  };

  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.username !== undefined) payload.username = data.username.trim().replace(/^@/, '');
  if (data.description !== undefined) payload.description = data.description.trim();
  if (data.country !== undefined) payload.country = data.country.trim();
  if (data.city !== undefined) payload.city = data.city.trim();
  if (data.region !== undefined) payload.region = data.region.trim();
  if (data.secteur !== undefined) payload.secteur = data.secteur.trim();
  if (data.category !== undefined) payload.category = data.category.trim();
  if (data.photos !== undefined) payload.photos = data.photos;
  if (data.featured !== undefined) payload.featured = data.featured;
  if (data.votes !== undefined) payload.votes = data.votes;
  if (data.badge !== undefined) payload.badge = data.badge;
  if (data.serviceModes !== undefined) payload.serviceModes = data.serviceModes;
  if (data.tags !== undefined) payload.tags = data.tags;
  if (data.socialLinks !== undefined) payload.socialLinks = data.socialLinks;
  if (data.customFields !== undefined) payload.customFields = data.customFields;

  await updateDoc(docRef, payload);
}

/**
 * ADMIN: Manually publish a profile (Manual validation requirement)
 */
export async function publishProfile(id: string, userUid?: string): Promise<void> {
  const docRef = doc(db, PROFILES_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'published',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userUid || 'admin',
  });
}

/**
 * ADMIN: Unpublish a profile (returns to draft)
 */
export async function unpublishProfile(id: string, userUid?: string): Promise<void> {
  const docRef = doc(db, PROFILES_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'draft',
    updatedAt: serverTimestamp(),
    updatedBy: userUid || 'admin',
  });
}

/**
 * ADMIN: Archive a profile (soft delete)
 */
export async function archiveProfile(id: string, userUid?: string): Promise<void> {
  const docRef = doc(db, PROFILES_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'archived',
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userUid || 'admin',
  });
}

/**
 * ADMIN: Restore an archived profile to draft
 */
export async function restoreProfile(id: string, userUid?: string): Promise<void> {
  const docRef = doc(db, PROFILES_COLLECTION, id);
  await updateDoc(docRef, {
    status: 'draft',
    archivedAt: null,
    updatedAt: serverTimestamp(),
    updatedBy: userUid || 'admin',
  });
}

/**
 * ADMIN: Permanently delete a profile and its images from storage
 */
export async function deleteProfilePermanently(id: string, photos?: ProfilePhoto[]): Promise<void> {
  const docRef = doc(db, PROFILES_COLLECTION, id);
  await deleteDoc(docRef);

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      if (photo.storagePath) {
        try {
          await deleteProfilePhotoFromStorage(photo.storagePath);
        } catch (err) {
          console.warn('Failed to delete storage file:', photo.storagePath, err);
        }
      }
    }
  }
}

/**
 * ADMIN: Purge all demo / mock boutiques permanently
 */
export async function purgeAllDemoProfiles(): Promise<number> {
  const colRef = collection(db, PROFILES_COLLECTION);
  const snap = await getDocs(colRef);
  let deletedCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    // Delete any demo profile, system seeded profile, or sample shop
    if (
      data.createdBy === 'system_demo' ||
      data.badge?.includes('Communauté') ||
      data.badge?.includes('Top Vendeur') ||
      data.name === 'F2N Elite Store' ||
      data.name === 'Luffy 31 Shop' ||
      data.name === 'Lamio Prestige 69' ||
      data.name === 'Phocéa Market 13' ||
      data.name === 'Nord Express 59' ||
      data.name === 'Bordeaux Direct 33'
    ) {
      await deleteDoc(doc(db, PROFILES_COLLECTION, docSnap.id));
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * ADMIN: Purge absolutely all profiles (clean database wipe)
 */
export async function purgeAllProfiles(): Promise<number> {
  const colRef = collection(db, PROFILES_COLLECTION);
  const snap = await getDocs(colRef);
  let count = 0;
  for (const docSnap of snap.docs) {
    await deleteDoc(doc(db, PROFILES_COLLECTION, docSnap.id));
    count++;
  }
  return count;
}


/**
 * Helper to seed high quality PERK VIBES FARMZ community shops
 */
export async function seedDemonstrationProfiles(): Promise<void> {
  const sampleProfiles = [
    {
      name: 'PERK VIBES HQ',
      username: 'perkvibes_hq',
      description: 'Menu officiel certifié Perk Vibes Farmz. Top-shelf 2x Static, Frozen Sift et Dry Sift cures d\'exception.',
      country: 'France',
      city: 'Paris',
      region: 'Paris IDF',
      category: '2x STATIC',
      featured: true,
      votes: 128,
      badge: 'N°1 Farmz',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
          storagePath: 'samples/pvf-1.jpg',
          isPrimary: true,
          order: 0,
        }
      ],
      tags: ['Top 1', 'Certifié PVF', 'Static', 'Frozen'],
      socialLinks: {
        telegram: 'https://t.me/F2nOfficiel_Bot',
        website: 'https://t.me/F2nOfficiel_Bot',
      },
      customFields: [
        { label: 'Filtration', value: 'Double Static 73u' },
        { label: 'Terpènes', value: 'Profil Connoisseur' }
      ]
    },
    {
      name: 'Frozen Lab Toulouse',
      username: 'frozenlab_31',
      description: 'Spécialiste Frozen Sift et trichomes préservés à froid pour le Sud-Ouest.',
      country: 'France',
      city: 'Toulouse',
      region: '31 Haute-Garonne',
      category: 'FROZEN SIFT',
      featured: true,
      votes: 94,
      badge: 'Top Frozen',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80',
          storagePath: 'samples/frozen-1.jpg',
          isPrimary: true,
          order: 0,
        }
      ],
      tags: ['Toulouse', 'Frozen Sift', 'Terpènes'],
      socialLinks: {
        telegram: 'https://t.me/F2nOfficiel_Bot',
      },
      customFields: [
        { label: 'Secteur', value: 'Haute-Garonne (31)' },
        { label: 'Curing', value: 'Cold cure contrôlé' }
      ]
    },
    {
      name: 'Dry Sift Lyon Reserve',
      username: 'dry_lyon_reserve',
      description: 'Sélection Dry Sift ultra filtré 90u/120u. Arômes puissants et texture fondante garantie.',
      country: 'France',
      city: 'Lyon',
      region: '69 Rhône',
      category: 'DRY SIFT',
      featured: true,
      votes: 87,
      badge: 'Podium Dry',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
          storagePath: 'samples/dry-1.jpg',
          isPrimary: true,
          order: 0,
        }
      ],
      tags: ['Lyon', 'Dry Sift', '90u', 'Top Shelf'],
      socialLinks: {
        telegram: 'https://t.me/F2nOfficiel_Bot',
      },
      customFields: [
        { label: 'Livraison', value: 'France & Europe' }
      ]
    }
  ];

  for (const sample of sampleProfiles) {
    await addDoc(collection(db, PROFILES_COLLECTION), {
      ...sample,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      archivedAt: null,
      createdBy: 'system_demo',
      updatedBy: 'system_demo',
    });
  }
}
