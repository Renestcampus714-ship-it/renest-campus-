import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { VALIDATION_LIMITS } from '../constants/marketplace';
import type { AccommodationType, UserProfile } from '../types/marketplace';
import { sanitizeString } from '../utils/marketplaceLogic';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface UpdateProfilePayload {
  fullName: string;
  collegeName: string;
  accommodationType: AccommodationType;
  phone?: string;
}

export async function updateUserProfile(
  uid: string,
  payload: UpdateProfilePayload
): Promise<void> {
  const path = `users/${uid}`;
  const cleanName = sanitizeString(payload.fullName, VALIDATION_LIMITS.fullNameMax);
  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await updateProfile(auth.currentUser, { displayName: cleanName });
    }
    await updateDoc(doc(db, 'users', uid), {
      fullName: cleanName,
      collegeName: sanitizeString(payload.collegeName, VALIDATION_LIMITS.collegeNameMax),
      accommodationType: payload.accommodationType,
      phone: sanitizeString(payload.phone || '', VALIDATION_LIMITS.phoneMax),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleFavouriteListing(
  uid: string,
  listingId: string,
  currentFavourites: readonly string[]
): Promise<string[]> {
  const exists = currentFavourites.includes(listingId);
  const next = exists
    ? currentFavourites.filter((id) => id !== listingId)
    : [listingId, ...currentFavourites].slice(0, VALIDATION_LIMITS.maxFavourites);

  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      favouriteIds: next,
      updatedAt: serverTimestamp(),
    });
    return next;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordRecentlyViewed(
  uid: string,
  listingId: string,
  currentViewed: readonly string[]
): Promise<void> {
  if (currentViewed[0] === listingId) return;
  const next = [listingId, ...currentViewed.filter((id) => id !== listingId)].slice(
    0,
    VALIDATION_LIMITS.maxRecentlyViewed
  );

  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      recentlyViewedIds: next,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
