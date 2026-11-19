import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { MVP_SERVICE_FEE_INR, VALIDATION_LIMITS } from '../constants/marketplace';
import type {
  AvailabilityStatus,
  Enquiry,
  Listing,
  TransactionRecord,
  TransactionStatus,
} from '../types/marketplace';
import { sanitizeString } from '../utils/marketplaceLogic';
import { createNotification } from './notificationAndReportService';

export function subscribeBuyerTransactions(
  buyerId: string,
  onData: (transactions: TransactionRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'transactions';
  const q = query(
    collection(db, path),
    where('buyerId', '==', buyerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as TransactionRecord));
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeSellerTransactions(
  sellerId: string,
  onData: (transactions: TransactionRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'transactions';
  const q = query(
    collection(db, path),
    where('sellerId', '==', sellerId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as TransactionRecord));
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface AcceptEnquiryTransactionInput {
  enquiry: Enquiry;
  handoverLocation: string;
  handoverWindow?: string;
  sellerReply?: string;
}

export async function acceptEnquiryAndCreateTransaction(
  input: AcceptEnquiryTransactionInput
): Promise<string> {
  const txRef = doc(collection(db, 'transactions'));
  const transactionId = txRef.id;
  const listingRef = doc(db, 'listings', input.enquiry.listingId);
  const enquiryRef = doc(db, 'enquiries', input.enquiry.enquiryId);

  try {
    await runTransaction(db, async (transaction) => {
      const listingSnap = await transaction.get(listingRef);
      if (!listingSnap.exists()) {
        throw new Error('This listing no longer exists.');
      }
      const listing = listingSnap.data() as Listing;
      if (listing.listingStatus !== 'Active' || listing.availabilityStatus !== 'Available') {
        throw new Error(
          `Cannot reserve "${listing.title}" because its current status is ${listing.availabilityStatus}.`
        );
      }

      const enquirySnap = await transaction.get(enquiryRef);
      if (!enquirySnap.exists()) {
        throw new Error('Enquiry record not found.');
      }
      const latestEnquiry = enquirySnap.data() as Enquiry;
      if (latestEnquiry.enquiryStatus === 'Declined' || latestEnquiry.enquiryStatus === 'Closed') {
        throw new Error('This enquiry is already closed or declined.');
      }

      transaction.update(listingRef, {
        availabilityStatus: 'Reserved' as AvailabilityStatus,
        updatedAt: serverTimestamp(),
      });

      transaction.update(enquiryRef, {
        enquiryStatus: 'Accepted',
        sellerReply: sanitizeString(
          input.sellerReply || 'Accepted for campus handover.',
          VALIDATION_LIMITS.messageMax
        ),
        updatedAt: serverTimestamp(),
      });

      transaction.set(txRef, {
        transactionId,
        listingId: listing.listingId,
        enquiryId: input.enquiry.enquiryId,
        buyerId: input.enquiry.buyerId,
        buyerName: sanitizeString(input.enquiry.buyerName, VALIDATION_LIMITS.fullNameMax),
        sellerId: input.enquiry.sellerId,
        sellerName: sanitizeString(input.enquiry.sellerName, VALIDATION_LIMITS.fullNameMax),
        itemTitle: sanitizeString(listing.title, VALIDATION_LIMITS.titleMax),
        itemPrice: Number(listing.price),
        serviceFee: MVP_SERVICE_FEE_INR,
        transactionStatus: 'Accepted' as TransactionStatus,
        handoverLocation: sanitizeString(
          input.handoverLocation,
          VALIDATION_LIMITS.handoverLocationMax
        ),
        handoverWindow: sanitizeString(
          input.handoverWindow || 'Mutual campus pickup window',
          VALIDATION_LIMITS.handoverWindowMax
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await createNotification({
      userId: input.enquiry.buyerId,
      actorId: input.enquiry.sellerId,
      title: 'Handover accepted & item reserved',
      message: `${input.enquiry.sellerName} reserved "${input.enquiry.listingTitle}" for you at ${input.handoverLocation}.`,
      type: 'transaction',
      linkPath: '/transactions',
    });

    return transactionId;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Cannot reserve') || error.message.includes('no longer exists') || error.message.includes('already closed'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `transactions/${transactionId}`);
  }
}

export async function updateTransactionStatusAtomic(
  tx: TransactionRecord,
  nextStatus: TransactionStatus,
  actorUid: string,
  handoverLocation?: string,
  handoverWindow?: string
): Promise<void> {
  const txRef = doc(db, 'transactions', tx.transactionId);
  const listingRef = doc(db, 'listings', tx.listingId);

  try {
    await runTransaction(db, async (transaction) => {
      const txSnap = await transaction.get(txRef);
      if (!txSnap.exists()) {
        throw new Error('Transaction record not found.');
      }
      const currentTx = txSnap.data() as TransactionRecord;
      if (
        currentTx.transactionStatus === 'Completed' ||
        currentTx.transactionStatus === 'Cancelled'
      ) {
        throw new Error(`Transaction is already ${currentTx.transactionStatus.toLowerCase()}.`);
      }

      const listingSnap = await transaction.get(listingRef);
      const isSeller = actorUid === currentTx.sellerId;

      if (isSeller) {
        transaction.update(txRef, {
          transactionStatus: nextStatus,
          handoverLocation: sanitizeString(
            handoverLocation ?? currentTx.handoverLocation,
            VALIDATION_LIMITS.handoverLocationMax
          ),
          handoverWindow: sanitizeString(
            handoverWindow ?? currentTx.handoverWindow ?? '',
            VALIDATION_LIMITS.handoverWindowMax
          ),
          updatedAt: serverTimestamp(),
        });

        if (listingSnap.exists()) {
          const listing = listingSnap.data() as Listing;
          if (nextStatus === 'Accepted' || nextStatus === 'Handover Scheduled') {
            if (listing.availabilityStatus === 'Available' || listing.availabilityStatus === 'Reserved') {
              transaction.update(listingRef, {
                availabilityStatus: 'Reserved' as AvailabilityStatus,
                updatedAt: serverTimestamp(),
              });
            } else {
              throw new Error(`Listing is currently ${listing.availabilityStatus} and cannot be reserved.`);
            }
          } else if (nextStatus === 'Completed') {
            transaction.update(listingRef, {
              availabilityStatus: 'Sold' as AvailabilityStatus,
              updatedAt: serverTimestamp(),
            });
          } else if (nextStatus === 'Cancelled' && listing.availabilityStatus === 'Reserved') {
            transaction.update(listingRef, {
              availabilityStatus: 'Available' as AvailabilityStatus,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } else {
        if (nextStatus !== 'Cancelled') {
          throw new Error('Only the seller can advance handover statuses.');
        }
        transaction.update(txRef, {
          transactionStatus: 'Cancelled' as TransactionStatus,
          updatedAt: serverTimestamp(),
        });
      }
    });

    const recipientUid = actorUid === tx.sellerId ? tx.buyerId : tx.sellerId;
    await createNotification({
      userId: recipientUid,
      actorId: actorUid,
      title: `Transaction ${nextStatus}`,
      message: `Handover for "${tx.itemTitle}" was updated to ${nextStatus}.`,
      type: 'transaction',
      linkPath: '/transactions',
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('already') || error.message.includes('cannot be reserved') || error.message.includes('Only the seller'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${tx.transactionId}`);
  }
}
