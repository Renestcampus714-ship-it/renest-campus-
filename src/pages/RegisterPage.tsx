import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { ACCOMMODATION_TYPES } from '../constants/marketplace';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MainLayout } from '../layouts/MainLayout';
import {
  loginWithGoogle,
  mapFirebaseAuthError,
  registerWithEmail,
} from '../services/authService';
import type { AccommodationType } from '../types/marketplace';
import { registerSchema, type RegisterFormValues } from '../validations/schemas';

export function RegisterPage() {
  const { firebaseUser, authLoading, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      collegeName: 'DBS Global University',
      accommodationType: 'Hostel',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (!authLoading && firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerWithEmail({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        collegeName: values.collegeName,
        accommodationType: values.accommodationType as AccommodationType,
        phone: values.phone,
      });
      await refreshProfile();
      showToast(
        'Account created',
        'success',
        'A verification link has been dispatched to your email address.'
      );
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const msg = mapFirebaseAuthError(error);
      setServerError(msg);
      showToast('Registration failed', 'error', msg);
    }
  };

  const handleGoogleSignUp = async () => {
    setServerError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      await refreshProfile();
      showToast(
        'Signed in with Google',
        'success',
        'Your ReNest Campus account is ready. You can update your college or hostel in Profile.'
      );
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const msg = mapFirebaseAuthError(error);
      setServerError(msg);
      showToast('Google sign-in failed', 'error', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-[#DDD7C9] bg-white p-8 shadow-xs">
          <h1 className="font-display text-2xl font-bold text-[#242B29]">
            Create your ReNest Campus account
          </h1>
          <p className="mt-1.5 text-sm text-[#525C58]">
            Open to students across colleges and universities. Any valid email address is welcome.
          </p>

          {serverError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 leading-relaxed"
            >
              {serverError}
            </div>
          )}

          <div className="mt-6">
            <GoogleSignInButton
              label="Continue with Google"
              loading={googleLoading}
              disabled={isSubmitting}
              onClick={handleGoogleSignUp}
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#DDD7C9]" />
            <span className="text-xs font-medium text-[#525C58]">or register with email</span>
            <div className="h-px flex-1 bg-[#DDD7C9]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-semibold text-[#242B29]">
                Full Name
              </label>
              <input
                id="reg-fullname"
                type="text"
                autoComplete="name"
                placeholder="e.g. Neha Kamboj"
                {...register('fullName')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-700">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-[#242B29]">
                Email Address
              </label>
              <input
                id="reg-email"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-college" className="block text-xs font-semibold text-[#242B29]">
                  College / University Name
                </label>
                <input
                  id="reg-college"
                  type="text"
                  placeholder="DBS Global University"
                  {...register('collegeName')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                />
                {errors.collegeName && (
                  <p className="mt-1 text-xs text-red-700">{errors.collegeName.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-accommodation"
                  className="block text-xs font-semibold text-[#242B29]"
                >
                  Accommodation Type
                </label>
                <select
                  id="reg-accommodation"
                  {...register('accommodationType')}
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  {ACCOMMODATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.accommodationType && (
                  <p className="mt-1 text-xs text-red-700">
                    {errors.accommodationType.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#242B29]">
                Phone Number (Optional — kept private)
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98XXXXXXXX"
                {...register('phone')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-700">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-[#242B29]">
                Password (min 8 characters)
              </label>
              <div className="relative mt-1.5">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  {...register('password')}
                  className="w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 pr-10 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#525C58]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-700">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-semibold text-[#242B29]"
              >
                Confirm Password
              </label>
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                {...register('confirmPassword')}
                className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3.5 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-700">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60 transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 border-t border-[#EDE9DF] pt-5 text-center text-sm text-[#525C58]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#174C3C] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
