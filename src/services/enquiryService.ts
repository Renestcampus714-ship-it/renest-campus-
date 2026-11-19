import {
  collection,
  doc,
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
import type { Enquiry, EnquiryStatus, Listing, UserProfile } from '../types/marketplace';
import { sanitizeString } from '../utils/marketplaceLogic';
import { createNotification } from './notificationAndReportService';

export function subscribeBuyerEnquiries(
  buyerId: string,
  onData: (enquiries: Enquiry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'enquiries';
  const q = query(
    collection(db, path),
    where('buyerId', '==', buyerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as Enquiry));
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeSellerEnquiries(
  sellerId: string,
  onData: (enquiries: Enquiry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'enquiries';
  const q = query(
    collection(db, path),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as Enquiry));
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface CreateEnquiryInput {
  listing: Listing;
  buyer: UserProfile;
  message: string;
  preferredHandoverLocation?: string;
}

export async function createEnquiry(input: CreateEnquiryInput): Promise<string> {
  if (input.buyer.uid === input.listing.sellerId) {
    throw new Error('You cannot send an enquiry on your own listing.');
  }

  const enquiryRef = doc(collection(db, 'enquiries'));
  const enquiryId = enquiryRef.id;
  const path = `enquiries/${enquiryId}`;

  const data = {
    enquiryId,
    listingId: input.listing.listingId,
    listingTitle: sanitizeString(input.listing.title, VALIDATION_LIMITS.titleMax),
    listingPrice: Number(input.listing.price),
    buyerId: input.buyer.uid,
    buyerName: sanitizeString(input.buyer.fullName, VALIDATION_LIMITS.fullNameMax),
    sellerId: input.listing.sellerId,
    sellerName: sanitizeString(input.listing.sellerName, VALIDATION_LIMITS.fullNameMax),
    message: sanitizeString(input.message, VALIDATION_LIMITS.messageMax),
    sellerReply: '',
    preferredHandoverLocation: sanitizeString(
      input.preferredHandoverLocation || input.listing.location,
      VALIDATION_LIMITS.handoverLocationMax
    ),
    enquiryStatus: 'Pending' as EnquiryStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(enquiryRef, data);
    await createNotification({
      userId: input.listing.sellerId,
      actorId: input.buyer.uid,
      title: 'New item enquiry received',
      message: `${input.buyer.fullName} enquired about "${input.listing.title}".`,
      type: 'enquiry',
      linkPath: '/enquiries',
    });
    return enquiryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEnquiryBySeller(
  enquiry: Enquiry,
  nextStatus: Exclude<EnquiryStatus, 'Pending'>,
  sellerReply?: string
): Promise<void> {
  const path = `enquiries/${enquiry.enquiryId}`;
  try {
    await updateDoc(doc(db, 'enquiries', enquiry.enquiryId), {
      enquiryStatus: nextStatus,
      sellerReply: sanitizeString(sellerReply ?? enquiry.sellerReply ?? '', VALIDATION_LIMITS.messageMax),
      updatedAt: serverTimestamp(),
    });
    await createNotification({
      userId: enquiry.buyerId,
      actorId: enquiry.sellerId,
      title: `Enquiry ${nextStatus.toLowerCase()}`,
      message: `${enquiry.sellerName} marked your enquiry for "${enquiry.listingTitle}" as ${nextStatus}.`,
      type: 'enquiry',
      linkPath: '/enquiries',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function closeEnquiryByBuyer(enquiryId: string): Promise<void> {
  const path = `enquiries/${enquiryId}`;
  try {
    await updateDoc(doc(db, 'enquiries', enquiryId), {
      enquiryStatus: 'Closed' as EnquiryStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
