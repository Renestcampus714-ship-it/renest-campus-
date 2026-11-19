import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MainLayout } from '../layouts/MainLayout';
import {
  applyEmailVerificationCode,
  confirmResetPassword,
  mapFirebaseAuthError,
  verifyResetCode,
} from '../services/authService';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../validations/schemas';

export function AuthActionPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode') || '';
  const { showToast } = useToast();

  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!oobCode || !mode) {
      setStatus('error');
      setErrorMsg('Missing or invalid Firebase action link parameters.');
      return;
    }

    if (mode === 'verifyEmail') {
      applyEmailVerificationCode(oobCode)
        .then(() => {
          setStatus('done');
        })
        .catch((err) => {
          setStatus('error');
          setErrorMsg(mapFirebaseAuthError(err));
        });
    } else if (mode === 'resetPassword') {
      verifyResetCode(oobCode)
        .then((email) => {
          setAccountEmail(email);
          setStatus('ready');
        })
        .catch((err) => {
          setStatus('error');
          setErrorMsg(mapFirebaseAuthError(err));
        });
    } else {
      setStatus('error');
      setErrorMsg('Unsupported authentication action mode.');
    }
  }, [mode, oobCode]);

  const onSubmitReset = async (values: ResetPasswordFormValues) => {
    try {
      await confirmResetPassword(oobCode, values.newPassword);
      setStatus('done');
      showToast('Password updated', 'success', 'You can now sign in with your new password.');
    } catch (error) {
      const msg = mapFirebaseAuthError(error);
      setErrorMsg(msg);
      showToast('Reset failed', 'error', msg);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#DDD7C9] bg-white p-8 shadow-xs">
          {status === 'loading' && (
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#174C3C] border-t-transparent" />
              <p className="text-sm text-[#525C58]">Validating your security link...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-[#242B29]">
                Action Link Invalid or Expired
              </h1>
              <p className="text-sm text-red-800 leading-relaxed">{errorMsg}</p>
              <div className="flex gap-3 pt-2">
                <Link
                  to="/forgot-password"
                  className="rounded-lg bg-[#174C3C] px-4 py-2 text-sm font-semibold text-[#F8F7F2]"
                >
                  Request New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-[#D4CEC0] px-4 py-2 text-sm font-semibold text-[#242B29]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#174C3C]">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                <h1 className="font-display text-2xl font-bold text-[#242B29]">
                  {mode === 'verifyEmail' ? 'Email Verified' : 'Password Reset Complete'}
                </h1>
              </div>
              <p className="text-sm text-[#525C58] leading-relaxed">
                {mode === 'verifyEmail'
                  ? 'Your email address has been verified. Your ReNest Campus account is now Email Verified.'
                  : 'Your password has been updated. Sign in with your new credentials.'}
              </p>
              <Link
                to="/login"
                className="inline-flex rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2]"
              >
                Continue to Sign In
              </Link>
            </div>
          )}

          {status === 'ready' && mode === 'resetPassword' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-[#242B29]">
                Choose a new password
              </h1>
              <p className="mt-1.5 text-sm text-[#525C58]">
                Resetting password for <strong className="text-[#242B29]">{accountEmail}</strong>.
              </p>
              {errorMsg && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{errorMsg}</p>
              )}
              <form onSubmit={handleSubmit(onSubmitReset)} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="reset-pw" className="block text-xs font-semibold text-[#242B29]">
                    New Password (min 8 characters)
                  </label>
                  <input
                    id="reset-pw"
                    type="password"
                    {...register('newPassword')}
                    className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29]"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-red-700">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-pw"
                    className="block text-xs font-semibold text-[#242B29]"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="reset-confirm-pw"
                    type="password"
                    {...register('confirmPassword')}
                    className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29]"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-700">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {isSubmitting ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
