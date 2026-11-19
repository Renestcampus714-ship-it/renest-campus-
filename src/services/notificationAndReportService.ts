import {
  collection,
  deleteDoc,
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
import type { AppNotification, NotificationType, ReportReason } from '../types/marketplace';
import { sanitizeString } from '../utils/marketplaceLogic';

export function subscribeUserNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'notifications';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as AppNotification));
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface CreateNotificationInput {
  userId: string;
  actorId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkPath?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const ref = doc(collection(db, 'notifications'));
  const notificationId = ref.id;
  try {
    await setDoc(ref, {
      notificationId,
      userId: input.userId,
      actorId: input.actorId,
      title: sanitizeString(input.title, VALIDATION_LIMITS.titleMax),
      message: sanitizeString(input.message, 500),
      type: input.type,
      linkPath: sanitizeString(input.linkPath || '/dashboard', 200),
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${notificationId}`);
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${notificationId}`);
  }
}

export interface SubmitReportInput {
  listingId: string;
  reportedBy: string;
  reason: ReportReason;
  description: string;
}

export async function submitListingReport(input: SubmitReportInput): Promise<string> {
  const ref = doc(collection(db, 'reports'));
  const reportId = ref.id;
  try {
    await setDoc(ref, {
      reportId,
      listingId: input.listingId,
      reportedBy: input.reportedBy,
      reason: input.reason,
      description: sanitizeString(input.description, VALIDATION_LIMITS.reportDescriptionMax),
      status: 'Open',
      createdAt: serverTimestamp(),
    });
    return reportId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}`);
  }
}
