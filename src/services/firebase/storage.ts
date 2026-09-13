import { storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from './config';
import { ProfilePhoto } from '../../types';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface UploadProgressCallback {
  (progress: number, photoId: string): void;
}

/**
 * Uploads a profile photo to Firebase Storage under profiles/{profileId}/original/{filename}
 */
export async function uploadProfilePhoto(
  profileId: string,
  file: File,
  order: number = 0,
  isPrimary: boolean = false,
  onProgress?: (progress: number) => void
): Promise<ProfilePhoto> {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Format de fichier non supporté (${file.type}). Utilisez JPG, PNG ou WEBP.`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Le fichier est trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). La taille maximale est de ${MAX_FILE_SIZE_MB} Mo.`);
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `photo-${order + 1}-${timestamp}-${sanitizedName}`;
  const storagePath = `profiles/${profileId}/original/${filename}`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        profileId,
        uploadedAt: new Date().toISOString(),
      }
    });

    return new Promise<ProfilePhoto>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          reject(new Error(`Échec du téléversement vers Firebase Storage : ${error.message}`));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadUrl,
              storagePath,
              isPrimary,
              order,
            });
          } catch (err: any) {
            reject(new Error(`Impossible de récupérer l'URL publique de l'image : ${err.message}`));
          }
        }
      );
    });
  } catch (err: any) {
    console.error('Failed to initiate storage upload:', err);
    throw new Error(`Erreur d'initialisation du stockage : ${err.message}`);
  }
}

/**
 * Deletes a photo file from Firebase Storage
 */
export async function deleteProfilePhotoFromStorage(storagePath: string): Promise<void> {
  if (!storagePath) return;

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err: any) {
    // If file does not exist (404), it may have already been removed
    if (err.code === 'storage/object-not-found') {
      console.warn('Storage object already deleted or not found:', storagePath);
      return;
    }
    console.error('Error deleting from storage:', err);
    throw new Error(`Impossible de supprimer le fichier du stockage : ${err.message}`);
  }
}
