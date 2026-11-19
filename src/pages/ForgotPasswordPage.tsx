import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MainLayout } from '../layouts/MainLayout';
import { mapFirebaseAuthError, requestPasswordReset } from '../services/authService';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../validations/schemas';

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    try {
      await requestPasswordReset(values.email);
      setSentEmail(values.email);
      showToast('Reset link sent', 'success', 'Check your inbox for password reset instructions.');
    } catch (error) {
      const msg = mapFirebaseAuthError(error);
      setServerError(msg);
      showToast('Reset request failed', 'error', msg);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#DDD7C9] bg-white p-8 shadow-xs">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525C58] hover:text-[#174C3C]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Sign In
          </Link>

          <h1 className="mt-4 font-display text-2xl font-bold text-[#242B29]">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-[#525C58]">
            Enter the email address you used to register and Firebase Authentication will send a password reset link.
          </p>

          {sentEmail ? (
            <div className="mt-6 rounded-xl border border-[#C6DED4] bg-[#EDF5F1] p-5">
              <p className="text-sm font-semibold text-[#174C3C]">
                Password reset email dispatched
              </p>
              <p className="mt-1.5 text-xs text-[#525C58] leading-relaxed">
                We sent a reset link to <strong className="text-[#242B29]">{sentEmail}</strong>. Check your inbox and spam folder, then follow the link to choose a new password.
              </p>
              <button
                type="button"
                onClick={() => setSentEmail(null)}
                className="mt-4 text-xs font-semibold text-[#174C3C] hover:underline"
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900"
                >
                  {serverError}
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#242B29]">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60 transition-colors"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
