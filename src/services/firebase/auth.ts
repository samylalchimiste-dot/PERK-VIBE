import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  FirebaseUser
} from './config';
import { AdminUser } from '../../types';

/**
 * Checks if a given UID has an active admin record in Firestore
 */
export async function getAdminProfile(uid: string): Promise<AdminUser | null> {
  try {
    const adminDocRef = doc(db, 'admins', uid);
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        email: data.email || null,
        role: data.role || 'admin',
        active: data.active !== false,
        displayName: data.displayName || '',
        createdAt: data.createdAt,
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching admin record:', err);
    return null;
  }
}

/**
 * Creates or updates an admin document in Firestore
 */
export async function createAdminRecord(uid: string, email: string, role: 'owner' | 'admin' = 'admin', displayName?: string): Promise<AdminUser> {
  const adminDocRef = doc(db, 'admins', uid);
  const adminData = {
    uid,
    email,
    role,
    active: true,
    displayName: displayName || email.split('@')[0],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(adminDocRef, adminData, { merge: true });

  return {
    uid,
    email,
    role,
    active: true,
    displayName: displayName || email.split('@')[0],
  };
}

/**
 * Log in admin with email & password
 */
export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    // Check if admin document exists in Firestore
    let adminRecord = await getAdminProfile(user.uid);

    // If first time or owner email, ensure admin document is created
    if (!adminRecord) {
      adminRecord = await createAdminRecord(user.uid, user.email || email, 'owner');
    }

    if (!adminRecord.active) {
      await signOut(auth);
      throw new Error('Ce compte administrateur est désactivé.');
    }

    return adminRecord;
  } catch (err: any) {
    console.error('Login error:', err);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      throw new Error('Identifiants administrateur incorrects.');
    } else if (err.code === 'auth/too-many-requests') {
      throw new Error('Trop de tentatives infructueuses. Veuillez patienter.');
    }
    throw new Error(err.message || 'Erreur lors de la connexion.');
  }
}

/**
 * Register a new admin account
 */
export async function registerAdmin(email: string, password: string, displayName?: string): Promise<AdminUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;
    const adminRecord = await createAdminRecord(user.uid, user.email || email, 'admin', displayName);
    return adminRecord;
  } catch (err: any) {
    console.error('Register error:', err);
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('Un compte existe déjà avec cette adresse email.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    }
    throw new Error(err.message || 'Erreur lors de la création du compte.');
  }
}

/**
 * Logout admin
 */
export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to auth state changes and verify admin status
 */
export function subscribeAuthState(callback: (user: AdminUser | null, loading: boolean) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null, false);
      return;
    }

    try {
      const adminRecord = await getAdminProfile(firebaseUser.uid);
      if (adminRecord && adminRecord.active) {
        callback(adminRecord, false);
      } else if (firebaseUser.email) {
        // Auto-provision if valid email session
        const created = await createAdminRecord(firebaseUser.uid, firebaseUser.email, 'admin');
        callback(created, false);
      } else {
        callback(null, false);
      }
    } catch (err) {
      console.error('Auth state resolution error:', err);
      callback(null, false);
    }
  });
}
