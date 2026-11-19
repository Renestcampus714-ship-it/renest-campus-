import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-[#EDE9DF]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-32 animate-pulse rounded-xl bg-[#EDE9DF]" />
            <div className="h-32 animate-pulse rounded-xl bg-[#EDE9DF]" />
            <div className="h-32 animate-pulse rounded-xl bg-[#EDE9DF]" />
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
