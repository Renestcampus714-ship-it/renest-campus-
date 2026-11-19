import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import type { AccommodationType, UserProfile } from '../types/marketplace';
import { sanitizeString } from '../utils/marketplaceLogic';
import { VALIDATION_LIMITS } from '../constants/marketplace';

export function mapFirebaseAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Contact support for assistance.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please check your credentials and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in or resetting your password.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 8 characters with letters and numbers.';
      case 'auth/too-many-requests':
        return 'Too many attempts detected. Please wait a few minutes before trying again.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Check your internet connection and retry.';
      case 'auth/configuration-not-found':
        return 'Firebase Authentication is not initialized yet for project "renest-campus". Open Firebase Console → Authentication → click "Get started", then enable "Google" and "Email/Password" under Sign-in method.';
      case 'auth/operation-not-allowed':
        return 'This sign-in provider is not yet enabled in Firebase Console for project "renest-campus" (Authentication → Sign-in method). Enable Google and Email/Password sign-in in Firebase Console.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for Firebase Authentication yet. Add this host under Firebase Console → Authentication → Settings → Authorized domains.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Google sign-in popup was closed before completing authentication. Click the button again to sign in.';
      case 'auth/popup-blocked':
        return 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method. Sign in with your existing method first.';
      case 'auth/expired-action-code':
        return 'This verification or password reset link has expired. Request a new one.';
      case 'auth/invalid-action-code':
        return 'This link is invalid or has already been used.';
      default:
        return error.message || 'Authentication failed. Please try again.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected authentication error occurred.';
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  collegeName: string;
  accommodationType: AccommodationType;
  phone?: string;
}

export async function registerWithEmail(input: RegisterInput): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password
  );

  const user = credential.user;
  const cleanName = sanitizeString(input.fullName, VALIDATION_LIMITS.fullNameMax);
  await updateProfile(user, { displayName: cleanName });

  try {
    await sendEmailVerification(user);
  } catch (verifyErr) {
    // Do not block registration if verification email dispatch is throttled
    console.warn('Email verification dispatch deferred:', verifyErr);
  }

  const profilePath = `users/${user.uid}`;
  const profileData: Record<string, unknown> = {
    uid: user.uid,
    fullName: cleanName,
    email: user.email || input.email.trim(),
    collegeName: sanitizeString(input.collegeName, VALIDATION_LIMITS.collegeNameMax),
    accommodationType: input.accommodationType,
    phone: sanitizeString(input.phone || '', VALIDATION_LIMITS.phoneMax),
    photoURL: '',
    emailVerified: false,
    accountStatus: 'Registered User',
    favouriteIds: [],
    recentlyViewedIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), profileData);
    const createdSnap = await getDoc(doc(db, 'users', user.uid));
    if (createdSnap.exists()) {
      return createdSnap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, profilePath);
  }

  return {
    uid: user.uid,
    fullName: cleanName,
    email: user.email || input.email.trim(),
    collegeName: sanitizeString(input.collegeName, VALIDATION_LIMITS.collegeNameMax),
    accommodationType: input.accommodationType,
    phone: sanitizeString(input.phone || '', VALIDATION_LIMITS.phoneMax),
    photoURL: '',
    emailVerified: false,
    accountStatus: 'Registered User',
    favouriteIds: [],
    recentlyViewedIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const profileRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const shouldSyncVerification =
        user.emailVerified && (!existing.emailVerified || existing.accountStatus !== 'Email Verified');

      if (shouldSyncVerification) {
        await updateDoc(profileRef, {
          emailVerified: true,
          accountStatus: 'Email Verified',
          updatedAt: serverTimestamp(),
        });
        return {
          ...existing,
          emailVerified: true,
          accountStatus: 'Email Verified',
        };
      }
      return existing;
    }

    const rawEmailPrefix = (user.email || 'Student User').split('@')[0];
    const candidateName =
      user.displayName && user.displayName.trim().length >= 2
        ? user.displayName
        : rawEmailPrefix.trim().length >= 2
          ? rawEmailPrefix
          : 'Student User';
    const fallbackName = sanitizeString(candidateName, VALIDATION_LIMITS.fullNameMax);
    const safePhotoURL =
      user.photoURL && user.photoURL.length <= 500 ? user.photoURL : '';

    const newProfile = {
      uid: user.uid,
      fullName: fallbackName.length >= 2 ? fallbackName : 'Student User',
      email: user.email || '',
      collegeName: 'DBS Global University',
      accommodationType: 'Hostel' as AccommodationType,
      phone: '',
      photoURL: safePhotoURL,
      emailVerified: Boolean(user.emailVerified),
      accountStatus: user.emailVerified ? ('Email Verified' as const) : ('Registered User' as const),
      favouriteIds: [] as string[],
      recentlyViewedIds: [] as string[],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(profileRef, newProfile);
    const refreshed = await getDoc(profileRef);
    return (refreshed.exists() ? refreshed.data() : newProfile) as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<UserProfile> {
  const credential = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(credential.user);
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return ensureUserProfile(credential.user);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function verifyResetCode(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(auth, oobCode);
}

export async function confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function applyEmailVerificationCode(oobCode: string): Promise<void> {
  await applyActionCode(auth, oobCode);
  if (auth.currentUser) {
    await auth.currentUser.reload();
    await ensureUserProfile(auth.currentUser);
  }
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Sign in to send a verification email.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function refreshEmailVerification(): Promise<UserProfile | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return ensureUserProfile(auth.currentUser);
}
