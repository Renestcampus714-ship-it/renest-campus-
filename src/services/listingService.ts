import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { VALIDATION_LIMITS } from '../constants/marketplace';
import type {
  AvailabilityStatus,
  ItemCondition,
  Listing,
  ListingStatus,
  MarketplaceCategory,
  UserProfile,
} from '../types/marketplace';
import { sanitizeString } from '../utils/marketplaceLogic';

export function subscribeActiveListings(
  onData: (listings: Listing[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'listings';
  const q = query(
    collection(db, path),
    where('listingStatus', '==', 'Active'),
    orderBy('createdAt', 'desc'),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Listing);
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeSellerListings(
  sellerId: string,
  onData: (listings: Listing[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'listings';
  const q = query(
    collection(db, path),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc'),
    limit(60)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Listing);
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchListingById(listingId: string): Promise<Listing | null> {
  const path = `listings/${listingId}`;
  try {
    const snap = await getDoc(doc(db, 'listings', listingId));
    return snap.exists() ? (snap.data() as Listing) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchListingsByIds(ids: readonly string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const results: Listing[] = [];
  for (const chunk of chunks) {
    try {
      const q = query(
        collection(db, 'listings'),
        where(documentId(), 'in', chunk),
        where('listingStatus', '==', 'Active')
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        results.push(docSnap.data() as Listing);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'listings');
    }
  }

  const orderMap = new Map(ids.map((id, index) => [id, index]));
  return results.sort(
    (a, b) => (orderMap.get(a.listingId) ?? 999) - (orderMap.get(b.listingId) ?? 999)
  );
}

export interface CreateListingPayload {
  listingId?: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  price: number;
  condition: ItemCondition;
  location: string;
  images: string[];
}

export function generateNewListingId(): string {
  return doc(collection(db, 'listings')).id;
}

export async function createListing(
  payload: CreateListingPayload,
  seller: UserProfile
): Promise<string> {
  const listingId = payload.listingId || generateNewListingId();
  const path = `listings/${listingId}`;
  const docRef = doc(db, 'listings', listingId);

  const data = {
    listingId,
    sellerId: seller.uid,
    sellerName: sanitizeString(seller.fullName, VALIDATION_LIMITS.fullNameMax),
    sellerCollege: sanitizeString(seller.collegeName, VALIDATION_LIMITS.collegeNameMax),
    sellerAccountStatus: seller.accountStatus,
    title: sanitizeString(payload.title, VALIDATION_LIMITS.titleMax),
    description: sanitizeString(payload.description, VALIDATION_LIMITS.descriptionMax),
    category: payload.category,
    price: Number(payload.price),
    condition: payload.condition,
    images: payload.images.slice(0, VALIDATION_LIMITS.maxImagesPerListing),
    location: sanitizeString(payload.location, VALIDATION_LIMITS.locationMax),
    availabilityStatus: 'Available' as AvailabilityStatus,
    listingStatus: 'Active' as ListingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, data);
    return listingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateListing(
  listingId: string,
  payload: Omit<CreateListingPayload, 'listingId'>,
  seller: UserProfile
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId), {
      title: sanitizeString(payload.title, VALIDATION_LIMITS.titleMax),
      description: sanitizeString(payload.description, VALIDATION_LIMITS.descriptionMax),
      category: payload.category,
      price: Number(payload.price),
      condition: payload.condition,
      images: payload.images.slice(0, VALIDATION_LIMITS.maxImagesPerListing),
      location: sanitizeString(payload.location, VALIDATION_LIMITS.locationMax),
      sellerName: sanitizeString(seller.fullName, VALIDATION_LIMITS.fullNameMax),
      sellerCollege: sanitizeString(seller.collegeName, VALIDATION_LIMITS.collegeNameMax),
      sellerAccountStatus: seller.accountStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateListingAvailability(
  listingId: string,
  availabilityStatus: AvailabilityStatus,
  listingStatus?: ListingStatus
): Promise<void> {
  const path = `listings/${listingId}`;
  const updateBody: Record<string, unknown> = {
    availabilityStatus,
    updatedAt: serverTimestamp(),
  };
  if (listingStatus) {
    updateBody.listingStatus = listingStatus;
  }

  try {
    await updateDoc(doc(db, 'listings', listingId), updateBody);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
