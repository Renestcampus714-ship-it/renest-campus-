import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface ImageUploadOutcome {
  url: string;
  source: 'firebase-storage' | 'compressed-fallback';
  warning?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 960;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not initialize image compressor canvas.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.72);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error(`"${file.name}" could not be decoded as an image.`));
    img.src = rawDataUrl;
  });
}

export function uploadToFirebaseStorage(
  userId: string,
  listingId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `listings/${userId}/${listingId}/${Date.now()}_${safeName}`);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    const timeoutHandle = window.setTimeout(() => {
      uploadTask.cancel();
      reject(
        new Error(
          'Firebase Storage upload timed out. Ensure Firebase Storage is initialized and storage.rules are deployed.'
        )
      );
    }, 15000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => {
        window.clearTimeout(timeoutHandle);
        reject(error);
      },
      async () => {
        window.clearTimeout(timeoutHandle);
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function uploadListingImageWithFallback(
  userId: string,
  listingId: string,
  file: File,
  allowFallback: boolean,
  onProgress?: (percent: number) => void
): Promise<ImageUploadOutcome> {
  try {
    const url = await uploadToFirebaseStorage(userId, listingId, file, onProgress);
    return { url, source: 'firebase-storage' };
  } catch (storageError) {
    const errMsg =
      storageError instanceof Error ? storageError.message : 'Firebase Storage upload unavailable.';
    if (!allowFallback) {
      throw new Error(
        `Firebase Storage upload failed (${errMsg}). Initialize Storage in Firebase Console or enable the clearly labelled compressed fallback option.`
      );
    }
    if (onProgress) onProgress(60);
    const compressed = await compressImageToDataUrl(file);
    if (compressed.length > 340000) {
      throw new Error(
        `"${file.name}" could not be compressed small enough for fallback storage. Use a smaller photo.`
      );
    }
    if (onProgress) onProgress(100);
    return {
      url: compressed,
      source: 'compressed-fallback',
      warning:
        'Firebase Storage is not yet active on the project; stored a compressed JPEG fallback in Firestore instead.',
    };
  }
}
