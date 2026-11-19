import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  ensureUserProfile,
  logoutUser,
  refreshEmailVerification,
} from '../services/authService';
import {
  getUserProfile,
  recordRecentlyViewed,
  toggleFavouriteListing,
} from '../services/userService';
import type { UserProfile } from '../types/marketplace';
import { useToast } from './ToastContext';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  authError: string | null;
  refreshProfile: () => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  toggleFavourite: (listingId: string) => Promise<void>;
  markRecentlyViewed: (listingId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadProfileForUser = useCallback(async (user: User) => {
    try {
      const loaded = await ensureUserProfile(user);
      setProfile(loaded);
      setAuthError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load your student profile.';
      setAuthError(message);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfileForUser(user);
      } else {
        setProfile(null);
        setAuthError(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [loadProfileForUser]);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    const latest = await getUserProfile(auth.currentUser.uid);
    if (latest) {
      setProfile(latest);
    } else {
      await loadProfileForUser(auth.currentUser);
    }
  }, [loadProfileForUser]);

  const refreshVerification = useCallback(async (): Promise<boolean> => {
    const updated = await refreshEmailVerification();
    if (updated) {
      setProfile(updated);
      setFirebaseUser(auth.currentUser);
      return updated.emailVerified;
    }
    return false;
  }, []);

  const toggleFavourite = useCallback(
    async (listingId: string) => {
      if (!firebaseUser || !profile) {
        showToast('Sign in required', 'info', 'Log in to save items to your favourites.');
        return;
      }
      const next = await toggleFavouriteListing(
        firebaseUser.uid,
        listingId,
        profile.favouriteIds || []
      );
      const added = next.includes(listingId);
      setProfile((prev) => (prev ? { ...prev, favouriteIds: next } : prev));
      showToast(
        added ? 'Saved to favourites' : 'Removed from favourites',
        'success'
      );
    },
    [firebaseUser, profile, showToast]
  );

  const markRecentlyViewed = useCallback(
    async (listingId: string) => {
      if (!firebaseUser || !profile) return;
      const current = profile.recentlyViewedIds || [];
      if (current[0] === listingId) return;
      const next = [listingId, ...current.filter((id) => id !== listingId)].slice(0, 20);
      setProfile((prev) => (prev ? { ...prev, recentlyViewedIds: next } : prev));
      try {
        await recordRecentlyViewed(firebaseUser.uid, listingId, current);
      } catch (err) {
        console.warn('Could not update recently viewed history:', err);
      }
    },
    [firebaseUser, profile]
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setProfile(null);
    setFirebaseUser(null);
    showToast('Signed out', 'success', 'Your ReNest Campus session has ended.');
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        authLoading,
        authError,
        refreshProfile,
        refreshVerification,
        toggleFavourite,
        markRecentlyViewed,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
