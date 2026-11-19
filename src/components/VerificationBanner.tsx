import { useState } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { mapFirebaseAuthError, resendVerificationEmail } from '../services/authService';

export function VerificationBanner() {
  const { firebaseUser, profile, refreshVerification } = useAuth();
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!firebaseUser || !profile || profile.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      showToast(
        'Verification email sent',
        'success',
        `Check ${firebaseUser.email} (including spam) for the Firebase verification link.`
      );
    } catch (error) {
      showToast('Could not send email', 'error', mapFirebaseAuthError(error));
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const verified = await refreshVerification();
      if (verified) {
        showToast('Email verified', 'success', 'Your account status is now Email Verified.');
      } else {
        showToast(
          'Not verified yet',
          'info',
          'Open the verification link in your inbox, then click Refresh Status.'
        );
      }
    } catch (error) {
      showToast('Status check failed', 'error', mapFirebaseAuthError(error));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="border-b border-[#DCD6C8] bg-[#EDE9DF] text-[#242B29]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-2.5 text-xs sm:text-sm">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#174C3C]" aria-hidden="true" />
          <p className="leading-snug">
            Account status: <strong className="font-semibold">Registered User</strong>. Verify{' '}
            <span className="font-medium">{firebaseUser.email}</span> to upgrade your status to{' '}
            <strong className="font-semibold">Email Verified</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="rounded-lg border border-[#174C3C] bg-white px-3 py-1.5 text-xs font-semibold text-[#174C3C] hover:bg-[#174C3C] hover:text-[#F8F7F2] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {sending ? 'Sending...' : 'Resend verification email'}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#174C3C] px-3 py-1.5 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
            {checking ? 'Checking...' : 'Refresh status'}
          </button>
        </div>
      </div>
    </div>
  );
}
